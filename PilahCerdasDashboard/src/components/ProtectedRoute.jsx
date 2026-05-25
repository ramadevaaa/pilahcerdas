import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function ProtectedRoute({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      // 1. Jika Supabase tidak dikonfigurasi, gunakan LocalStorage (mode offline/demo)
      if (!isSupabaseConfigured) {
        const isOfflineLoggedIn = localStorage.getItem('pilah_admin_logged_in') === 'true';
        setAuthorized(isOfflineLoggedIn);
        return;
      }

      // 2. Jika Supabase dikonfigurasi, periksa sesi pengguna
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Anda bisa menambahkan pengecekan tambahan apakah email berakhiran pemerintah daerah
          // atau memiliki metadata role: admin. Di sini kita membolehkan sesi aktif apa pun.
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (e) {
        console.error('Pengecekan autentikasi gagal:', e);
        setAuthorized(false);
      }
    }

    checkAuth();
  }, []);

  // Sambil menunggu proses pengecekan
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-brand-textSecondary font-bold mt-4 animate-pulse">Menghubungkan Sesi...</p>
        </div>
      </div>
    );
  }

  // Jika tidak terotorisasi, arahkan ke halaman login
  if (!authorized) {
    // Alihkan menggunakan Vanilla JS untuk kemudahan tanpa dependensi Router yang ketat
    window.location.hash = '/login';
    return null;
  }

  // Jika sukses terotorisasi
  return children;
}
