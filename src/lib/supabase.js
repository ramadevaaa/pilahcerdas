import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL atau Anon Key belum dikonfigurasi di file .env!\n' +
    'Aplikasi akan berjalan dalam mode Offline-First (LocalStorage-First Fallback).'
  );
}

// Inisialisasi client Supabase dengan aman (jika sudah dikonfigurasi)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
