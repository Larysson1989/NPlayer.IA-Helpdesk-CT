import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://uinfkxxfmowkjixcduuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbmZreHhmbW93a2ppeGNkdXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzc0NjcsImV4cCI6MjA5NDY1MzQ2N30.6fkxUMbliL8WncNHpWhvDejLpN1-ttSCDGDxIYrYeA0',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,   // ← evita o loop ao mudar de URL
      storageKey: 'nplayer-auth',  // ← chave fixa independente do domínio
    }
  }
);
