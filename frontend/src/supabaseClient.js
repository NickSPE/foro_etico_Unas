import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;
let configError = null;

if (!supabaseUrl || !supabaseAnonKey) {
  configError = 'Variables de entorno de Supabase incompletas o ausentes.';
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    configError = err.message;
  }
}

export const supabase = client;
export const isSupabaseConfigured = !!client;
export const supabaseConfigError = configError;

