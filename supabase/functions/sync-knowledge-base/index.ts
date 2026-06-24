import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Google Auth ───────────────────────────────────────────────────────────────
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${encode(header)}.${encode(payload)}`

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  )
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${sig64}`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error(`Auth falhou: ${JSON.stringify(tokenData)}`)
  return tokenData.access_token
}

// ─── Lista arquivos no Drive ───────────────────────────────────────────────────
async function listDriveFiles(folderId: string, token: string) {
  const mimeTypes = [
    'application/pdf',
    'text/plain',
    'application/rtf',
    'application/msword',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]
  const mimeQuery = mimeTypes.map(m => `mimeType='${m}'`).join(' or ')
  const q = encodeURIComponent(`'${folderId}' in parents and (${mimeQuery}) and trashed=false`)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return (data.files || []) as Array<{ id: string; name: string; mimeType: string; size?: string }>
}

// ─── Extrai texto de Google Docs/Slides nativos (export direto) ───────────────
async function extractGoogleNative(fileId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    console.log(`  ⚠️ Export nativo falhou (${res.status})`)
    return ''
  }
  return await res.text()
}

// ─── Extrai texto de TXT/RTF (download direto) ────────────────────────────────
async function extractPlainText(fileId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return ''
  return await res.text()
}

// ─── Extrai texto de PDF/DOCX/PPTX via upload multipart + export ──────────────
// Faz upload do arquivo para o Drive como Google Doc (sem salvar permanentemente
// usando upload session) e exporta o texto. 
// Para arquivos grandes (>= 10MB), usa apenas as primeiras páginas.
async function extractViaDriveImport(
  fileId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  token: string
): Promise<string> {

  // Limite de 10MB para evitar timeout e 413
  const MAX_BYTES = 10 * 1024 * 1024

  // Passo 1: Baixa o arquivo do Drive (limitado a MAX_BYTES)
  const rangeHeader = fileSize > MAX_BYTES
    ? { 'Range': `bytes=0-${MAX_BYTES - 1}` }
    : {}

  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}`, ...rangeHeader } }
  )

  if (!downloadRes.ok && downloadRes.status !== 206) {
    console.log(`  ⚠️ Download falhou (${downloadRes.status})`)
    return ''
  }

  const fileBytes = new Uint8Array(await downloadRes.arrayBuffer())
  console.log(`  → Baixado: ${fileBytes.length} bytes`)

  // Passo 2: Faz upload multipart para o Drive convertendo para Google Doc
  // Isso cria um arquivo temporário que precisamos deletar depois
  const boundary = `boundary_${Date.now()}`
  const metadata = JSON.stringify({
    name: `_tmp_${fileId}`,
    mimeType: 'application/vnd.google-apps.document',
    parents: [], // sem pasta — vai para root da service account
  })

  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
  const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  const closing  = `\r\n--${boundary}--`

  const metaBytes  = new TextEncoder().encode(metaPart)
  const fileHeader = new TextEncoder().encode(filePart)
  const closeBytes = new TextEncoder().encode(closing)

  const body = new Uint8Array(metaBytes.length + fileHeader.length + fileBytes.length + closeBytes.length)
  body.set(metaBytes,  0)
  body.set(fileHeader, metaBytes.length)
  body.set(fileBytes,  metaBytes.length + fileHeader.length)
  body.set(closeBytes, metaBytes.length + fileHeader.length + fileBytes.length)

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.log(`  ⚠️ Upload multipart falhou (${uploadRes.status}): ${err.slice(0, 200)}`)
    return ''
  }

  const uploadData = await uploadRes.json()
  const docId = uploadData.id

  try {
    // Passo 3: Exporta o Doc temporário como texto plano
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!exportRes.ok) {
      console.log(`  ⚠️ Export falhou (${exportRes.status})`)
      return ''
    }

    const text = await exportRes.text()
    return text

  } finally {
    // Passo 4: Sempre deleta o Doc temporário (mesmo que export falhe)
    fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    ).catch(() => {})
    console.log(`  🗑️ Doc temporário deletado`)
  }
}

// ─── Router de extração por tipo ──────────────────────────────────────────────
async function extractText(
  file: { id: string; name: string; mimeType: string; size?: string },
  token: string
): Promise<string> {
  const { id, mimeType, size } = file
  const fileSize = size ? parseInt(size) : 0

  // Google Docs/Slides nativos — export direto, sem upload
  if (
    mimeType === 'application/vnd.google-apps.document' ||
    mimeType === 'application/vnd.google-apps.presentation'
  ) {
    return await extractGoogleNative(id, token)
  }

  // TXT puro — download direto
  if (mimeType === 'text/plain') {
    return await extractPlainText(id, token)
  }

  // RTF — tenta como texto puro primeiro
  if (mimeType === 'application/rtf' || mimeType === 'application/msword') {
    const txt = await extractPlainText(id, token)
    if (txt.length > 50) return txt
  }

  // PDF, DOCX, PPTX — upload multipart + export
  return await extractViaDriveImport(id, file.name, mimeType, fileSize, token)
}

// ─── Limpa texto (remove encoding lixo e espaços excessivos) ─────────────────
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]{3,}/g, ' ')
    .trim()
}

// ─── Divide texto em chunks ────────────────────────────────────────────────────
function chunkText(text: string, maxChars = 1500): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n{2,}/)
  let current = ''
  for (const para of paragraphs) {
    if ((current + para).length > maxChars) {
      if (current) chunks.push(current.trim())
      current = para
    } else {
      current += (current ? '\n\n' : '') + para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(c => c.length > 20)
}

// ─── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    const folderId           = Deno.env.get('GOOGLE_FOLDER_ID')
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
    const supabaseKey        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!serviceAccountJson || !folderId) {
      return new Response(JSON.stringify({ error: 'Secrets não configurados' }), { status: 500 })
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔑 Autenticando no Google...')
    const token = await getGoogleAccessToken(serviceAccount)

    console.log('📁 Listando arquivos...')
    const files = await listDriveFiles(folderId, token)
    console.log(`📄 ${files.length} arquivo(s) encontrado(s)`)

    const results = []

    for (const file of files) {
      try {
        console.log(`⏳ Processando: ${file.name} (${file.mimeType}) [${file.size ? Math.round(parseInt(file.size)/1024) + 'KB' : 'tamanho desconhecido'}]`)

        const rawText = await extractText(file, token)
        const text    = cleanText(rawText)
        console.log(`  → Texto extraído: ${text.length} chars`)

        if (text.length < 30) {
          console.log(`  ⛔ Skipped: texto insuficiente`)
          results.push({ file: file.name, status: 'skipped', reason: 'texto insuficiente' })
          continue
        }

        const chunks = chunkText(text)
        const ext    = file.name.split('.').pop()?.toLowerCase() || 'unknown'

        await supabase.from('knowledge_base').delete().eq('file_id', file.id)

        const rows = chunks.map((content, i) => ({
          file_id:     file.id,
          file_name:   file.name,
          file_type:   ext,
          chunk_index: i,
          content,
        }))

        const { error } = await supabase.from('knowledge_base').insert(rows)
        if (error) throw error

        results.push({ file: file.name, status: 'ok', chunks: chunks.length })
        console.log(`✅ ${file.name} → ${chunks.length} chunk(s)`)

      } catch (err) {
        console.error(`❌ Erro em ${file.name}:`, err)
        results.push({ file: file.name, status: 'error', error: String(err) })
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: files.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Erro geral:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})