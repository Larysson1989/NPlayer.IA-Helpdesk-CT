-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: chat_logs — novos campos (resposta, session_id, satisfacao)
-- A tabela já possui "pergunta" e "created_at" — sem RENAME necessário
-- Executar no Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Resposta da IA
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS resposta text;

-- 2. Session ID (agrupa mensagens de uma mesma sessão)
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- 3. Satisfação do usuário: 1=Ruim | 2=Ok | 3=Ótimo (NULL = sem avaliação)
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS satisfacao smallint
    CHECK (satisfacao IS NULL OR satisfacao BETWEEN 1 AND 3);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS chat_logs_session_id_idx ON public.chat_logs(session_id);
CREATE INDEX IF NOT EXISTS chat_logs_satisfacao_idx ON public.chat_logs(satisfacao);

-- 5. Documentação inline
COMMENT ON COLUMN public.chat_logs.resposta   IS 'Texto da resposta gerada pela IA (Gemini)';
COMMENT ON COLUMN public.chat_logs.session_id IS 'Agrupa mensagens de uma mesma sessão de conversa';
COMMENT ON COLUMN public.chat_logs.satisfacao IS '1 = Ruim | 2 = Ok | 3 = Ótimo';
