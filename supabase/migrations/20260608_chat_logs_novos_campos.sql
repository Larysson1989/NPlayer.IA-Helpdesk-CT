-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: chat_logs — novos campos + aliases de compatibilidade
-- Executar no Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Alias de compatibilidade: o código usa "pergunta" mas a coluna é "message"
--    Adicionamos "pergunta" como coluna gerada (view virtual via renaming não é
--    possível sem ALTER; usamos ADD COLUMN + trigger de sincronização abaixo).
--    Alternativa mais simples: renomear a coluna diretamente.
ALTER TABLE public.chat_logs
  RENAME COLUMN message TO pergunta;

-- 2. Alias de compatibilidade: o código usa "created_at" mas a coluna é "sent_at"
ALTER TABLE public.chat_logs
  RENAME COLUMN sent_at TO created_at;

-- 3. Novo campo: resposta da IA (texto completo retornado ao usuário)
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS resposta text;

-- 4. Novo campo: session_id (agrupa mensagens de uma mesma sessão de conversa)
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS session_id uuid default gen_random_uuid();

-- 5. Novo campo: satisfacao (avaliação do usuário — 1 ruim, 2 ok, 3 ótimo)
--    NULL = sem avaliação ainda
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS satisfacao smallint
    check (satisfacao is null or satisfacao between 1 and 3);

-- 6. Índices para os novos campos
CREATE INDEX IF NOT EXISTS chat_logs_session_id_idx  ON public.chat_logs(session_id);
CREATE INDEX IF NOT EXISTS chat_logs_satisfacao_idx  ON public.chat_logs(satisfacao);
CREATE INDEX IF NOT EXISTS chat_logs_created_at_idx  ON public.chat_logs(created_at DESC);

-- ─── Atualizar índice antigo (era sent_at, agora created_at) ─────────────────
DROP INDEX IF EXISTS chat_logs_sent_at_idx;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMENTÁRIOS (documentação inline no banco)
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.chat_logs.pergunta    IS 'Texto da pergunta enviada pelo usuário à IA';
COMMENT ON COLUMN public.chat_logs.resposta    IS 'Texto da resposta gerada pela IA (Gemini)';
COMMENT ON COLUMN public.chat_logs.session_id  IS 'Agrupa mensagens de uma mesma sessão de conversa';
COMMENT ON COLUMN public.chat_logs.satisfacao  IS '1 = Ruim | 2 = Ok | 3 = Ótimo — avaliação do usuário';
COMMENT ON COLUMN public.chat_logs.created_at  IS 'Timestamp de envio da mensagem';
