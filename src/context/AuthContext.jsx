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
  const [loading, setLoading] = useState(true);

  // Helper untuk emulasi email di balik layar menggunakan domain gmail.com agar lolos sensor MX Record Supabase
  const formatEmail = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, ''); // Bersihkan karakter non-angka
    return `pilah.${cleanPhone}@gmail.com`;
  };

  // Membaca data profil dari database Supabase (dengan proteksi propagasi JWT dan retry)
  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured || !supabase) return null;
    
    let retries = 3;
    let delay = 100;
    let lastError = null;

    while (retries > 0) {
      try {
        // Jeda mikro agar Supabase JS sempat menempelkan token JWT ke header kueri
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          lastError = error;
          throw error;
        }
        
        return data; // Berhasil mengambil data profil
      } catch (e) {
        lastError = e;
        console.warn(`[fetchProfile] Gagal mengambil profil untuk user ${userId} (Percobaan sisa: ${retries - 1}). Error:`, e);
        retries--;
        delay += 250; // Tingkatkan jeda waktu untuk percobaan berikutnya
      }
    }
    
    console.error(`[fetchProfile] Kritis: Gagal memuat profil setelah 3x percobaan. Error terakhir:`, lastError);
    return null;
  };

  // Cek sesi aktif saat pertama kali aplikasi dimuat & bersihkan sesi usang
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const checkSessionAndCleanObsolete = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (isMounted) {
            setUser(session.user);
            localStorage.setItem('pilah_user', JSON.stringify(session.user));
          }
          const userProfile = await fetchProfile(session.user.id);
          
          if (userProfile) {
            if (isMounted) {
              setProfile(userProfile);
              setIsGuest(false);
              localStorage.setItem('pilah_user_profile', JSON.stringify(userProfile));
              localStorage.setItem('pilah_is_guest', 'false');
            }
          } else {
            // Cek apakah ada profil di cache lokal
            const cachedProfile = localStorage.getItem('pilah_user_profile');
            if (!cachedProfile) {
              console.warn('⚠️ Sesi lama ditemukan tetapi data profil kosong di server. Melakukan pembersihan token...');
              await supabase.auth.signOut();
              if (isMounted) {
                setUser(null);
                setProfile(null);
                localStorage.removeItem('pilah_user');
                localStorage.removeItem('pilah_user_profile');
              }
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('pilah_user');
            localStorage.removeItem('pilah_user_profile');
          }
        }
      } catch (e) {
        console.error('Error saat verifikasi sesi lama:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSessionAndCleanObsolete();

    // Dengarkan perubahan status auth secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('pilah_user', JSON.stringify(session.user));
        
        const userProfile = await fetchProfile(session.user.id);
        if (userProfile) {
          setProfile(userProfile);
          setIsGuest(false);
          localStorage.setItem('pilah_user_profile', JSON.stringify(userProfile));
          localStorage.setItem('pilah_is_guest', 'false');
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('pilah_user');
        localStorage.removeItem('pilah_user_profile');
      }
    });

    return () => {
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
    setIsGuest(false);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('pilah_is_guest');
    localStorage.removeItem('pilah_user');
    localStorage.removeItem('pilah_user_profile');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
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
