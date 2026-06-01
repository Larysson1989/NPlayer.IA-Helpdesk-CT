import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';

export async function uploadAvatar(email: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = \.\;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error('Upload erro:', error.message); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function saveAvatarUrl(email: string, url: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ email, avatar_url: url }, { onConflict: 'email' });
  if (error) { console.error('Salvar URL erro:', error.message); return false; }
  return true;
}

export async function getAvatarUrl(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('email', email)
    .single();
  if (error || !data) return null;
  return data.avatar_url ?? null;
}
