import { createClient } from '@supabase/supabase-js';

const safeStorage = {
  getItem: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* silencia */ }
  },
  removeItem: (key: string): void => {
    try { localStorage.removeItem(key); } catch { /* silencia */ }
  },
};

export const supabase = createClient(
  'https://uinfkxxfmowkjixcduuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbmZreHhmbW93a2ppeGNkdXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzc0NjcsImV4cCI6MjA5NDY1MzQ2N30.6fkxUMbliL8WncNHpWhvDejLpN1-ttSCDGDxIYrYeA0',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // Necessário para processar o token de recovery/magic-link da URL
      detectSessionInUrl: true,
      storage: safeStorage,
    },
  }
);
