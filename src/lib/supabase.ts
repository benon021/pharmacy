import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gyzlobstembsiisypuzw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5emxvYnN0ZW1ic2lpc3lwdXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTMyNzgsImV4cCI6MjA5MjAyOTI3OH0.F64cySN6IvIoYkv5RHdc7Xcqti0ES-E7Xtxtt_80ecU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
