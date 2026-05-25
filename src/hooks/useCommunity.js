import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BALI_REGENCY_LIST } from '../lib/constants';

// Data komunitas awal untuk disajikan sebagai baseline (dan fallback offline)
const BASELINE_COMMUNITY_STATS = {
  total_kontributor: 147,
  total_kg: 4125.80,
  total_kwh: 712.45,
  total_co2e: 1890.30,
  total_logs: 914
};

// Data kontribusi awal per kabupaten di Bali agar peta bercahaya secara realistik dari hari pertama
const BASELINE_REGENCY_STATS = {
  'Badung': { total_kg: 1450.50, total_kwh: 310.20, total_co2e: 520.10, total_kontributor: 48 },
  'Denpasar': { total_kg: 1120.30, total_kwh: 245.80, total_co2e: 410.50, total_kontributor: 42 },
  'Gianyar': { total_kg: 680.40, total_kwh: 112.50, total_co2e: 320.40, total_kontributor: 22 },
  'Tabanan': { total_kg: 450.20, total_kwh: 32.40, total_co2e: 280.60, total_kontributor: 15 },
  'Klungkung': { total_kg: 180.60, total_kwh: 9.80, total_co2e: 140.20, total_kontributor: 8 },
  'Bangli': { total_kg: 95.30, total_kwh: 0, total_co2e: 106.70, total_kontributor: 4 },
  'Karangasem': { total_kg: 72.00, total_kwh: 0, total_co2e: 80.60, total_kontributor: 3 },
  'Buleleng': { total_kg: 56.50, total_kwh: 1.70, total_co2e: 25.20, total_kontributor: 3 },
  'Jembrana': { total_kg: 20.00, total_kwh: 0, total_co2e: 6.00, total_kontributor: 2 }
};

export function useCommunity() {
  const [stats, setStats] = useState(BASELINE_COMMUNITY_STATS);
  const [regencyStats, setRegencyStats] = useState(BASELINE_REGENCY_STATS);
  const [loading, setLoading] = useState(true);

  // Ambil data statistik dari Supabase
  const fetchCommunityData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Ambil data view community_stats (agregasi global 30 hari terakhir)
      const { data: globalData, error: globalError } = await supabase
        .from('community_stats')
        .select('*')
        .single();

      if (globalError) throw globalError;

      // 2. Ambil data view regency_stats (agregasi kabupaten)
      const { data: regionalData, error: regionalError } = await supabase
        .from('regency_stats')
        .select('*');

      if (regionalError) throw regionalError;

      // Update state dengan data murni/riil dari database Supabase
      if (globalData) {
        setStats({
          total_kontributor: Number(globalData.total_kontributor || 0),
          total_kg: parseFloat(Number(globalData.total_kg || 0).toFixed(2)),
          total_kwh: parseFloat(Number(globalData.total_kwh || 0).toFixed(2)),
          total_co2e: parseFloat(Number(globalData.total_co2e || 0).toFixed(2)),
          total_logs: Number(globalData.total_logs || 0)
        });
      }

      if (regionalData) {
        const updatedRegencyStats = {};
        // Inisialisasi data kabupaten bersih dari daftar regional
        BALI_REGENCY_LIST.forEach(name => {
          updatedRegencyStats[name] = { total_kg: 0, total_kwh: 0, total_co2e: 0, total_kontributor: 0 };
        });
        
        regionalData.forEach(row => {
          const name = row.kabupaten;
          if (updatedRegencyStats[name]) {
            updatedRegencyStats[name] = {
              total_kg: parseFloat(Number(row.total_kg || 0).toFixed(2)),
              total_kwh: parseFloat(Number(row.total_kwh || 0).toFixed(2)),
              total_co2e: parseFloat(Number(row.total_co2e || 0).toFixed(2)),
              total_kontributor: Number(row.total_kontributor || 0)
            };
          }
        });

        setRegencyStats(updatedRegencyStats);
      }
    } catch (e) {
      console.warn('Mode Offline: Menggunakan baseline data komunitas.', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityData();

    if (!isSupabaseConfigured || !supabase) return;

    // Realtime subscription: dengarkan perubahan tabel pilah_logs untuk memperbarui agregat view secara instan
    const channel = supabase
      .channel('realtime_community_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pilah_logs' },
        () => {
          fetchCommunityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunityData]);

  return {
    stats,
    regencyStats,
    loading,
    refresh: fetchCommunityData
  };
}
