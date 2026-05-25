import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getLogCalculations } from '../lib/calculator';
import { useAuth } from '../context/AuthContext';

const QUEUE_KEY = 'pilah_logs_sync_queue';
const CACHE_KEY = 'pilah_logs_cache';
const REGENCY_KEY = 'pilah_user_regency';

export function useLog() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [regency, setRegency] = useState(() => localStorage.getItem(REGENCY_KEY) || '');

  // Menyimpan kabupaten asal user (untuk fallback jika profil belum termuat)
  const saveRegency = (newRegency) => {
    localStorage.setItem(REGENCY_KEY, newRegency);
    setRegency(newRegency);
  };

  // Membaca riwayat log (Kombinasi online & offline cache)
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    let localQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    
    // Tampilkan cache lokal terlebih dahulu agar UI instan merespon
    const combinedLocal = [...localQueue, ...localCache].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setLogs(combinedLocal);

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data, error } = await supabase
          .from('pilah_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        if (data) {
          // Perbarui cache lokal dengan data terbaru dari Supabase
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          // Gabungkan antrean lokal yang belum disinkron dengan data online terbaru
          const updatedLogs = [...localQueue, ...data].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setLogs(updatedLogs);
        }
      } catch (e) {
        console.warn('Mode Offline: Menggunakan riwayat log cache lokal.', e);
      }
    }
    setLoading(false);
  }, [user]);

  // Sinkronisasi antrean LocalStorage ke Supabase
  const syncQueue = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || syncing || !user || !profile) return;
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    setSyncing(true);
    try {
      const failedToSync = [];
      for (const item of queue) {
        const uploadItem = { 
          user_id: user.id,
          kategori: item.kategori,
          metode_input: item.metode_input,
          berat_gram: item.berat_gram,
          lhv_mj: item.lhv_mj,
          kwh_potensi: item.kwh_potensi,
          co2e_saved: item.co2e_saved,
          // Gunakan detail wilayah dari profil warga aktif saat melakukan sinkronisasi
          kabupaten: profile.kabupaten,
          kecamatan: profile.kecamatan,
          desa: profile.desa,
          banjar: profile.banjar,
          created_at: item.created_at
        };

        const { error } = await supabase.from('pilah_logs').insert([uploadItem]);
        if (error) {
          console.error('Gagal sinkronisasi log offline:', error);
          failedToSync.push(item); // Masukkan kembali ke antrean jika gagal
        }
      }

      localStorage.setItem(QUEUE_KEY, JSON.stringify(failedToSync));
      
      // Jika berhasil mensinkronkan beberapa item, bersihkan cache lokal dan ambil data baru
      if (failedToSync.length < queue.length) {
        await fetchLogs();
      }
    } catch (e) {
      console.error('Error saat sinkronisasi antrean:', e);
    } finally {
      setSyncing(false);
    }
  }, [user, profile, fetchLogs, syncing]);

  // Menambah log pemilahan baru
  const addLog = async (kategori, beratGram, metodeInput = 'manual', subkategori = []) => {
    // Tentukan wilayah penginputan dari data profil warga terdaftar
    const activeRegency = profile ? profile.kabupaten : regency;
    
    if (!activeRegency) {
      throw new Error('Kabupaten asal belum ditentukan. Mohon daftarkan alamat terlebih dahulu.');
    }

    // Kalkulasi ilmiah dampak sampah
    const calc = getLogCalculations(kategori, beratGram);
    
    const newLog = {
      kategori,
      metode_input: metodeInput,
      berat_gram: beratGram,
      subkategori,
      lhv_mj: calc.lhv,
      kwh_potensi: calc.kwh,
      co2e_saved: calc.co2e,
      kabupaten: activeRegency,
      kecamatan: profile ? profile.kecamatan : '',
      desa: profile ? profile.desa : '',
      banjar: profile ? profile.banjar : '',
      created_at: new Date().toISOString()
    };

    // 1. Simpan di Local Cache untuk kemudahan UX instan
    const localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    
    if (isSupabaseConfigured && supabase && user && profile) {
      try {
        const uploadItem = { 
          ...newLog, 
          user_id: user.id
        };
        
        const { data, error } = await supabase
          .from('pilah_logs')
          .insert([uploadItem])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          // Sukses online: simpan di cache riwayat
          const updatedCache = [data[0], ...localCache].slice(0, 30);
          localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));
          await fetchLogs();
          return data[0];
        }
      } catch (e) {
        console.warn('Gagal menyimpan online. Menyimpan ke antrean sinkronisasi offline...', e);
      }
    }

    // 2. Fallback Offline: Simpan ke Sync Queue
    const tempId = `temp_${Date.now()}`;
    const offlineLog = { ...newLog, id: tempId, isOffline: true };
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    
    queue.push(offlineLog);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Update state logs secara instan agar UI memperlihatkan log offline
    setLogs((prev) => [offlineLog, ...prev]);
    return offlineLog;
  };

  // Menghapus log
  const deleteLog = async (id) => {
    // 1. Cek apakah ini log offline di queue
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    const inQueue = queue.some(item => item.id === id);

    if (inQueue) {
      const updatedQueue = queue.filter(item => item.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      setLogs(prev => prev.filter(item => item.id !== id));
      return true;
    }

    // 2. Jika online, hapus dari Supabase
    if (isSupabaseConfigured && supabase && user) {
      try {
        setLoading(true);
        const { error } = await supabase.from('pilah_logs').delete().eq('id', id);
        if (error) throw error;
        
        // Hapus dari cache lokal
        const localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
        const updatedCache = localCache.filter(item => item.id !== id);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));
        
        setLogs(prev => prev.filter(item => item.id !== id));
        setLoading(false);
        return true;
      } catch (e) {
        console.error('Gagal menghapus log secara online:', e);
        setLoading(false);
        return false;
      }
    }
    return false;
  };

  // Setup detektor internet online/offline & jalankan sinkronisasi antrean saat user terdeteksi
  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      setLogs([]);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [user, fetchLogs]);

  useEffect(() => {
    if (!user || !profile) return;

    const handleOnline = () => {
      syncQueue();
    };

    window.addEventListener('online', handleOnline);
    // Jalankan sync queue saat pertama kali load jika online
    if (navigator.onLine) {
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, profile, syncQueue]);

  return {
    logs,
    loading,
    syncing,
    regency: profile ? profile.kabupaten : regency,
    saveRegency,
    addLog,
    deleteLog,
    syncQueue
  };
}
