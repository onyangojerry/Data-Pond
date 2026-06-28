import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const missingSupabaseConfig = !supabaseUrl || !supabaseAnonKey;

function normalizeSupabaseUrl(url) {
  return new URL(url).origin;
}

export const supabase = missingSupabaseConfig ? null : createClient(normalizeSupabaseUrl(supabaseUrl), supabaseAnonKey);
