import { supabase } from '../lib/supabase';

export interface CorrectionPayload {
  user_email: string;
  user_name: string;
  title: string;
  description: string;
  conversation_context?: string;
}

const TITLE_TO_TYPE: Record<string, 'duvidoso' | 'errado' | 'falho'> = {
  'Informação incorreta':    'errado',
  'Resposta duvidosa':       'duvidoso',
  'Contexto incompleto':     'falho',
  'Procedimento inadequado': 'falho',
  'Outro':                   'duvidoso',
};

export async function submitCorrection(payload: CorrectionPayload): Promise<void> {
  const { error } = await supabase
    .from('ai_corrections')
    .insert({
      user_email:      payload.user_email,
      user_name:       payload.user_name,
      correction_type: TITLE_TO_TYPE[payload.title] ?? 'duvidoso',
      note:            payload.description,
      context_text:    payload.conversation_context ?? '',
    });

  if (error) throw error;
}
