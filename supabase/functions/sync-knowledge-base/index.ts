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

// ─── Lista arquivos ───────────────────────────────────────────────────────────
async function listDriveFiles(folderId: string, token: string) {
  const mimeTypes = [
    'application/pdf',
    'text/plain',
    'application/rtf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
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

// ─── Extrai texto via Gemini File API (sem carregar tudo na memória) ────────
async function extractTextViaGemini(
  fileId: string,
  mimeType: string,
  fileName: string,
  driveToken: string,
  geminiKey: string
): Promise<string> {
  // 1. Obtém URL de download do Drive
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

  // 2. Para TXT, lemos diretamente sem passar pelo Gemini
  if (mimeType === 'text/plain') {
    const res = await fetch(driveUrl, { headers: { Authorization: `Bearer ${driveToken}` } })
    return res.text()
  }

  // 3. Faz upload do arquivo para a Gemini File API (streaming)
  const driveRes = await fetch(driveUrl, { headers: { Authorization: `Bearer ${driveToken}` } })
  if (!driveRes.ok) throw new Error(`Drive download falhou: ${driveRes.status}`)

  const fileSize = parseInt(driveRes.headers.get('content-length') || '0')

  // Upload para Gemini File API
  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'X-Goog-Upload-Header-Content-Length': String(fileSize),
        'Content-Type': mimeType,
      },
      body: driveRes.body,
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    throw new Error(`Gemini upload falhou: ${err}`)
  }

  const uploadData = await uploadRes.json()
  const geminiFileUri = uploadData.file?.uri
  if (!geminiFileUri) throw new Error(`URI do arquivo Gemini não retornado`)

  // 4. Gera conteúdo com referência ao arquivo (sem base64 na memória)
  const prompt = mimeType.startsWith('image/')
    ? 'Extraia todo o texto visível nesta imagem. Retorne apenas o texto, sem comentários.'
    : 'Extraia todo o texto deste documento. Retorne apenas o texto puro, sem formatação markdown.'

  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { mime_type: mimeType, file_uri: geminiFileUri } }
          ]
        }]
      })
    }
  )

  const genData = await genRes.json()

  // 5. Deleta arquivo do Gemini após uso
  const geminiFileName = uploadData.file?.name
  if (geminiFileName) {
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${geminiFileName}?key=${geminiKey}`,
      { method: 'DELETE' }
    ).catch(() => {})
  }

  return genData.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ─── Divide texto em chunks ─────────────────────────────────────────────────
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
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

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

    console.log('📁 Listando arquivos...')
    const files = await listDriveFiles(folderId, token)
    console.log(`📄 ${files.length} arquivo(s) encontrado(s)`)

    const results = []

    for (const file of files) {
      try {
        console.log(`⏳ Processando: ${file.name} (${file.mimeType})`)

        const text = await extractTextViaGemini(
          file.id, file.mimeType, file.name, token, geminiKey
        )

        if (!text || text.length < 20) {
          results.push({ file: file.name, status: 'skipped', reason: 'texto muito curto' })
          continue
        }

        const chunks = chunkText(text)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown'

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
