// src/services/userService.ts
import { supabase } from '../lib/supabase'; // ajuste o path

export async function getUserProfile(email: string) {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('name, email, phone, avatar_url, role, can_admin')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(email: string, updates: {
  name?: string;
  phone?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase
    .from('user_permissions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('email', email)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function uploadAvatar(email: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `avatars/${email.replace('@', '_')}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars') // crie este bucket no Supabase Storage
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function submitSupportTicket(payload: {
  email: string;
  name: string;
  subject: string;
  category: string;
  description: string;
}) {
  // Salva em system_logs como registro de suporte
  const { error } = await supabase
    .from('system_logs')
    .insert({
      id: crypto.randomUUID(),
      client_id: 'support',
      user: payload.email,
      action: `[${payload.category.toUpperCase()}] ${payload.subject}: ${payload.description}`,
      type: 'support_ticket',
    });

  if (error) throw error;
}
