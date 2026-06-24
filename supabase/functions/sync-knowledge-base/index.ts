import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Google Auth ───────────────────────────────────────────────────────────────
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header  = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss:   serviceAccount.client_email,
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' '),
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
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-powerpoint',
  ]
  const mimeQuery = mimeTypes.map(m => `mimeType='${m}'`).join(' or ')
  const q = encodeURIComponent(`'${folderId}' in parents and (${mimeQuery}) and trashed=false`)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files || []
}

// ─── Extrai texto de Google Docs/Slides nativos ────────────────────────────────
async function extractGoogleNativeText(fileId: string, mimeType: string, token: string): Promise<string> {
  // Google Docs → exporta como texto plano
  // Google Slides → exporta como texto plano
  const exportMime = 'text/plain'
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    console.log(`  ⚠️ Export falhou (${res.status}): ${await res.text()}`)
    return ''
  }
  return await res.text()
}

// ─── Extrai texto de PDF com texto digital ─────────────────────────────────────
async function extractPdfAsText(fileId: string, token: string): Promise<string> {
  // Tenta exportar o PDF como Google Doc (Drive faz OCR/extração automática)
  // Passo 1: Copia o arquivo como Google Doc
  const copyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mimeType: 'application/vnd.google-apps.document',
        name: `_temp_extract_${fileId}`,
      }),
    }
  )

  if (!copyRes.ok) {
    const err = await copyRes.text()
    console.log(`  ⚠️ Copy para Doc falhou (${copyRes.status}): ${err}`)
    return ''
  }

  const copyData = await copyRes.json()
  const docId = copyData.id

  try {
    // Passo 2: Exporta o Doc como texto plano
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!exportRes.ok) {
      console.log(`  ⚠️ Export do Doc temporário falhou (${exportRes.status})`)
      return ''
    }

    const text = await exportRes.text()
    return text
  } finally {
    // Passo 3: Sempre deleta o Doc temporário
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    ).catch(() => {})
    console.log(`  🗑️ Doc temporário deletado`)
  }
}

// ─── Extrai texto de DOCX/PPTX ────────────────────────────────────────────────
async function extractOfficeText(fileId: string, token: string): Promise<string> {
  // Mesmo processo: copia como Google Doc e exporta como texto
  return await extractPdfAsText(fileId, token)
}

// ─── Extrai texto de arquivo TXT ──────────────────────────────────────────────
async function extractTxtText(fileId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return ''
  return await res.text()
}

// ─── Router de extração por tipo ──────────────────────────────────────────────
async function extractText(file: any, token: string): Promise<string> {
  const { id, mimeType } = file

  // Google Docs/Slides nativos
  if (
    mimeType === 'application/vnd.google-apps.document' ||
    mimeType === 'application/vnd.google-apps.presentation'
  ) {
    return await extractGoogleNativeText(id, mimeType, token)
  }

  // Texto plano
  if (mimeType === 'text/plain') {
    return await extractTxtText(id, token)
  }

  // PDF, DOCX, PPTX — todos pelo mesmo caminho: copia como Google Doc → exporta texto
  return await extractPdfAsText(id, token)
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
        console.log(`⏳ Processando: ${file.name} (${file.mimeType})`)

        const text = await extractText(file, token)
        console.log(`  → Texto extraído: ${text.length} chars`)

        if (!text || text.length < 30) {
          console.log(`  ⛔ Skipped: texto insuficiente (${text?.length || 0} chars)`)
          results.push({ file: file.name, status: 'skipped', reason: 'texto insuficiente' })
          continue
        }

        const chunks = chunkText(text)
        const ext = file.name.split('.').pop()?.toLowerCase() || file.mimeType

        // Remove chunks antigos deste arquivo
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