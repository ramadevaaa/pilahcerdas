import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL atau Anon Key belum dikonfigurasi di file .env!\n' +
    'Dashboard akan berjalan dalam mode offline/demo dengan data tiruan yang stabil.'
  );
}

// Inisialisasi client Supabase dengan aman (jika sudah dikonfigurasi)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
