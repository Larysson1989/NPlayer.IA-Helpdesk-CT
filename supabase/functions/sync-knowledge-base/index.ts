import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── Google Auth (JWT para Service Account) ───────────────────────────────
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Importa chave privada RSA
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${signatureB64}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error(`Auth falhou: ${JSON.stringify(tokenData)}`)
  return tokenData.access_token
}

// ─── Lista arquivos da pasta do Drive ─────────────────────────────────────
async function listDriveFiles(folderId: string, token: string) {
  const supported = ['pdf', 'txt', 'doc', 'docx', 'rtf', 'ppt', 'pptx', 'png', 'jpg', 'jpeg']
  const mimeQuery = supported
    .map(ext => {
      const map: Record<string, string> = {
        pdf:  'application/pdf',
        txt:  'text/plain',
        rtf:  'application/rtf',
        doc:  'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt:  'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        png:  'image/png',
        jpg:  'image/jpeg',
        jpeg: 'image/jpeg',
      }
      return `mimeType='${map[ext]}'`
    })
    .join(' or ')

  const q = encodeURIComponent(`'${folderId}' in parents and (${mimeQuery}) and trashed=false`)
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=100`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  return data.files || []
}

// ─── Baixa conteúdo do arquivo ─────────────────────────────────────────────
async function downloadFile(fileId: string, token: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return res.arrayBuffer()
}

// ─── Extrai texto por tipo ─────────────────────────────────────────────────
async function extractText(buffer: ArrayBuffer, mimeType: string, fileName: string, geminiKey: string): Promise<string> {
  const isImage = ['image/png', 'image/jpeg'].includes(mimeType)
  const isText  = mimeType === 'text/plain'

  if (isText) {
    return new TextDecoder().decode(buffer)
  }

  if (isImage) {
    // OCR via Gemini Vision
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extraia todo o texto visível nesta imagem. Retorne apenas o texto, sem comentários.' },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }]
        })
      }
    )
    const json = await res.json()
    return json.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // PDF, DOC, DOCX, RTF, PPT, PPTX — envia para Gemini extrair texto
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Extraia todo o texto deste documento. Retorne apenas o texto puro, sem formatação markdown.' },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }]
      })
    }
  )
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ─── Divide texto em chunks ────────────────────────────────────────────────
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

// ─── Handler principal ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    const folderId           = Deno.env.get('GOOGLE_FOLDER_ID')
    const geminiKey          = Deno.env.get('GEMINI_API_KEY')
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
    const supabaseKey        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!serviceAccountJson || !folderId || !geminiKey) {
      return new Response(JSON.stringify({ error: 'Secrets não configurados' }), { status: 500 })
    }

    const serviceAccount = JSON.parse(serviceAccountJson)
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔑 Autenticando no Google...')
    const token = await getGoogleAccessToken(serviceAccount)

    console.log('📁 Listando arquivos da pasta...')
    const files = await listDriveFiles(folderId, token)
    console.log(`📄 ${files.length} arquivo(s) encontrado(s)`)

    const results = []

    for (const file of files) {
      try {
        console.log(`⏳ Processando: ${file.name}`)
        const buffer = await downloadFile(file.id, token)
        const text   = await extractText(buffer, file.mimeType, file.name, geminiKey)

        if (!text || text.length < 20) {
          results.push({ file: file.name, status: 'skipped', reason: 'texto muito curto' })
          continue
        }

        const chunks = chunkText(text)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown'

        // Remove chunks antigos deste arquivo
        await supabase.from('knowledge_base').delete().eq('file_id', file.id)

        // Insere novos chunks
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
