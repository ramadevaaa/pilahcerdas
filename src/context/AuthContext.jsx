import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pilah_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(() => {
    try {
      const savedProfile = localStorage.getItem('pilah_user_profile');
      return savedProfile ? JSON.parse(savedProfile) : null;
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('pilah_is_guest') === 'true';
  });
  const [loading, setLoading] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pilah_user');
      const savedProfile = localStorage.getItem('pilah_user_profile');
      const isGuest = localStorage.getItem('pilah_is_guest') === 'true';
      
      // Jika ada data sesi dan profil warga di cache, atau masuk sebagai tamu, bypass loading screen!
      if ((savedUser && savedProfile) || isGuest) {
        return false;
      }
      return true; // Jika benar-benar kosong, tampilkan loading screen untuk check sesi awal
    } catch {
      return true;
    }
  });

  // Helper untuk emulasi email di balik layar menggunakan domain gmail.com agar lolos sensor MX Record Supabase
  const formatEmail = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, ''); // Bersihkan karakter non-angka
    return `pilah.${cleanPhone}@gmail.com`;
  };

  // Membaca data profil dari database Supabase (dengan proteksi propagasi JWT dan retry)
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("[AuthContext Debug] Supabase belum terkonfigurasi untuk fetchProfile.");
      return null;
    }
    
    console.log(`[AuthContext Debug] 🔍 fetchProfile() dipanggil untuk User ID: ${userId}`);
    let retries = 3;
    let delay = 100;
    let lastError = null;

    while (retries > 0) {
      const attemptNum = 4 - retries;
      try {
        console.log(`[AuthContext Debug]   - Percobaan #${attemptNum}: Menunggu jeda ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`[AuthContext Debug]   - Percobaan #${attemptNum}: Mengirim kueri SELECT ke tabel 'profiles'...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          lastError = error;
          throw error;
        }
        
        console.log(`[AuthContext Debug]   - Percobaan #${attemptNum}: ✅ BERHASIL memuat data profil:`, data);
        return data; // Berhasil mengambil data profil
      } catch (e) {
        lastError = e;
        console.error(`[AuthContext Debug]   - Percobaan #${attemptNum}: ❌ Gagal mengambil profil. Error detail:`, {
          message: e.message,
          code: e.code,
          hint: e.hint,
          details: e.details
        });
        retries--;
        delay += 250; // Tingkatkan jeda waktu untuk percobaan berikutnya
      }
    }
    
    console.error(`[AuthContext Debug] 🚨 Kritis: Gagal memuat profil setelah 3x percobaan. Error terakhir:`, lastError);
    return null;
  };

  // Sinkronisasi sesi aktif saat pertama kali aplikasi dimuat & dengarkan perubahan secara real-time
  useEffect(() => {
    console.log("[AuthContext Debug] 🏁 useEffect di-mount. Status konfigurasi Supabase:", {
      isSupabaseConfigured,
      hasSupabaseClient: !!supabase
    });

    if (!isSupabaseConfigured || !supabase) {
      console.warn("[AuthContext Debug] Supabase belum terkonfigurasi. Mematikan loading.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Dengarkan perubahan status auth secara real-time (Supabase otomatis memicu callback ini saat inisialisasi)
    console.log("[AuthContext Debug] 📡 Mendaftarkan listener onAuthStateChange...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log(`[AuthContext Debug] ⚡ Event Auth Terpicu: '${event}'`, {
        sessionExists: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      try {
        if (session?.user) {
          console.log("[AuthContext Debug] Sesi aktif terdeteksi. Memanggil fetchProfile() sebelum memperbarui state...");
          const userProfile = await fetchProfile(session.user.id);
          
          if (userProfile) {
            console.log("[AuthContext Debug] Profil valid diperoleh! Memperbarui state user & profile secara bersamaan...");
            setUser(session.user);
            setProfile(userProfile);
            setIsGuest(false);
            localStorage.setItem('pilah_user', JSON.stringify(session.user));
            localStorage.setItem('pilah_user_profile', JSON.stringify(userProfile));
            localStorage.setItem('pilah_is_guest', 'false');
          } else {
            console.warn("[AuthContext Debug] ⚠️ Sesi aktif terdeteksi tetapi fetchProfile() mengembalikan NULL. Kemungkinan dalam alur pendaftaran baru.");
            // PENTING: Jangan lakukan signOut paksa di sini agar kueri insert profil di signUpWarga tidak terganggu!
            // Jangan perbarui user/profile state agar layar Register/Login tidak ter-unmount secara prematur.
          }
        } else {
          console.log("[AuthContext Debug] Tidak ada sesi aktif (atau User Sign Out). Membersihkan state...");
          if (isMounted) {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('pilah_user');
            localStorage.removeItem('pilah_user_profile');
          }
        }
      } catch (err) {
        console.error('[AuthContext Debug] ❌ Terjadi error saat memproses status autentikasi:', err);
      } finally {
        if (isMounted) {
          console.log("[AuthContext Debug] 🏁 Akhir onAuthStateChange. Mengatur loading = false.");
          setLoading(false);
        }
      }
    });

    return () => {
      console.log("[AuthContext Debug] 🛑 useEffect di-unmount. Unsubscribe auth listener.");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fungsi Pendaftaran Warga Baru (Diperbaiki agar memaksa login sesudahnya)
  const signUpWarga = async (namaLengkap, phone, kabupaten, kecamatan, desa, banjar, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Koneksi database Supabase belum terkonfigurasi.');
    }

    const email = formatEmail(phone);

    // 1. Buat User di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registrasi tidak berhasil dijalankan.');

    // 2. Buat profil lengkap di tabel profiles
    const profileData = {
      id: data.user.id,
      nama_lengkap: namaLengkap,
      no_telepon: phone.trim(),
      kabupaten,
      kecamatan,
      desa,
      banjar,
      role: 'warga'
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error('Gagal memasukkan profil:', profileError);
      // Bersihkan sesi jika profil gagal dibuat
      await supabase.auth.signOut();
      throw new Error(`Registrasi berhasil tetapi profil gagal disimpan: ${profileError.message}`);
    }

    // PENTING: Sesuai brief Anda, kita paksa keluar (signOut) langsung setelah registrasi berhasil
    // agar token di browser bersih dan warga harus login secara manual di Login Page
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    localStorage.removeItem('pilah_user');
    localStorage.removeItem('pilah_user_profile');
    localStorage.removeItem('pilah_is_guest');

    return data;
  };

  // Fungsi Login Warga
  const loginWarga = async (phone, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Koneksi database Supabase belum terkonfigurasi.');
    }

    const email = formatEmail(phone);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile) {
        setUser(data.user);
        setProfile(userProfile);
        setIsGuest(false);
        localStorage.setItem('pilah_user', JSON.stringify(data.user));
        localStorage.setItem('pilah_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('pilah_is_guest', 'false');
      } else {
        // Jika user ada di Auth tapi profil tidak ada di DB, signOut paksa agar bersih
        await supabase.auth.signOut();
        throw new Error('Akun ditemukan tetapi profil warga Anda belum lengkap di database.');
      }
    }

    return data;
  };

  // Masuk Mode Tamu (Level 1)
  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setProfile(null);
    localStorage.setItem('pilah_is_guest', 'true');
    localStorage.removeItem('pilah_user');
    localStorage.removeItem('pilah_user_profile');
  };

  // Fungsi Keluar / Logout
  const logout = async () => {
    try {
      // Tunggu Supabase signOut selesai TERLEBIH DAHULU
      // agar tidak ada auth state mismatch (sesi server masih hidup tapi state lokal sudah bersih)
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('[AuthContext] Error saat signOut Supabase:', err);
    } finally {
      // Selalu bersihkan state lokal, meski signOut gagal
      setIsGuest(false);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('pilah_is_guest');
      localStorage.removeItem('pilah_user');
      localStorage.removeItem('pilah_user_profile');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isGuest,
      loading,
      signUpWarga,
      loginWarga,
      loginAsGuest,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
