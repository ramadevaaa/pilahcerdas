import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BALI_REGENCY_LIST } from '../lib/constants';
import { ChoroplethMap } from '../components/ChoroplethMap';
import { FeedstockGauge } from '../components/FeedstockGauge';
import { SurgePredictor } from '../components/SurgePredictor';
import { ReportGenerator } from '../components/ReportGenerator';
import baliRegions from '../lib/bali_regions.json';
import { 
  Trash2, Zap, Leaf, Users, LogOut, 
  MapPin, RefreshCw, BarChart2, CheckCircle2,
  LayoutGrid, Calendar, FileText,
  ChevronLeft, ChevronRight, Search, Filter,
  Activity, Menu, X, ArrowUpRight, Clock, Award,
  Sunrise, Sun, CloudSun, Moon
} from 'lucide-react';


// Baseline data lokal realistis untuk DLH Bali (Fungsi Offline & Demonstrasi)
const BASELINE_REGENCY_STATS = {
  'Badung': { total_kg: 1450.50, total_kwh: 310.20, total_co2e: 520.10, total_kontributor: 148 },
  'Denpasar': { total_kg: 1120.30, total_kwh: 245.80, total_co2e: 410.50, total_kontributor: 122 },
  'Gianyar': { total_kg: 680.40, total_kwh: 112.50, total_co2e: 320.40, total_kontributor: 82 },
  'Tabanan': { total_kg: 450.20, total_kwh: 32.40, total_co2e: 280.60, total_kontributor: 55 },
  'Klungkung': { total_kg: 180.60, total_kwh: 9.80, total_co2e: 140.20, total_kontributor: 28 },
  'Bangli': { total_kg: 95.30, total_kwh: 0, total_co2e: 106.70, total_kontributor: 14 },
  'Karangasem': { total_kg: 72.00, total_kwh: 0, total_co2e: 80.60, total_kontributor: 11 },
  'Buleleng': { total_kg: 56.50, total_kwh: 1.70, total_co2e: 25.20, total_kontributor: 10 },
  'Jembrana': { total_kg: 20.00, total_kwh: 0, total_co2e: 6.00, total_kontributor: 5 }
};

// Generate dummy logs untuk memperlihatkan data bergerak yang stabil dalam mode demo
function generateDemoLogs() {
  const categories = ['organik', 'anorganik', 'residu'];
  const anorganicSubs = [['plastik'], ['kertas'], ['plastik', 'kertas'], ['kaca'], ['logam'], ['kaca', 'logam']];
  const logs = [];

  for (let i = 0; i < 150; i++) {
    const regency = BALI_REGENCY_LIST[i % BALI_REGENCY_LIST.length];
    const category = categories[i % categories.length];
    const weight = 200 + (i * 243) % 4500; // Gram
    const date = new Date();
    date.setDate(date.getDate() - (i % 30));

    // Hitung LHV & kWh
    let lhv = category === 'anorganik' ? 14.16 : category === 'residu' ? 2.78 : -0.83;
    let kwh = lhv > 0 ? lhv * (weight / 1000) * 0.2778 * 0.22 : 0;
    let co2e = category === 'organik' ? (weight / 1000) * 1.26 : 0;

    logs.push({
      id: `LOG_PILA_${1024 + i}`,
      kabupaten: regency,
      kategori: category,
      berat_gram: weight,
      subkategori: category === 'anorganik' ? anorganicSubs[i % anorganicSubs.length] : [],
      lhv_mj: lhv,
      kwh_potensi: kwh,
      co2e_saved: co2e,
      created_at: date.toISOString()
    });
  }
  return logs;
}

export function Dashboard() {
  const [selectedRegency, setSelectedRegency] = useState(''); // Empty = All Bali
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [selectedBanjar, setSelectedBanjar] = useState('');
  const [logs, setLogs] = useState([]);
  const [regencyStats, setRegencyStats] = useState(BASELINE_REGENCY_STATS);
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    nama_lengkap: 'Petugas DLH Bali',
    kabupaten: 'Seluruh Bali',
    role: 'admin'
  });

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) {
      return { text: 'Selamat Pagi', icon: Sunrise };
    } else if (hours >= 11 && hours < 15) {
      return { text: 'Selamat Siang', icon: Sun };
    } else if (hours >= 15 && hours < 19) {
      return { text: 'Selamat Sore', icon: CloudSun };
    } else {
      return { text: 'Selamat Malam', icon: Moon };
    }
  };


  // Otomatis mereset filter anak saat filter induk berubah
  useEffect(() => {
    setSelectedKecamatan('');
    setSelectedDesa('');
    setSelectedBanjar('');
  }, [selectedRegency]);

  useEffect(() => {
    setSelectedDesa('');
    setSelectedBanjar('');
  }, [selectedKecamatan]);
  
  // State untuk Navigasi Tab Samping
  const [activeTab, setActiveTab] = useState('overview'); // overview | feedstock | surge | reports
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk Mode Data Riil 100% / Mode Demo (Baseline + Riil)
  const [realDataOnly, setRealDataOnly] = useState(false);

  // State untuk Leaderboard di Tab Overview
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('year'); // day | month | year

  // State untuk Tabel Audit Log di Tab Laporan & Audit
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchDashboardData = async () => {
    setLoading(true);
    // 1. Jika Supabase tidak dikonfigurasi, gunakan generator demo lokal
    if (!isSupabaseConfigured) {
      setLogs(generateDemoLogs());
      setRegencyStats(BASELINE_REGENCY_STATS);
      setLoading(false);
      return;
    }

    // 2. Jika Supabase dikonfigurasi, ambil data database riil
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!profileErr && profile) {
          setAdminProfile(profile);
          if (profile.kabupaten && BALI_REGENCY_LIST.includes(profile.kabupaten)) {
            setSelectedRegency(profile.kabupaten);
          }
        }
      }

      const { data, error } = await supabase
        .from('pilah_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setLogs(data);

        // Rekalkulasi regency stats dari data Supabase secara realtime (Murni 100% Database)
        const newStats = { ...BASELINE_REGENCY_STATS };
        // Reset/init stats dengan Supabase values
        Object.keys(newStats).forEach(key => {
          newStats[key] = { total_kg: 0, total_kwh: 0, total_co2e: 0, total_kontributor: 0 };
        });

        const contributorSets = {};
        BALI_REGENCY_LIST.forEach(r => {
          contributorSets[r] = new Set();
        });

        data.forEach(log => {
          const reg = log.kabupaten;
          if (newStats[reg]) {
            newStats[reg].total_kg += (log.berat_gram || 0) / 1000;
            newStats[reg].total_kwh += log.kwh_potensi || 0;
            newStats[reg].total_co2e += log.co2e_saved || 0;
            if (log.user_id) {
              contributorSets[reg].add(log.user_id);
            }
          }
        });

        // Simpan data murni database
        BALI_REGENCY_LIST.forEach(reg => {
          newStats[reg].total_kg = parseFloat(newStats[reg].total_kg.toFixed(2));
          newStats[reg].total_kwh = parseFloat(newStats[reg].total_kwh.toFixed(2));
          newStats[reg].total_co2e = parseFloat(newStats[reg].total_co2e.toFixed(2));
          newStats[reg].total_kontributor = contributorSets[reg]?.size || 0;
        });

        setRegencyStats(newStats);
      }
    } catch (e) {
      console.warn('Mode Offline: Menggunakan baseline data simulasi.', e);
      setLogs(generateDemoLogs());
      setRegencyStats(BASELINE_REGENCY_STATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari sistem?");
    if (confirmLogout) {
      localStorage.removeItem('pilah_admin_logged_in');
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut();
      }
      window.location.hash = '/login';
    }
  };

  // Memoize data visual regency yang memadukan baseline hanya jika realDataOnly = false
  const visualRegencyStats = useMemo(() => {
    const stats = {};
    BALI_REGENCY_LIST.forEach(reg => {
      const dbStats = regencyStats[reg] || { total_kg: 0, total_kwh: 0, total_co2e: 0, total_kontributor: 0 };
      if (realDataOnly) {
        stats[reg] = {
          total_kg: parseFloat(dbStats.total_kg.toFixed(2)),
          total_kwh: parseFloat(dbStats.total_kwh.toFixed(2)),
          total_co2e: parseFloat(dbStats.total_co2e.toFixed(2)),
          total_kontributor: dbStats.total_kontributor
        };
      } else {
        // Gabungkan baseline dengan data Supabase agar tampilan padat
        stats[reg] = {
          total_kg: parseFloat((BASELINE_REGENCY_STATS[reg].total_kg + dbStats.total_kg).toFixed(2)),
          total_kwh: parseFloat((BASELINE_REGENCY_STATS[reg].total_kwh + dbStats.total_kwh).toFixed(2)),
          total_co2e: parseFloat((BASELINE_REGENCY_STATS[reg].total_co2e + dbStats.total_co2e).toFixed(2)),
          total_kontributor: BASELINE_REGENCY_STATS[reg].total_kontributor + dbStats.total_kontributor
        };
      }
    });
    return stats;
  }, [regencyStats, realDataOnly]);

  // Kalkulasi data agregat khusus wilayah terpilih (menggunakan visualRegencyStats)
  const filteredSummary = useMemo(() => {
    let targetLogs = logs;
    if (selectedRegency) {
      targetLogs = targetLogs.filter(l => l.kabupaten === selectedRegency);
      if (selectedKecamatan) {
        targetLogs = targetLogs.filter(l => l.kecamatan === selectedKecamatan);
        if (selectedDesa) {
          targetLogs = targetLogs.filter(l => l.desa === selectedDesa);
          if (selectedBanjar) {
            targetLogs = targetLogs.filter(l => l.banjar?.toLowerCase().includes(selectedBanjar.toLowerCase()));
          }
        }
      }
    }

    const isMicroFiltered = selectedKecamatan !== '' || selectedDesa !== '' || selectedBanjar !== '';

    let totalKg = targetLogs.reduce((sum, l) => sum + (l.berat_gram || 0) / 1000, 0);
    let totalKwh = targetLogs.reduce((sum, l) => sum + (l.kwh_potensi || 0), 0);
    let totalCo2e = targetLogs.reduce((sum, l) => sum + (l.co2e_saved || 0), 0);

    const contributorsSet = new Set();
    targetLogs.forEach(l => {
      if (l.user_id) contributorsSet.add(l.user_id);
    });
    let totalContributors = contributorsSet.size;

    // Hanya campurkan baseline jika realDataOnly = false DAN tidak sedang di-filter tingkat mikro (Kecamatan/Desa/Banjar)
    if (!realDataOnly && !isMicroFiltered) {
      if (selectedRegency) {
        totalKg += BASELINE_REGENCY_STATS[selectedRegency].total_kg;
        totalKwh += BASELINE_REGENCY_STATS[selectedRegency].total_kwh;
        totalCo2e += BASELINE_REGENCY_STATS[selectedRegency].total_co2e;
        totalContributors += BASELINE_REGENCY_STATS[selectedRegency].total_kontributor;
      } else {
        const totalBaseline = Object.values(BASELINE_REGENCY_STATS).reduce((acc, r) => ({
          total_kg: acc.total_kg + r.total_kg,
          total_kwh: acc.total_kwh + r.total_kwh,
          total_co2e: acc.total_co2e + r.total_co2e,
          total_kontributor: acc.total_kontributor + r.total_kontributor
        }), { total_kg: 0, total_kwh: 0, total_co2e: 0, total_kontributor: 0 });
        
        totalKg += totalBaseline.total_kg;
        totalKwh += totalBaseline.total_kwh;
        totalCo2e += totalBaseline.total_co2e;
        totalContributors += totalBaseline.total_kontributor;
      }
    }

    return {
      totalKg,
      totalKwh,
      totalCo2e,
      totalContributors,
      logCount: targetLogs.length
    };
  }, [logs, visualRegencyStats, selectedRegency, selectedKecamatan, selectedDesa, selectedBanjar, realDataOnly]);

  // Kalkulasi Data Papan Peringkat Keaktifan Kabupaten/Kecamatan/Desa secara dinamis
  const sortedLeaderboard = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStr = now.toISOString().substring(0, 7); // YYYY-MM

    const matchesTimeframe = (log) => {
      const logDate = log.created_at ? log.created_at.split('T')[0] : '';
      const logMonth = log.created_at ? log.created_at.substring(0, 7) : '';
      if (leaderboardTimeframe === 'day') return logDate === todayStr;
      if (leaderboardTimeframe === 'month') return logMonth === monthStr;
      return true;
    };

    // KASUS 1: Tidak ada kabupaten terpilih -> Bandingkan antar Kabupaten (Default)
    if (!selectedRegency) {
      const grouped = {};
      BALI_REGENCY_LIST.forEach(r => {
        grouped[r] = { weight: 0, contributors: new Set() };
      });

      logs.filter(matchesTimeframe).forEach(log => {
        const reg = log.kabupaten;
        if (grouped[reg]) {
          grouped[reg].weight += (log.berat_gram || 0) / 1000;
          if (log.user_id) grouped[reg].contributors.add(log.user_id);
        }
      });

      const result = BALI_REGENCY_LIST.map(reg => {
        const baseline = BASELINE_REGENCY_STATS[reg] || { total_kg: 0, total_kontributor: 0 };
        let baselineKg = realDataOnly ? 0 : baseline.total_kg;
        let baselineContr = realDataOnly ? 0 : baseline.total_kontributor;

        if (!realDataOnly) {
          if (leaderboardTimeframe === 'day') {
            baselineKg = baseline.total_kg / 365;
            baselineContr = Math.max(1, Math.round(baseline.total_kontributor / 60));
          } else if (leaderboardTimeframe === 'month') {
            baselineKg = baseline.total_kg / 12;
            baselineContr = Math.max(1, Math.round(baseline.total_kontributor / 5));
          }
        }

        return {
          name: reg,
          weightKg: grouped[reg].weight + baselineKg,
          contributors: grouped[reg].contributors.size + baselineContr,
          type: 'kabupaten'
        };
      });

      return result.sort((a, b) => b.weightKg - a.weightKg);
    }

    // KASUS 2: Ada Kabupaten, Tapi Kecamatan Kosong -> Bandingkan antar Kecamatan
    if (selectedRegency && !selectedKecamatan) {
      const kecs = Object.keys(baliRegions[selectedRegency] || {});
      const grouped = {};
      kecs.forEach(k => {
        grouped[k] = { weight: 0, contributors: new Set() };
      });

      logs
        .filter(l => l.kabupaten === selectedRegency && matchesTimeframe(l))
        .forEach(log => {
          const kec = log.kecamatan || 'Lainnya';
          if (!grouped[kec]) {
            grouped[kec] = { weight: 0, contributors: new Set() };
          }
          grouped[kec].weight += (log.berat_gram || 0) / 1000;
          if (log.user_id) grouped[kec].contributors.add(log.user_id);
        });

      const result = Object.keys(grouped).map(kec => ({
        name: kec,
        weightKg: parseFloat(grouped[kec].weight.toFixed(2)),
        contributors: grouped[kec].contributors.size,
        type: 'kecamatan'
      }));

      return result.sort((a, b) => b.weightKg - a.weightKg);
    }

    // KASUS 3: Ada Kecamatan Terpilih -> Bandingkan antar Desa
    if (selectedRegency && selectedKecamatan) {
      const desas = baliRegions[selectedRegency][selectedKecamatan] || [];
      const grouped = {};
      desas.forEach(d => {
        grouped[d] = { weight: 0, contributors: new Set() };
      });

      logs
        .filter(l => l.kabupaten === selectedRegency && l.kecamatan === selectedKecamatan && matchesTimeframe(l))
        .forEach(log => {
          const desa = log.desa || 'Lainnya';
          if (!grouped[desa]) {
            grouped[desa] = { weight: 0, contributors: new Set() };
          }
          grouped[desa].weight += (log.berat_gram || 0) / 1000;
          if (log.user_id) grouped[desa].contributors.add(log.user_id);
        });

      const result = Object.keys(grouped).map(desa => ({
        name: desa,
        weightKg: parseFloat(grouped[desa].weight.toFixed(2)),
        contributors: grouped[desa].contributors.size,
        type: 'desa'
      }));

      return result.sort((a, b) => b.weightKg - a.weightKg);
    }

    return [];
  }, [logs, selectedRegency, selectedKecamatan, leaderboardTimeframe, realDataOnly]);

  // Maksimum berat di leaderboard untuk skala progress bar
  const maxLeaderboardWeight = useMemo(() => {
    return Math.max(...sortedLeaderboard.map(r => r.weightKg), 1);
  }, [sortedLeaderboard]);

  // Kalkulasi data komposisi sampah terpilah warga di kabupaten terfokus
  const selectedComposition = useMemo(() => {
    let targetLogs = selectedRegency 
      ? logs.filter(l => l.kabupaten === selectedRegency)
      : logs;

    if (selectedRegency) {
      if (selectedKecamatan) {
        targetLogs = targetLogs.filter(l => l.kecamatan === selectedKecamatan);
        if (selectedDesa) {
          targetLogs = targetLogs.filter(l => l.desa === selectedDesa);
          if (selectedBanjar) {
            targetLogs = targetLogs.filter(l => l.banjar?.toLowerCase().includes(selectedBanjar.toLowerCase()));
          }
        }
      }
    }

    let organik = 0;
    let anorganik = 0;
    let residu = 0;

    targetLogs.forEach(l => {
      const berat = (l.berat_gram || 0) / 1000;
      if (l.kategori === 'organik') organik += berat;
      else if (l.kategori === 'anorganik') anorganik += berat;
      else if (l.kategori === 'residu') residu += berat;
    });

    const isMicroFiltered = selectedKecamatan !== '' || selectedDesa !== '' || selectedBanjar !== '';

    // Tambahkan baseline agar komposisi seimbang di awal (jika bukan mode data riil saja DAN tidak sedang mikro-filter)
    if (!realDataOnly && !isMicroFiltered) {
      if (selectedRegency) {
        organik += (BASELINE_REGENCY_STATS[selectedRegency].total_kg * 0.5);
        anorganik += (BASELINE_REGENCY_STATS[selectedRegency].total_kg * 0.35);
        residu += (BASELINE_REGENCY_STATS[selectedRegency].total_kg * 0.15);
      } else {
        const totalBaseline = Object.values(BASELINE_REGENCY_STATS).reduce((sum, r) => sum + r.total_kg, 0);
        organik += (totalBaseline * 0.5);
        anorganik += (totalBaseline * 0.35);
        residu += (totalBaseline * 0.15);
      }
    }

    const total = organik + anorganik + residu || 1;

    return {
      organikKg: organik,
      anorganikKg: anorganik,
      residuKg: residu,
      organikPercent: Math.round((organik / total) * 100),
      anorganikPercent: Math.round((anorganik / total) * 100),
      residuPercent: Math.round((residu / total) * 100)
    };
  }, [logs, selectedRegency, selectedKecamatan, selectedDesa, selectedBanjar, realDataOnly]);

  // Filter & Pagination untuk Tabel Audit Log
  const filteredAuditLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.kabupaten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (log.kecamatan && log.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (log.desa && log.desa.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (log.banjar && log.banjar.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || log.kategori === categoryFilter;
      const matchesRegency = !selectedRegency || log.kabupaten === selectedRegency;
      const matchesKecamatan = !selectedKecamatan || log.kecamatan === selectedKecamatan;
      const matchesDesa = !selectedDesa || log.desa === selectedDesa;
      const matchesBanjar = !selectedBanjar || log.banjar?.toLowerCase().includes(selectedBanjar.toLowerCase());
      return matchesSearch && matchesCategory && matchesRegency && matchesKecamatan && matchesDesa && matchesBanjar;
    });
  }, [logs, searchTerm, categoryFilter, selectedRegency, selectedKecamatan, selectedDesa, selectedBanjar]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAuditLogs.slice(start, start + itemsPerPage);
  }, [filteredAuditLogs, currentPage]);

  const totalPages = Math.ceil(filteredAuditLogs.length / itemsPerPage) || 1;

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, selectedRegency]);

  // Sidebar Menu Items
  const navigationItems = [
    { id: 'overview', name: 'Ringkasan Analitik', icon: LayoutGrid },
    { id: 'feedstock', name: 'Kualitas Feedstock', icon: Zap },
    { id: 'surge', name: 'Prediksi Hari Raya', icon: Calendar },
    { id: 'reports', name: 'Laporan & Audit Log', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex flex-col md:flex-row">
      
      {/* 1. Sidebar Navigasi Kiri Premium (Enterprise Grade) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-brand-primary/10 shadow-premium flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-brand-primary/5 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <img src="/logo-header.png" alt="PilahCerdas Logo" className="h-10 object-contain self-start" />
            <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest mt-2 block bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/5">
              Portal Admin DLH
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-brand-light text-brand-dark cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigationItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false); // Tutup drawer pada mobile
                }}
                className={`w-full h-11 px-4 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-98 ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/15' 
                    : 'text-brand-dark/70 hover:text-brand-primary hover:bg-brand-light'
                }`}
              >
                <IconComponent className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-brand-yellow rounded-full ml-auto animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Account metadata */}
        <div className="p-5 border-t border-brand-primary/5 shrink-0 space-y-4 bg-brand-light/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-primary text-white rounded-xl flex items-center justify-center font-extrabold text-sm shadow-premium">
              {(adminProfile.nama_lengkap || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold text-brand-dark truncate leading-tight">{adminProfile.nama_lengkap}</p>
              <p className="text-[9px] font-bold text-brand-textSecondary truncate mt-0.5 uppercase tracking-wider">
                {adminProfile.role || 'Admin'} {adminProfile.kabupaten ? `• ${adminProfile.kabupaten}` : ''}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full h-10 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-100 text-red-600 text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 stroke-[2.2px]" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Backdrop Mobile Sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/35 z-40 md:hidden animate-backdrop-fade"
        />
      )}

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-35 glass-nav border-b border-brand-primary/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 bg-white border border-brand-light rounded-xl flex items-center justify-center hover:bg-brand-light cursor-pointer"
            >
              <Menu className="w-5 h-5 text-brand-primary" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-brand-dark font-display tracking-tight flex items-center gap-2">
                {(() => {
                  const greeting = getGreeting();
                  const GreetIcon = greeting.icon;
                  return (
                    <span className="flex items-center gap-1.5">
                      <GreetIcon className="w-5 h-5 text-brand-primary shrink-0 stroke-[2.2px]" />
                      {greeting.text}, {adminProfile.nama_lengkap}!
                    </span>
                  );
                })()}
                <span className="text-[9px] font-extrabold bg-[#E2ECE5] text-brand-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-brand-primary/10">
                  v1.2
                </span>
              </h1>
              <p className="text-[10px] font-bold text-brand-textSecondary">
                Monitoring volume, feedstock RDF, & lonjakan hari raya Bali secara proaktif
              </p>
            </div>
          </div>

          {/* Sync status & Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRealDataOnly(prev => !prev)}
              className={`h-10 px-4 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 ${
                realDataOnly 
                  ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' 
                  : 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{realDataOnly ? 'Data 100% Riil (Database)' : 'Mode Demo (Riil + Baseline)'}</span>
            </button>

            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="w-10 h-10 rounded-2xl bg-white border border-brand-light hover:bg-brand-light flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Segarkan Data Real-Time"
            >
              <RefreshCw className={`w-4.5 h-4.5 text-brand-primary stroke-[2.5px] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Header Dashboard & Drill-down Filters */}
          <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-slide">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-light rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-primary stroke-[2.2px]" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-textSecondary">Fokus Wilayah Pemantauan DLH:</p>
                <h2 className="text-sm font-extrabold text-brand-dark mt-0.5">
                  {!selectedRegency 
                    ? 'Seluruh Provinsi Bali' 
                    : `${selectedRegency}${selectedKecamatan ? ` ➔ Kec. ${selectedKecamatan}` : ''}${selectedDesa ? ` ➔ Desa ${selectedDesa}` : ''}${selectedBanjar ? ` ➔ Banjar ${selectedBanjar}` : ''}`}
                </h2>
              </div>
            </div>

            {/* Row Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Dropdown Kabupaten */}
              <select
                value={selectedRegency}
                onChange={(e) => setSelectedRegency(e.target.value)}
                className="px-3.5 py-2.5 bg-brand-light/40 border border-brand-light rounded-2xl font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer"
              >
                <option value="">-- Semua Kabupaten --</option>
                {BALI_REGENCY_LIST.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Dropdown Kecamatan */}
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                disabled={!selectedRegency}
                className="px-3.5 py-2.5 bg-brand-light/40 border border-brand-light rounded-2xl font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Semua Kecamatan --</option>
                {selectedRegency && Object.keys(baliRegions[selectedRegency] || {}).map(kec => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>

              {/* Dropdown Desa */}
              <select
                value={selectedDesa}
                onChange={(e) => setSelectedDesa(e.target.value)}
                disabled={!selectedKecamatan}
                className="px-3.5 py-2.5 bg-brand-light/40 border border-brand-light rounded-2xl font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Semua Desa/Kelurahan --</option>
                {selectedRegency && selectedKecamatan && (baliRegions[selectedRegency][selectedKecamatan] || []).map(desa => (
                  <option key={desa} value={desa}>{desa}</option>
                ))}
              </select>

              {/* Input Banjar */}
              <input
                type="text"
                placeholder="Cari Banjar..."
                value={selectedBanjar}
                onChange={(e) => setSelectedBanjar(e.target.value)}
                disabled={!selectedDesa}
                className="px-3.5 py-2.5 bg-brand-light/40 border border-brand-light rounded-2xl font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all disabled:opacity-50 placeholder-gray-400 w-32"
              />

              {/* Reset Button */}
              {(selectedRegency || selectedKecamatan || selectedDesa || selectedBanjar) && (
                <button
                  onClick={() => {
                    setSelectedRegency('');
                    setSelectedKecamatan('');
                    setSelectedDesa('');
                    setSelectedBanjar('');
                  }}
                  className="px-4 py-2.5 bg-white text-brand-primary hover:text-brand-dark border border-brand-light shadow-sm rounded-2xl font-extrabold cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Render Tab Contents */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* 4 KPI Cards at Top */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide">
                <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-brand-primary stroke-[2.2px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Timbunan Terpilah</span>
                    <span className="text-lg md:text-xl font-extrabold text-brand-dark font-display block mt-0.5">
                      {filteredSummary.totalKg.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">Ton</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-brand-yellow stroke-[2.2px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Listrik PSEL 2027</span>
                    <span className="text-lg md:text-xl font-extrabold text-brand-dark font-display block mt-0.5">
                      {filteredSummary.totalKwh.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">kWh</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center shrink-0">
                    <Leaf className="w-6 h-6 text-[#4CAF50] stroke-[2.2px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">CO₂e Terhindar</span>
                    <span className="text-lg md:text-xl font-extrabold text-brand-dark font-display block mt-0.5">
                      {filteredSummary.totalCo2e.toLocaleString('id-ID', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">kg</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-brand-light rounded-3xl p-5 shadow-premium flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-brand-primary stroke-[2.2px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-textSecondary font-bold block uppercase tracking-wider">Kontributor Warga</span>
                    <span className="text-lg md:text-xl font-extrabold text-brand-dark font-display block mt-0.5">
                      {filteredSummary.totalContributors.toLocaleString('id-ID')} <span className="text-xs font-semibold">Jiwa</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: Map + Leaderboard on Left (2/3), Focused Regency Stats on Right (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-slide">
                
                {/* Column Left: Map + Leaderboard */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Peta Bali */}
                  <ChoroplethMap 
                    regencyStats={visualRegencyStats}
                    selectedRegency={selectedRegency}
                    onSelectRegency={setSelectedRegency}
                    loading={loading}
                  />

                  {/* Papan Peringkat Keaktifan Kabupaten (Diligence Leaderboard) */}
                  <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-light pb-4 mb-5 gap-3">
                      <div>
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Metrik Partisipasi</span>
                        <h3 className="text-base font-bold text-brand-dark mt-0.5 font-display flex items-center gap-1.5">
                          <Award className="w-5 h-5 text-brand-yellow stroke-[2.2px]" />
                          Papan Peringkat Keaktifan Pemilahan
                        </h3>
                      </div>
                      
                      {/* Filter Periode Peringkat */}
                      <div className="bg-brand-light/60 p-1 border border-brand-primary/5 rounded-2xl flex items-center gap-1">
                        <button
                          onClick={() => setLeaderboardTimeframe('day')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${leaderboardTimeframe === 'day' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-dark/70 hover:text-brand-primary cursor-pointer'}`}
                        >
                          Hari Ini
                        </button>
                        <button
                          onClick={() => setLeaderboardTimeframe('month')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${leaderboardTimeframe === 'month' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-dark/70 hover:text-brand-primary cursor-pointer'}`}
                        >
                          Bulan Ini
                        </button>
                        <button
                          onClick={() => setLeaderboardTimeframe('year')}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${leaderboardTimeframe === 'year' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-dark/70 hover:text-brand-primary cursor-pointer'}`}
                        >
                          Tahun Ini
                        </button>
                      </div>
                    </div>

                    {/* Leaderboard list */}
                    <div className="space-y-4">
                      {sortedLeaderboard.map((regData, index) => {
                        const isTopThree = index < 3;
                        const ratioPercent = Math.round((regData.weightKg / maxLeaderboardWeight) * 100);
                        
                        // Cek apakah item leaderboard ini sedang aktif di filter kita
                        let isSelected = false;
                        if (!selectedRegency) {
                          isSelected = false; // Belum memfilter kabupaten
                        } else if (!selectedKecamatan) {
                          isSelected = selectedRegency === regData.name;
                        } else if (!selectedDesa) {
                          isSelected = selectedKecamatan === regData.name;
                        } else {
                          isSelected = selectedDesa === regData.name;
                        }

                        // Predikat kerajinan
                        let diligencePred = "Perlu Edukasi";
                        let diligenceColor = "text-[#9E9E9E] bg-[#F5F5F5] border-[#E0E0E0]";
                        if (index < 3) {
                          diligencePred = "Sangat Rajin";
                          diligenceColor = "text-brand-primary bg-brand-light border-brand-primary/10";
                        } else if (index < 6) {
                          diligencePred = "Aktif Memilah";
                          diligenceColor = "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/15";
                        }

                        return (
                          <div 
                            key={regData.name}
                            onClick={() => {
                              if (regData.type === 'kabupaten') {
                                setSelectedRegency(regData.name);
                              } else if (regData.type === 'kecamatan') {
                                setSelectedKecamatan(regData.name);
                              } else if (regData.type === 'desa') {
                                setSelectedDesa(regData.name === selectedDesa ? '' : regData.name);
                              }
                            }}
                            className={`p-3.5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-brand-primary/30 cursor-pointer active:scale-[0.99] ${
                              isSelected 
                                ? 'bg-brand-primary/5 border-brand-primary/30 shadow-inner' 
                                : 'bg-white border-brand-light'
                            }`}
                          >
                            {/* Rank, Name, Predicate */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs border ${
                                index === 0 ? 'bg-brand-yellow/20 text-[#D87D0A] border-brand-yellow/30' :
                                index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                index === 2 ? 'bg-orange-50 text-amber-700 border-amber-200' :
                                'bg-[#F9FBF9] text-brand-dark/60 border-brand-light'
                              }`}>
                                {index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : `#${index + 1}`}
                              </span>
                              <div>
                                <h4 className="text-xs font-extrabold text-brand-dark flex items-center gap-1.5">
                                  {regData.name}
                                  {isSelected && <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping" />}
                                </h4>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 ${diligenceColor}`}>
                                  {diligencePred}
                                </span>
                              </div>
                            </div>

                            {/* Relative Progress bar */}
                            <div className="flex-1 min-w-[120px] max-w-sm flex items-center gap-2">
                              <div className="w-full h-2 bg-[#F5FBF7] border border-brand-light rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-primary rounded-full transition-all duration-500"
                                  style={{ width: `${ratioPercent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-brand-textSecondary w-8 text-right">{ratioPercent}%</span>
                            </div>

                            {/* Sorted volume & citizen numbers */}
                            <div className="flex items-center gap-6 text-right shrink-0">
                              <div>
                                <span className="text-[9px] text-brand-textSecondary font-bold block uppercase tracking-wider">Volume Terpilah</span>
                                <span className="text-xs font-black text-brand-dark block mt-0.5">
                                  {regData.weightKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                                </span>
                              </div>
                              <div className="w-14">
                                <span className="text-[9px] text-brand-textSecondary font-bold block uppercase tracking-wider">Warga</span>
                                <span className="text-xs font-extrabold text-brand-primary block mt-0.5">
                                  {regData.contributors} Jiwa
                                </span>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Column Right: Focused Regency details */}
                <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium flex flex-col">
                  <div className="border-b border-brand-light pb-4 mb-5 shrink-0 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Inspektor Daerah</span>
                      <h3 className="text-base font-bold text-brand-dark mt-0.5 font-display flex items-center gap-1.5">
                        <MapPin className="w-4.5 h-4.5 text-brand-yellow shrink-0 stroke-[2.2px]" />
                        Detail Wilayah Fokus
                      </h3>
                    </div>
                  </div>

                  {selectedRegency ? (
                    <div className="space-y-6 flex-1 animate-fade-slide">
                      
                      {/* Title */}
                      <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                        <h4 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wide">Fokus Terpilih:</h4>
                        <p className="text-base font-black text-brand-primary mt-1 font-display">Kabupaten {selectedRegency}</p>
                      </div>

                      {/* 3 Detail Stats inside */}
                      <div className="space-y-3">
                        <div className="bg-brand-light/35 border border-brand-light p-3.5 rounded-2xl flex justify-between items-center">
                          <span className="text-xs text-brand-textSecondary font-bold flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4 text-brand-primary" />
                            Total Terpilah
                          </span>
                          <span className="text-sm font-black text-brand-dark">
                            {filteredSummary.totalKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                          </span>
                        </div>

                        <div className="bg-brand-light/35 border border-brand-light p-3.5 rounded-2xl flex justify-between items-center">
                          <span className="text-xs text-brand-textSecondary font-bold flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-brand-yellow" />
                            Potensi PSEL
                          </span>
                          <span className="text-sm font-black text-brand-dark">
                            {filteredSummary.totalKwh.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kWh
                          </span>
                        </div>

                        <div className="bg-brand-light/35 border border-brand-light p-3.5 rounded-2xl flex justify-between items-center">
                          <span className="text-xs text-brand-textSecondary font-bold flex items-center gap-1.5">
                            <Leaf className="w-4 h-4 text-[#4CAF50]" />
                            CO₂ Dicegah
                          </span>
                          <span className="text-sm font-black text-brand-dark">
                            {filteredSummary.totalCo2e.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                          </span>
                        </div>
                      </div>

                      {/* Composition breakdown progress bars */}
                      <div className="space-y-4 pt-4 border-t border-brand-light">
                        <h5 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
                          Distribusi Kategori Sampah:
                        </h5>
                        
                        {/* Organik Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-sampah-organik flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-sampah-organik" />
                              Organik (Pakan/Kompos)
                            </span>
                            <span className="text-brand-dark">{selectedComposition.organikPercent}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-brand-light rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sampah-organik rounded-full transition-all duration-300"
                              style={{ width: `${selectedComposition.organikPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Anorganik Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-sampah-anorganik flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-sampah-anorganik" />
                              Anorganik (RDF/Daur Ulang)
                            </span>
                            <span className="text-brand-dark">{selectedComposition.anorganikPercent}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-brand-light rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sampah-anorganik rounded-full transition-all duration-300"
                              style={{ width: `${selectedComposition.anorganikPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Residu Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-sampah-residu flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-sampah-residu" />
                              Residu (Landfill/PSEL)
                            </span>
                            <span className="text-brand-dark">{selectedComposition.residuPercent}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-brand-light rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sampah-residu rounded-full transition-all duration-300"
                              style={{ width: `${selectedComposition.residuPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Strategic Action Recommendation */}
                      <div className="pt-4 border-t border-brand-light bg-[#FFFDF9] border border-brand-yellow/15 p-4 rounded-2xl shrink-0 flex items-start gap-2.5">
                        <Zap className="w-4.5 h-4.5 text-brand-yellow shrink-0 mt-0.5 stroke-[2.2px]" />
                        <div className="text-[11px] text-brand-textSecondary leading-normal">
                          <strong className="block text-brand-dark uppercase tracking-wider text-[10px] mb-1">Rekomendasi Dinas:</strong>
                          {selectedComposition.organikPercent > 50 
                            ? `Wilayah ini didominasi sampah organik (${selectedComposition.organikPercent}%). Prioritaskan insentif dan fasilitas bak komposter komunal pada area TPS3R setempat.`
                            : `Wilayah ini menghasilkan bahan bakar RDF yang tinggi (${selectedComposition.anorganikPercent}%). Segera jadwalkan pengangkutan ke insinerator PSEL Pesanggaran untuk konversi listrik.`
                          }
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="py-12 px-4 border-2 border-dashed border-brand-primary/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 animate-fade-slide">
                      <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-brand-primary" />
                      </div>
                      <div className="max-w-[200px]">
                        <h4 className="text-xs font-bold text-brand-dark">Peta Interaktif Aktif</h4>
                        <p className="text-[10px] text-brand-textSecondary leading-normal mt-1">
                          Silakan klik salah satu wilayah kabupaten di Bali pada peta Choropleth di sebelah kiri untuk menelaah statistik spasial, warga aktif, serta komposisi sampah secara spesifik.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {activeTab === 'feedstock' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-fade-slide">
              
              {/* Left Column: Feedstock Gauge inside a grand layout */}
              <div className="lg:col-span-2">
                <FeedstockGauge logs={selectedRegency ? logs.filter(l => l.kabupaten === selectedRegency) : logs} />
              </div>

              {/* Right Column: Detailed operator advice & technical references */}
              <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-brand-dark border-b border-brand-light pb-3 mb-4 font-display flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-primary stroke-[2.2px]" />
                    Standar Kalor RDF & PSEL
                  </h3>
                  <p className="text-xs text-brand-textSecondary leading-relaxed">
                    Sistem RDF (Refuse-Derived Fuel) dan PSEL (Pengolahan Sampah menjadi Energi Listrik) di Bali memerlukan karakteristik sampah anorganik kering tertentu agar nilai kalori (LHV) mencukupi untuk memutar turbin generator secara optimal.
                  </p>
                  
                  <div className="mt-5 space-y-4 text-xs">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center text-brand-primary shrink-0 font-extrabold text-[10px]">
                        1
                      </div>
                      <div>
                        <strong className="text-brand-dark block">Kadar Air Rendah (&lt; 20%)</strong>
                        <span className="text-brand-textSecondary text-[11px] block mt-0.5">Membantu pembakaran bersih tanpa memadamkan tungku insinerator utama.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center text-brand-primary shrink-0 font-extrabold text-[10px]">
                        2
                      </div>
                      <div>
                        <strong className="text-brand-dark block">Bebas Logam & Kaca (Kontaminan)</strong>
                        <span className="text-brand-textSecondary text-[11px] block mt-0.5">Kaca meleleh merusak dinding tungku, logam berat menyumbat slag filter mekanik.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center text-brand-primary shrink-0 font-extrabold text-[10px]">
                        3
                      </div>
                      <div>
                        <strong className="text-brand-dark block">Dominasi Polimer Plastik/Kertas</strong>
                        <span className="text-brand-textSecondary text-[11px] block mt-0.5">Memiliki nilai kalor tinggi (&gt; 14 MJ/kg) untuk mendukung kemandirian pembakaran (*self-sustaining*).</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FFFDF9] border border-brand-yellow/15 rounded-2xl text-[11px] text-brand-textSecondary leading-normal">
                  <span className="font-bold text-brand-dark uppercase tracking-wider block text-[10px] mb-1">Catatan Insinyur PSEL:</span>
                  Data warga yang dilaporkan secara jujur di PWA warga membantu operator memprediksi laju kontaminasi sebelum truk sampah diturunkan di belt conveyor penampungan akhir.
                </div>
              </div>

            </div>
          )}

          {activeTab === 'surge' && (
            <div className="animate-fade-slide">
              <SurgePredictor regency={selectedRegency || 'Badung'} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-slide">
              
              {/* Left Column: Periodic Report Generator */}
              <div className="lg:col-span-1">
                <ReportGenerator logs={logs} selectedRegency={selectedRegency} />
              </div>

              {/* Right Column: Interactive Transaction Audit Log Table */}
              <div className="lg:col-span-2 bg-white border border-brand-light rounded-3xl p-6 shadow-premium flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-light pb-4 mb-5 gap-3">
                  <div>
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Audit Kepatuhan</span>
                    <h3 className="text-base font-bold text-brand-dark mt-0.5 font-display flex items-center gap-1.5">
                      <Clock className="w-5 h-5 text-brand-primary stroke-[2.2px]" />
                      Riwayat Log Transaksi Warga
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest bg-brand-light px-2.5 py-1 rounded-full border border-brand-primary/5">
                    {filteredAuditLogs.length} Entri Ditemukan
                  </span>
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 shrink-0">
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari ID Log / Wilayah..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 bg-[#F9FBF9] border border-brand-light rounded-2xl pl-10 pr-4 text-xs font-bold text-brand-dark placeholder-brand-textMuted focus:outline-none focus:border-brand-primary"
                    />
                    <Search className="w-4 h-4 text-brand-textMuted absolute left-4.5 top-3.5" />
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-11 bg-[#F9FBF9] border border-brand-light rounded-2xl px-4 text-xs font-bold text-brand-dark focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="all">Semua Kategori Sampah</option>
                      <option value="organik">Organik</option>
                      <option value="anorganik">Anorganik</option>
                      <option value="residu">Residu</option>
                    </select>
                    <Filter className="w-4 h-4 text-brand-textMuted absolute right-4.5 top-3.5 pointer-events-none" />
                  </div>

                </div>

                {/* Log Data Table */}
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                    <table className="min-w-full divide-y divide-brand-light">
                      <thead>
                        <tr className="text-left text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider">
                          <th className="py-3 px-3">ID Log</th>
                          <th className="py-3 px-3">Waktu</th>
                          <th className="py-3 px-3">Wilayah</th>
                          <th className="py-3 px-3">Kategori</th>
                          <th className="py-3 px-3 text-right">Berat</th>
                          <th className="py-3 px-3 text-right">kWh</th>
                          <th className="py-3 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-light/60 text-xs font-semibold text-brand-dark">
                        {paginatedLogs.length > 0 ? (
                          paginatedLogs.map((log) => {
                            let catBadge = "text-sampah-organik bg-sampah-organikLight";
                            if (log.kategori === 'anorganik') catBadge = "text-sampah-anorganik bg-sampah-anorganikLight";
                            else if (log.kategori === 'residu') catBadge = "text-sampah-residu bg-sampah-residuLight";

                            return (
                              <tr key={log.id} className="hover:bg-brand-light/35 transition-colors">
                                <td className="py-3 px-3 font-mono text-[10px] text-brand-textSecondary">{log.id}</td>
                                <td className="py-3 px-3 text-brand-textSecondary">
                                  {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-brand-dark">{log.kabupaten}</div>
                                  {log.kecamatan && (
                                    <div className="text-[10px] text-brand-textSecondary font-semibold mt-0.5">
                                      Kec. {log.kecamatan}, Desa {log.desa} {log.banjar ? `(${log.banjar})` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catBadge}`}>
                                    {log.kategori}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-bold">
                                  {((log.berat_gram || 0) / 1000).toFixed(2)} kg
                                </td>
                                <td className="py-3 px-3 text-right text-brand-yellow font-bold">
                                  {(log.kwh_potensi || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary">
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                                    Tervalidasi
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-brand-textSecondary text-xs">
                              Tidak ada log pemilahan yang cocok dengan pencarian Anda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-brand-light pt-4 mt-4 shrink-0">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 border border-brand-light hover:bg-brand-light rounded-xl text-xs font-bold text-brand-primary cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Sebelumnya
                    </button>
                    
                    <span className="text-xs font-bold text-brand-textSecondary">
                      Halaman <span className="text-brand-primary font-black">{currentPage}</span> dari <span className="font-bold text-brand-dark">{totalPages}</span>
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 border border-brand-light hover:bg-brand-light rounded-xl text-xs font-bold text-brand-primary cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
                    >
                      Berikutnya
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}

