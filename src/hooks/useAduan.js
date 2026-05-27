import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ADUAN_CACHE_KEY = 'pilah_aduan_cache';
const ADUAN_QUEUE_KEY = 'pilah_aduan_queue';

// Fungsi Kompresi Foto Client-Side berbasis Canvas API
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Pertahankan rasio aspek gambar
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Gagal melakukan kompresi gambar (Canvas blob kosong)'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Rumus Haversine untuk menghitung jarak antara dua koordinat GPS (dalam Meter)
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
}

// Bounding box geografis Provinsi Bali untuk Geofencing sederhana
export function isLocationInBali(lat, lon) {
  return lat >= -8.95 && lat <= -8.0 && lon >= 114.4 && lon <= 115.8;
}

export function useAduan() {
  const { user, profile } = useAuth();
  const [aduanList, setAduanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Helper deduplikasi aduan
  const deduplicateAduan = (queue, cache) => {
    const combined = [...queue];
    const seenIds = new Set(combined.map(item => item.id));
    cache.forEach(item => {
      if (!seenIds.has(item.id)) {
        combined.push(item);
        seenIds.add(item.id);
      }
    });
    return combined;
  };

  // 1. Membaca riwayat aduan (Gabungan online + offline queue)
  const fetchAduan = useCallback(async () => {
    setLoading(true);
    let localCache = JSON.parse(localStorage.getItem(ADUAN_CACHE_KEY) || '[]');
    let localQueue = JSON.parse(localStorage.getItem(ADUAN_QUEUE_KEY) || '[]');

    const combinedLocal = deduplicateAduan(localQueue, localCache).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setAduanList(combinedLocal);

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data, error } = await supabase
          .from('pilah_laporan')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          localStorage.setItem(ADUAN_CACHE_KEY, JSON.stringify(data));
          const updated = deduplicateAduan(localQueue, data).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setAduanList(updated);
        }
      } catch (e) {
        console.warn('Mode Offline: Mengambil riwayat aduan lokal.', e);
      }
    }
    setLoading(false);
  }, [user]);

  // 2. Fungsi Sinkronisasi Antrean Aduan ke Supabase
  const syncAduanQueue = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || syncing || !user || !profile) return;
    const queue = JSON.parse(localStorage.getItem(ADUAN_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    setSyncing(true);
    try {
      const failedToSync = [];
      for (const item of queue) {
        try {
          let publicUrl = item.foto_url;

          // Jika foto masih berupa base64 (belum terupload ke Supabase Storage)
          if (item.foto_base64) {
            // Konversi base64 kembali menjadi blob untuk upload
            const res = await fetch(item.foto_base64);
            const blob = await res.blob();
            const fileName = `${user.id}/${Date.now()}_aduan.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('laporan-sampah')
              .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('laporan-sampah')
              .getPublicUrl(fileName);
            
            publicUrl = urlData.publicUrl;
          }

          // Unggah record ke tabel pilah_laporan
          // PENTING: kecamatan & desa dikirim sebagai null jika kosong
          // agar tidak melanggar constraint DB (kolom bersifat opsional secara bisnis)
          const uploadItem = {
            user_id: user.id,
            kabupaten: item.kabupaten,
            kecamatan: item.kecamatan || null,
            desa: item.desa || null,
            kategori: item.kategori,
            deskripsi: item.deskripsi || null,
            foto_url: publicUrl,
            latitude: item.latitude,
            longitude: item.longitude,
            status: 'baru',
            created_at: item.created_at
          };

          console.log('[useAduan] Mengunggah ke Supabase:', uploadItem);
          const { error: dbError } = await supabase.from('pilah_laporan').insert([uploadItem]);
          if (dbError) {
            console.error('[useAduan] DB Insert Error:', JSON.stringify(dbError));
            throw dbError;
          }

        } catch (err) {
          const errMsg = err.message || err.details || err.hint || JSON.stringify(err);
          console.error('Gagal sinkronisasi aduan offline:', errMsg);
          setSyncError(errMsg);
          failedToSync.push(item);
        }
      }

      localStorage.setItem(ADUAN_QUEUE_KEY, JSON.stringify(failedToSync));
      if (failedToSync.length < queue.length) {
        await fetchAduan();
      }
    } catch (e) {
      console.error('Error saat sinkronisasi aduan:', e);
    } finally {
      setSyncing(false);
    }
  }, [user, profile, fetchAduan, syncing]);

  // 3. Menambahkan aduan baru (Dukungan Kompresi & Offline-First)
  const addAduan = async (fotoFile, kategori, deskripsi, latitude, longitude, kabupaten, kecamatan = '', desa = '') => {
    if (!profile) {
      throw new Error('Profil warga belum termuat. Mohon tunggu sebentar.');
    }

    // Geofencing sederhana untuk memastikan warga melaporkan di area Bali
    if (!isLocationInBali(latitude, longitude)) {
      throw new Error('Aduan ditolak. Koordinat GPS menunjukkan lokasi berada di luar Provinsi Bali.');
    }

    setSubmitting(true);
    try {
      // A. LAKUKAN KOMPRESI GAMBAR CLIENT-SIDE (Canvas API)
      console.log(`[useAduan] Ukuran awal: ${(fotoFile.size / 1024 / 1024).toFixed(2)} MB`);
      const compressed = await compressImage(fotoFile);
      console.log(`[useAduan] Ukuran setelah dikompresi: ${(compressed.size / 1024).toFixed(0)} KB`);

      const tempId = `temp_aduan_${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Buat data base64 lokal untuk keperluan render instan secara offline
      const localPhotoReader = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressed);
      });
      const localPhotoBase64 = await localPhotoReader;

      const newAduan = {
        id: tempId,
        kabupaten,
        kecamatan,
        desa,
        banjar: '',
        kategori,
        deskripsi,
        foto_url: localPhotoBase64, // Fallback render lokal
        foto_base64: localPhotoBase64, // Diperlukan saat sync offline nanti
        latitude,
        longitude,
        status: 'baru',
        isOffline: true,
        created_at: timestamp
      };

      // 1. Simpan ke Local Storage (Queue & Cache)
      const localQueue = JSON.parse(localStorage.getItem(ADUAN_QUEUE_KEY) || '[]');
      localQueue.push(newAduan);
      localStorage.setItem(ADUAN_QUEUE_KEY, JSON.stringify(localQueue));

      const localCache = JSON.parse(localStorage.getItem(ADUAN_CACHE_KEY) || '[]');
      const updatedCache = [newAduan, ...localCache].slice(0, 30);
      localStorage.setItem(ADUAN_CACHE_KEY, JSON.stringify(updatedCache));

      // 2. Perbarui State Instan (UX Cepat)
      setAduanList(prev => [newAduan, ...prev]);

      // 3. Jalankan Sync Latar Belakang jika Online
      if (isSupabaseConfigured && supabase && user) {
        setTimeout(() => {
          syncAduanQueue().catch(err => {
            console.warn('[useAduan] Gagal sinkronisasi otomatis di latar belakang:', err);
          });
        }, 0);
      }

      return newAduan;
    } catch (err) {
      console.error('Error saat menambah aduan:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Proaktif sync pada mount/refresh jika online
  const syncAduanQueueRef = useRef(syncAduanQueue);
  useEffect(() => {
    syncAduanQueueRef.current = syncAduanQueue;
  }, [syncAduanQueue]);

  useEffect(() => {
    if (user) {
      fetchAduan();
    } else {
      setAduanList([]);
      localStorage.removeItem(ADUAN_CACHE_KEY);
    }
  }, [user, fetchAduan]);

  useEffect(() => {
    if (!user || !profile) return;

    const handleOnline = () => {
      console.log('[useAduan Debug] Koneksi ONLINE. Sinkronisasi aduan...');
      syncAduanQueueRef.current();
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      syncAduanQueueRef.current();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, profile]);

  return {
    aduanList,
    loading,
    submitting,
    syncing,
    syncError,
    addAduan,
    refresh: fetchAduan,
    syncAduanQueue
  };
}
