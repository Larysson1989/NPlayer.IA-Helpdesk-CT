import { supabase } from '@/lib/supabase';

export interface CorrectionPayload {
  user_email: string;
  user_name: string;
  title: string;
  description: string;
  conversation_context?: string;
}

/**
 * Persiste uma ocorrência/correção de feedback no Supabase (tabela system_logs).
 */
export async function submitCorrection(payload: CorrectionPayload): Promise<void> {
  const { error } = await supabase
    .from('system_logs')
    .insert({
      id: crypto.randomUUID(),
      client_id: 'correction',
      user: payload.user_email,
      action: `[CORREÇÃO] ${payload.title}: ${payload.description}`,
      type: 'correction_feedback',
      metadata: {
        user_name: payload.user_name,
        title: payload.title,
        description: payload.description,
        conversation_context: payload.conversation_context ?? null,
      },
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}
