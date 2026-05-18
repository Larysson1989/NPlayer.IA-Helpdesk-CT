import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uinfkxxfmowkjixcduuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbmZreHhmbW93a2ppeGNkdXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzc0NjcsImV4cCI6MjA5NDY1MzQ2N30.6fkxUMbliL8WncNHpWhvDejLpN1-ttSCDGDxIYrYeA0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
