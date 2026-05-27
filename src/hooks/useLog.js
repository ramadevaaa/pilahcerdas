import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Helper untuk menggabungkan dua array log tanpa ada duplikasi ID
  const deduplicateLogs = (queueArr, mainArr) => {
    const combined = [...queueArr];
    const seenIds = new Set(combined.map(item => item.id));
    mainArr.forEach(item => {
      if (!seenIds.has(item.id)) {
        combined.push(item);
        seenIds.add(item.id);
      }
    });
    return combined;
  };

  // Menyimpan kabupaten asal user (untuk fallback jika profil belum termuat)
  const saveRegency = (newRegency) => {
    localStorage.setItem(REGENCY_KEY, newRegency);
    setRegency(newRegency);
  };

  // Membaca riwayat log (Kombinasi online & offline cache dengan deduping)
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    let localQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    
    // Tampilkan cache lokal terlebih dahulu tanpa duplikasi agar UI instan merespon
    const combinedLocal = deduplicateLogs(localQueue, localCache).sort(
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
          // Gabungkan antrean lokal yang belum disinkron dengan data online terbaru secara bersih
          const updatedLogs = deduplicateLogs(localQueue, data).sort(
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

  // Menambah log pemilahan baru secara instan (Offline-First / Cache-First)
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

    // Buat temporary ID unik lokal untuk log baru ini
    const tempId = `temp_${Date.now()}`;
    const offlineLog = { 
      ...newLog, 
      id: tempId, 
      isOffline: true 
    };

    // 1. SIMPAN SEGERA KE LOCAL STORAGE (Cache & Antrean Sinkronisasi)
    // Simpan ke Cache Riwayat (localStorage)
    const localCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const updatedCache = [offlineLog, ...localCache].slice(0, 30);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));

    // Simpan ke Antrean Sinkronisasi Offline
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push(offlineLog);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // 2. PERBARUI STATE REACT INSTAN (UX Terbuka Seketika)
    setLogs((prev) => [offlineLog, ...prev]);

    // 3. JALANKAN SINKRONISASI LATAR BELAKANG (ASINKRON / FIRE-AND-FORGET)
    // Kueri Supabase dilempar ke latar belakang tanpa memakai 'await' agar form penginputan tidak ikut 'hang'!
    if (isSupabaseConfigured && supabase && user && profile) {
      console.log('[useLog Debug] Memicu sinkronisasi antrean ke database di latar belakang...');
      setTimeout(() => {
        syncQueue().catch(err => {
          console.warn('[useLog Debug] Gagal melakukan sinkronisasi otomatis di latar belakang:', err);
        });
      }, 0);
    } else {
      console.log('[useLog Debug] Berjalan dalam mode offline. Log disimpan aman di antrean lokal.');
    }

    // 4. KEMBALIKAN LOG INSTAN
    // Aksi input selesai seketika di sisi pengguna, tidak ada loading lama!
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

  // Gunakan ref untuk menghindari stale closure dan loop pemanggilan ketika state syncing berubah
  const syncQueueRef = useRef(syncQueue);
  useEffect(() => {
    syncQueueRef.current = syncQueue;
  }, [syncQueue]);

  // Detektor koneksi internet: jalankan sinkronisasi otomatis ketika kembali online
  useEffect(() => {
    if (!user || !profile) return;

    const handleOnline = () => {
      console.log('[useLog Debug] Koneksi terdeteksi kembali ONLINE. Menjalankan sinkronisasi antrean...');
      syncQueueRef.current();
    };

    window.addEventListener('online', handleOnline);
    
    // Jalankan sinkronisasi instan secara andal saat mount/refresh dalam status online
    if (navigator.onLine) {
      console.log('[useLog Debug] Warga masuk dalam status online. Sinkronisasi instan...');
      syncQueueRef.current();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, profile]);

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
