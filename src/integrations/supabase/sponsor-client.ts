import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SPONSOR_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SPONSOR_SUPABASE_ANON_KEY || '';

export const sponsorSupabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
