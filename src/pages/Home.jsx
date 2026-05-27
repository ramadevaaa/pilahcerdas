import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Leaf, Zap, CloudSun, Trash2, ChevronRight,
  Calendar, TrendingUp, Droplets, Sun, Moon, Sunrise,
  X, Filter, CalendarRange, AlertTriangle, BookOpen, Sparkles,
  Soup, Citrus, Flower
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KATEGORI_COLORS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { LaporAduan } from '../components/features/LaporAduan';
import { useAduan } from '../hooks/useAduan';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { text: 'Selamat Pagi', icon: Sunrise, sub: 'Mulai hari dengan memilah sampah!' };
  if (h >= 11 && h < 15) return { text: 'Selamat Siang', icon: Sun, sub: 'Sudahkah memilah sampah hari ini?' };
  if (h >= 15 && h < 18) return { text: 'Selamat Sore', icon: CloudSun, sub: 'Waktu yang tepat untuk mencatat pilahan!' };
  return { text: 'Selamat Malam', icon: Moon, sub: 'Ayo catat sampah hari ini sebelum tidur.' };
}

export function Home({ logs = [], regency, onNavigate }) {
  const { profile, isGuest, logout } = useAuth();
  const { aduanList } = useAduan();
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  // State untuk modal riwayat lengkap
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // State untuk modal Panduan Olah Organik Mandiri
  const [activeOlahCategory, setActiveOlahCategory] = useState(null);

  // State untuk modal detail profil warga
  const [showProfileModal, setShowProfileModal] = useState(false);

  // State untuk modal Lapor Aduan
  const [isLaporModalOpen, setIsLaporModalOpen] = useState(false);
  const [laporModalTab, setLaporModalTab] = useState('lapor');
  const [laporModalExpandedId, setLaporModalExpandedId] = useState(null);

  const handleOpenOlahModal = (category) => {
    setActiveOlahCategory(category);
  };

  const handleCloseOlahModal = () => {
    setActiveOlahCategory(null);
  };

  // Kunci scroll halaman utama saat modal riwayat dibuka
  useEffect(() => {
    if (isHistoryModalOpen || activeOlahCategory || showProfileModal || isLaporModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isHistoryModalOpen, activeOlahCategory, showProfileModal, isLaporModalOpen]);

  // Kalkulasi statistik subkategori organik dari logs
  const organicBreakdown = useMemo(() => {
    let dagingG = 0;
    let sayurG = 0;
    let upakaraG = 0;
    let lainG = 0;

    logs.forEach(log => {
      if (log.kategori === 'organik') {
        const berat = log.berat_gram || 0;
        const sub = log.subkategori || [];
        
        // Jika log lama atau tidak ada subkategori, kita asumsikan masuk kategori umum 'lain'
        if (!sub || sub.length === 0) {
          lainG += berat;
          return;
        }

        // Jika ada subkategori, bagi rata berat di antara subkategori terpilih
        const share = berat / sub.length;
        sub.forEach(s => {
          if (s.includes('daging') || s.includes('makanan')) dagingG += share;
          else if (s.includes('sayur') || s.includes('buah')) sayurG += share;
          else if (s.includes('upakara') || s.includes('canang') || s.includes('bunga')) upakaraG += share;
          else lainG += share;
        });
      }
    });

    return {
      daging: dagingG / 1000, // kg
      sayur: sayurG / 1000,   // kg
      upakara: upakaraG / 1000, // kg
      lain: lainG / 1000      // kg
    };
  }, [logs]);

  // Ringkasan total dari semua log user
  const summary = useMemo(() => {
    const totalKg = logs.reduce((s, l) => s + (l.berat_gram || 0), 0) / 1000;
    const totalKwh = logs.reduce((s, l) => s + (l.kwh_potensi || 0), 0);
    const totalCo2e = logs.reduce((s, l) => s + (l.co2e_saved || 0), 0);
    return { totalKg, totalKwh, totalCo2e };
  }, [logs]);

  // Ekstraksi bulan-bulan unik dari log untuk filter dropdown
  const uniqueMonths = useMemo(() => {
    const months = new Set();
    logs.forEach(l => {
      if (l.created_at) {
        const d = new Date(l.created_at);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.add(yearMonth);
      }
    });
    return Array.from(months).sort().reverse();
  }, [logs]);

  // Log yang difilter
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesCategory = !filterCategory || log.kategori === filterCategory;
      let matchesMonth = true;
      if (filterMonth && log.created_at) {
        const d = new Date(log.created_at);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = ym === filterMonth;
      }
      return matchesCategory && matchesMonth;
    });
  }, [logs, filterCategory, filterMonth]);

  // Ringkasan dampak khusus filter aktif
  const filteredSummary = useMemo(() => {
    const totalKg = filteredLogs.reduce((s, l) => s + (l.berat_gram || 0), 0) / 1000;
    const totalKwh = filteredLogs.reduce((s, l) => s + (l.kwh_potensi || 0), 0);
    const totalCo2e = filteredLogs.reduce((s, l) => s + (l.co2e_saved || 0), 0);
    return { totalKg, totalKwh, totalCo2e };
  }, [filteredLogs]);

  // Kalender konsistensi: 4 minggu terakhir (28 hari), diselaraskan dengan hari Senin ke Minggu
  const calendarDots = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Jarak dari hari Senin terdekat di minggu ini (Senin = 1, jika Minggu = 0, jaraknya 6 hari)
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    // Senin dari 3 minggu yang lalu (total 4 minggu termasuk minggu ini)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysSinceMonday - 21); // 21 hari = 3 minggu
    
    const days = [];
    const logDates = new Set(
      logs.map(l => {
        const d = new Date(l.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    // Kita buat 28 hari (4 minggu penuh, dari Senin 3 minggu lalu sampai Minggu minggu ini)
    for (let i = 0; i < 28; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      
      const isToday = d.getDate() === today.getDate() && 
                      d.getMonth() === today.getMonth() && 
                      d.getFullYear() === today.getFullYear();
                      
      const isFuture = d > today;

      days.push({
        date: d,
        hasLog: logDates.has(key),
        isToday,
        isFuture,
        dayLabel: d.getDate()
      });
    }
    return days;
  }, [logs]);

  // 5 log terbaru
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="px-5 pt-12 pb-36 md:pb-12 md:px-8 md:pt-20 md:space-y-8 space-y-6 max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
      {/* Greeting Header & Premium Profile Card */}
      <div className="bg-white border border-brand-light rounded-3xl p-5 md:p-6 shadow-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => profile && setShowProfileModal(true)}
            className={`w-12 h-12 rounded-2xl bg-brand-light text-brand-primary flex items-center justify-center font-extrabold text-lg shrink-0 border-0 ${
              profile ? 'cursor-pointer hover:bg-brand-primary/10 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md' : 'cursor-default'
            }`}
            title={profile ? "Lihat Detail Profil Warga" : "Menu Tamu"}
          >
            {profile ? profile.nama_lengkap.charAt(0) : 'G'}
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-brand-dark flex items-center gap-2 font-display leading-tight">
              <GreetIcon className="w-5 h-5 text-brand-yellow shrink-0 stroke-[2.5px]" />
              <span>{profile ? `${greeting.text}, ${profile.nama_lengkap.split(' ')[0]}!` : `${greeting.text}, Tamu!`}</span>
            </h1>
            <p className="text-xs text-brand-textSecondary mt-0.5 font-medium leading-normal">
              {profile 
                ? `Banjar ${profile.banjar}, Desa ${profile.desa}` 
                : 'Masuk mode tamu tanpa pencatatan online'}
            </p>
            {profile && (
              <button 
                onClick={() => setShowProfileModal(true)}
                className="text-[10px] text-brand-primary hover:underline font-extrabold mt-1.5 flex items-center gap-0.5 bg-transparent border-0 p-0 cursor-pointer"
              >
                <span>Lihat Detail Profil</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Regency Badge */}
          <div className="flex items-center gap-1.5 bg-brand-light text-brand-primary text-xs font-extrabold px-3 py-2 rounded-2xl border border-brand-primary/5 shadow-sm">
            <Leaf className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span className="max-w-[100px] truncate">{profile ? profile.kabupaten : (regency || 'Bali')}</span>
          </div>

          {/* Logout / Switch Account Button */}
          <button
            onClick={() => {
              const confirmLogout = window.confirm(profile ? "Apakah Anda yakin ingin keluar dari akun warga?" : "Apakah Anda ingin masuk/daftar sebagai warga?");
              if (confirmLogout) logout();
            }}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl border border-red-100 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
            title={profile ? "Keluar Akun" : "Daftar / Masuk Akun"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Spanduk Siaga Darurat TPA Suwung */}
      <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-primary stroke-[2.5px]" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-brand-dark flex items-center gap-1.5">
              Langkah Nyata: Menuju Bali Lestari & Mandiri Energi!
            </h4>
            <p className="text-xs md:text-sm text-brand-textSecondary leading-relaxed mt-1">
              Setiap pilahan sampah dari dapur Anda adalah kontribusi nyata dalam menjaga kesucian alam Bali (<strong>Tri Hita Karana</strong>) sekaligus mendukung terwujudnya kemandirian energi bersih.
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Aksi Cepat Lapor Sampah Menumpuk / Liar */}
      <div 
        onClick={() => {
          if (isGuest) {
            alert("Fitur Laporan Aduan hanya tersedia untuk Warga Terdaftar. Silakan daftarkan akun warga Anda 🔒");
          } else {
            setLaporModalTab('lapor');
            setLaporModalExpandedId(null);
            setIsLaporModalOpen(true);
          }
        }}
        className="bg-gradient-to-r from-orange-50 to-amber-50 border border-brand-orange/20 rounded-3xl p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer hover:shadow-premium-lg hover:scale-[1.01] active:scale-[0.99] transition-all group shrink-0"
      >
        <div className="flex gap-3.5 items-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <AlertTriangle className="w-6 h-6 stroke-[2.2px] animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-brand-dark flex items-center gap-1.5 leading-snug">
              Temukan Sampah Liar / Pembakaran Sampah?
            </h4>
            <p className="text-xs text-brand-textSecondary mt-0.5 leading-relaxed">
              Ambil foto aduan dan laporkan langsung ke DLH / TPS3R setempat. Tindakan nyata real-time!
            </p>
          </div>
        </div>
        <div className="w-10 h-10 bg-white border border-brand-orange/15 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-orange/10 group-hover:border-brand-orange/30 transition-all shadow-sm">
          <ChevronRight className="w-5 h-5 text-brand-orange stroke-[2.5px]" />
        </div>
      </div>

      {/* Ringkasan Dampak Cards - Full Width on Desktop */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <Card padding="sm" className="flex flex-col items-center text-center md:py-6 md:px-4 lg:p-8">
          <div className="w-9 h-9 md:w-14 md:h-14 bg-brand-light rounded-2xl md:rounded-3xl flex items-center justify-center mb-2 md:mb-4">
            <Trash2 className="w-4.5 h-4.5 md:w-7 md:h-7 text-brand-primary stroke-[2.5px]" />
          </div>
          <span className="text-xl md:text-3xl font-extrabold text-brand-dark font-display leading-none">
            {summary.totalKg.toFixed(1)}
          </span>
          <span className="text-[10px] md:text-xs text-brand-textSecondary font-bold mt-1 md:mt-2 uppercase tracking-wider">
            kg Terpilah
          </span>
        </Card>

        <Card padding="sm" className="flex flex-col items-center text-center md:py-6 md:px-4 lg:p-8">
          <div className="w-9 h-9 md:w-14 md:h-14 bg-brand-yellow/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-2 md:mb-4">
            <Zap className="w-4.5 h-4.5 md:w-7 md:h-7 text-brand-yellow stroke-[2.5px]" />
          </div>
          <span className="text-xl md:text-3xl font-extrabold text-brand-dark font-display leading-none">
            {summary.totalKwh.toFixed(2)}
          </span>
          <span className="text-[10px] md:text-xs text-brand-textSecondary font-bold mt-1 md:mt-2 uppercase tracking-wider">
            kWh Listrik
          </span>
        </Card>

        <Card padding="sm" className="flex flex-col items-center text-center md:py-6 md:px-4 lg:p-8">
          <div className="w-9 h-9 md:w-14 md:h-14 bg-sampah-organikLight rounded-2xl md:rounded-3xl flex items-center justify-center mb-2 md:mb-4">
            <Droplets className="w-4.5 h-4.5 md:w-7 md:h-7 text-sampah-organik stroke-[2.5px]" />
          </div>
          <span className="text-xl md:text-3xl font-extrabold text-brand-dark font-display leading-none">
            {summary.totalCo2e.toFixed(2)}
          </span>
          <span className="text-[10px] md:text-xs text-brand-textSecondary font-bold mt-1 md:mt-2 uppercase tracking-wider">
            kg CO₂e
          </span>
        </Card>
      </div>

      {/* Klinik Pengolahan Organik Mandiri */}
      <Card>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-brand-primary stroke-[2.5px]" />
            <h2 className="text-sm md:text-base font-bold text-brand-dark">Klinik Organik Mandiri</h2>
          </div>
          <span className="text-[10px] md:text-xs text-brand-primary font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-yellow animate-spin-slow" />
            Olah Mandiri di Rumah
          </span>
        </div>

        <p className="text-xs md:text-sm text-brand-textSecondary leading-relaxed mb-4 md:mb-6">
          Berdasarkan catatan pemilahan sampah Anda, berikut adalah perkiraan komposisi sampah organik yang dihasilkan. Ketuk jenis sampah untuk mempelajari panduan mengolahnya secara praktis di pekarangan Anda!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card Sisa Makanan/Daging */}
          <div
            onClick={() => handleOpenOlahModal('daging')}
            className="group bg-gradient-to-br from-rose-50/40 to-rose-100/30 border border-rose-200/50 hover:border-rose-300/80 p-4 rounded-3xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex flex-col justify-between h-32 shadow-premium hover:shadow-premium-lg"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-black text-brand-dark block leading-snug w-2/3">Sisa Makanan</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100/50 text-rose-700 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Soup className="w-4.5 h-4.5 stroke-[2.2px]" />
              </div>
            </div>
            <div className="mt-auto">
              <span className="text-xl md:text-2xl font-extrabold text-rose-700 block leading-none font-display">
                {organicBreakdown.daging.toFixed(2)} <span className="text-xs font-semibold">kg</span>
              </span>
              <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block mt-1.5">
                Terproduksi
              </span>
            </div>
          </div>

          {/* Card Sayur/Buah */}
          <div
            onClick={() => handleOpenOlahModal('sayur')}
            className="group bg-gradient-to-br from-green-50/40 to-green-100/30 border border-green-200/50 hover:border-green-300/80 p-4 rounded-3xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex flex-col justify-between h-32 shadow-premium hover:shadow-premium-lg"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-black text-brand-dark block leading-snug w-2/3">Sisa Sayur</span>
              <div className="w-8 h-8 rounded-xl bg-green-100/50 text-green-700 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Citrus className="w-4.5 h-4.5 stroke-[2.2px]" />
              </div>
            </div>
            <div className="mt-auto">
              <span className="text-xl md:text-2xl font-extrabold text-green-700 block leading-none font-display">
                {organicBreakdown.sayur.toFixed(2)} <span className="text-xs font-semibold">kg</span>
              </span>
              <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block mt-1.5">
                Terproduksi
              </span>
            </div>
          </div>

          {/* Card Sampah Upakara */}
          <div
            onClick={() => handleOpenOlahModal('upakara')}
            className="group bg-gradient-to-br from-amber-50/40 to-amber-100/30 border border-amber-200/50 hover:border-amber-300/80 p-4 rounded-3xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex flex-col justify-between h-32 shadow-premium hover:shadow-premium-lg"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-black text-brand-dark block leading-snug w-2/3">Upakara Adat</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100/50 text-amber-600 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Flower className="w-4.5 h-4.5 stroke-[2.2px]" />
              </div>
            </div>
            <div className="mt-auto">
              <span className="text-xl md:text-2xl font-extrabold text-amber-600 block leading-none font-display">
                {organicBreakdown.upakara.toFixed(2)} <span className="text-xs font-semibold">kg</span>
              </span>
              <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block mt-1.5">
                Terproduksi
              </span>
            </div>
          </div>

          {/* Card Organik Lainnya */}
          <div
            onClick={() => handleOpenOlahModal('lain')}
            className="group bg-gradient-to-br from-slate-50/40 to-slate-100/30 border border-slate-200/50 hover:border-slate-300/80 p-4 rounded-3xl cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex flex-col justify-between h-32 shadow-premium hover:shadow-premium-lg"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs font-black text-brand-dark block leading-snug w-2/3">Daun Kering</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100/50 text-slate-700 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Leaf className="w-4.5 h-4.5 stroke-[2.2px]" />
              </div>
            </div>
            <div className="mt-auto">
              <span className="text-xl md:text-2xl font-extrabold text-slate-700 block leading-none font-display">
                {organicBreakdown.lain.toFixed(2)} <span className="text-xs font-semibold">kg</span>
              </span>
              <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block mt-1.5">
                Terproduksi
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Consistency Calendar (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2">
          {/* Kalender Konsistensi */}
          <Card className="h-full">
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-brand-primary stroke-[2.5px]" />
                <h2 className="text-sm md:text-base font-bold text-brand-dark">Kalender Konsistensi</h2>
              </div>
              <span className="text-[10px] md:text-xs text-brand-textSecondary font-bold uppercase tracking-wider">
                4 Minggu Terakhir
              </span>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 md:gap-4 mb-3 text-center border-b border-brand-light pb-2">
              {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => (
                <div key={i} className="text-[10px] md:text-xs text-brand-textSecondary font-bold">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Dots Grid */}
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {calendarDots.map((day, i) => {
                let dotClass = '';
                if (day.isFuture) {
                  dotClass = 'bg-gray-50/50 text-brand-textMuted/30 border border-dashed border-gray-200';
                } else if (day.hasLog) {
                  dotClass = 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 hover:bg-brand-primary/95 cursor-pointer hover:scale-105';
                } else if (day.isToday) {
                  dotClass = 'bg-brand-yellow/20 text-brand-yellow border-2 border-brand-yellow shadow-sm hover:scale-105';
                } else {
                  dotClass = 'bg-brand-light/60 text-brand-textMuted hover:bg-brand-light hover:text-brand-dark cursor-pointer';
                }
                
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center"
                    title={day.date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  >
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-base font-extrabold transition-all duration-300 ${dotClass}`}
                    >
                      {day.dayLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-5 md:mt-6 pt-4 border-t border-brand-light">
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-lg bg-brand-primary" />
                Sudah Memilah
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-lg bg-brand-light/60 border border-brand-light" />
                Belum
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 rounded-lg bg-brand-yellow/20 border-2 border-brand-yellow" />
                Hari Ini
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: CTA & Recent Logs (Spans 1 column on desktop) */}
        <div className="space-y-6">
          {/* CTA Catat */}
          <Card
            variant="green"
            hoverable
            onClick={() => onNavigate('catat')}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-md shadow-brand-primary/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">Catat Pilahan Baru</h3>
                <p className="text-xs text-brand-textSecondary mt-0.5">Nyalakan bohlam Edison dari sampahmu</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-primary" />
          </Card>

          {/* Riwayat Terbaru */}
          {recentLogs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-brand-primary stroke-[2.5px]" />
                  Riwayat Terakhir
                </h2>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-xs font-extrabold text-brand-primary hover:text-brand-dark transition-colors duration-200 cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-2">
                {recentLogs.map((log, i) => {
                  const kat = KATEGORI_COLORS[log.kategori] || KATEGORI_COLORS.residu;
                  const gram = log.berat_gram || 0;
                  const date = new Date(log.created_at);
                  return (
                    <Card
                      key={log.id || i}
                      padding="sm"
                      className="flex items-center justify-between animate-fade-slide"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center animate-pulse-slow"
                          style={{ backgroundColor: kat.light }}
                        >
                          <Trash2 className="w-4.5 h-4.5" style={{ color: kat.bg }} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-brand-dark">{kat.label}</span>
                          <p className="text-[11px] text-brand-textSecondary">
                            {gram >= 1000 ? `${(gram / 1000).toFixed(1)} kg` : `${gram} g`}
                            {log.kwh_potensi > 0 && ` · ${log.kwh_potensi.toFixed(3)} kWh`}
                            {log.co2e_saved > 0 && ` · ${log.co2e_saved.toFixed(3)} kg CO₂e`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-brand-textMuted font-semibold">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        {log.isOffline && (
                          <span className="text-[9px] text-brand-orange font-bold mt-0.5">Belum Tersinkron</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aduan Lingkungan Saya (Opsi B Widget) */}
          {!isGuest && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-brand-orange stroke-[2.5px]" />
                  Aduan Lingkungan Saya
                </h2>
                {aduanList.length > 0 && (
                  <button
                    onClick={() => {
                      setLaporModalTab('riwayat');
                      setLaporModalExpandedId(null);
                      setIsLaporModalOpen(true);
                    }}
                    className="text-xs font-extrabold text-brand-orange hover:text-brand-dark transition-colors duration-200 cursor-pointer bg-transparent border-0"
                  >
                    Lihat Semua
                  </button>
                )}
              </div>

              {aduanList.length === 0 ? (
                <Card padding="sm" className="bg-brand-light/30 border border-brand-light text-center py-5">
                  <p className="text-xs text-brand-textSecondary font-semibold">Belum ada aduan lingkungan yang dilaporkan.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {aduanList.slice(0, 3).map((aduan) => {
                    const kategoriLabels = {
                      tumpukan_liar: 'Sampah Liar',
                      tps_penuh: 'TPS Penuh',
                      pembakaran_terbuka: 'Pembakaran',
                      sungai_tercemar: 'Sungai Tercemar'
                    };
                    const date = new Date(aduan.created_at);
                    
                    let badgeClass = 'bg-amber-50 text-amber-600 border-amber-200';
                    let statusLabel = 'Baru';
                    if (aduan.status === 'proses') {
                      badgeClass = 'bg-blue-50 text-blue-600 border-blue-200';
                      statusLabel = 'Proses';
                    } else if (aduan.status === 'selesai') {
                      badgeClass = 'bg-green-50 text-green-700 border-green-200';
                      statusLabel = 'Selesai';
                    }

                    return (
                      <Card
                        key={aduan.id}
                        padding="sm"
                        hoverable
                        onClick={() => {
                          setLaporModalTab('riwayat');
                          setLaporModalExpandedId(aduan.id);
                          setIsLaporModalOpen(true);
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 bg-brand-light relative border border-brand-light/40">
                            <img src={aduan.foto_url} alt="Aduan" className="w-full h-full object-cover" />
                            {aduan.isOffline && (
                              <span className="absolute inset-0 bg-black/55 text-[8px] text-brand-orange font-black flex items-center justify-center text-center">Lokal</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-brand-dark leading-tight block">
                              {kategoriLabels[aduan.kategori] || aduan.kategori}
                            </span>
                            <p className="text-[10px] text-brand-textSecondary mt-0.5 max-w-[150px] truncate">
                              📍 {aduan.kabupaten}{aduan.kecamatan && `, Kec. ${aduan.kecamatan}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border uppercase tracking-wider ${badgeClass}`}>
                            {statusLabel}
                          </span>
                          <span className="text-[9px] text-brand-textMuted font-bold">
                            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Riwayat Lengkap - dirender via Portal agar keluar dari stacking context <main> */}
      {isHistoryModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-white sm:bg-brand-dark/40 sm:backdrop-blur-md sm:p-4 transition-all duration-300 ease-out animate-backdrop-fade">
          {/* Modal Backdrop Click Out (Desktop only) */}
          <div className="absolute inset-0 cursor-default hidden sm:block" onClick={() => setIsHistoryModalOpen(false)}></div>
          
          {/* Modal Container - fullscreen on mobile, centered card on desktop */}
          <div className="relative w-full sm:max-w-2xl h-full sm:h-[80vh] sm:max-h-[640px] bg-white sm:rounded-3xl sm:border border-brand-primary/10 sm:shadow-premium-lg flex flex-col overflow-hidden animate-modal-content">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pb-5 pt-12 sm:pt-6 border-b border-brand-light">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-lg font-bold text-brand-dark">Semua Riwayat Pilah</h2>
                </div>
                <p className="text-xs text-brand-textSecondary mt-0.5">
                  Menampilkan {filteredLogs.length} dari {logs.length} catatan pembuangan
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2.5 rounded-2xl bg-brand-light hover:bg-brand-primary/10 text-brand-dark transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters Area */}
            <div className="px-6 py-4 bg-brand-light/20 border-b border-brand-light space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                
                {/* Category Quick Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: '', label: 'Semua' },
                    { id: 'organik', label: 'Organik' },
                    { id: 'anorganik', label: 'Anorganik' },
                    { id: 'residu', label: 'Residu' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-0 ${
                        filterCategory === cat.id
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'bg-white hover:bg-brand-light text-brand-textSecondary border border-brand-light/50 shadow-sm'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Month Dropdown Filter */}
                <div className="relative flex items-center gap-2 bg-white border border-brand-light rounded-xl px-3 py-2 w-full sm:w-auto">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-brand-dark focus:outline-none cursor-pointer pr-5 appearance-none w-full sm:w-auto border-0"
                  >
                    <option value="">Semua Bulan</option>
                    {uniqueMonths.map((ym) => (
                      <option key={ym} value={ym}>
                        {(() => {
                          const [year, month] = ym.split('-');
                          const monthsIndo = [
                            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                          ];
                          return `${monthsIndo[parseInt(month, 10) - 1]} ${year}`;
                        })()}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-textSecondary rotate-90 absolute right-3 pointer-events-none" />
                </div>
              </div>

              {/* Active Filter Stats Dashboard */}
              <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-brand-light/60 shadow-premium">
                <div className="text-center">
                  <span className="block text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">
                    Total Berat
                  </span>
                  <span className="text-sm font-extrabold text-brand-dark">
                    {filteredSummary.totalKg.toFixed(1)} kg
                  </span>
                </div>
                <div className="text-center border-x border-brand-light">
                  <span className="block text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">
                    Potensi kWh
                  </span>
                  <span className="text-sm font-extrabold text-brand-dark">
                    {filteredSummary.totalKwh.toFixed(2)} kWh
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">
                    CO₂e Dicegah
                  </span>
                  <span className="text-sm font-extrabold text-brand-dark">
                    {filteredSummary.totalCo2e.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#F9FBF9]">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                    <Filter className="w-8 h-8 text-brand-primary stroke-[1.5px]" />
                  </div>
                  <h3 className="text-sm font-bold text-brand-dark">Tidak Ada Riwayat</h3>
                  <p className="text-xs text-brand-textSecondary max-w-xs mt-1 leading-relaxed">
                    Tidak ada catatan pembuangan sampah yang cocok dengan filter aktif Anda.
                  </p>
                  {(filterCategory || filterMonth) && (
                    <button
                      onClick={() => {
                        setFilterCategory('');
                        setFilterMonth('');
                      }}
                      className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm border-0 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredLogs.map((log, i) => {
                  const kat = KATEGORI_COLORS[log.kategori] || KATEGORI_COLORS.residu;
                  const gram = log.berat_gram || 0;
                  const date = new Date(log.created_at);
                  
                  // Indo Date Formatter
                  const formattedDate = (() => {
                    const monthsIndo = [
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ];
                    const day = date.getDate();
                    const month = monthsIndo[date.getMonth()];
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${day} ${month} ${year}, ${hours}:${minutes}`;
                  })();

                  return (
                    <Card
                      key={log.id || i}
                      padding="sm"
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: kat.light }}
                        >
                          <Trash2 className="w-4.5 h-4.5" style={{ color: kat.bg }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-brand-dark">{kat.label}</span>
                            <span 
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: kat.light, color: kat.text }}
                            >
                              {gram >= 1000 ? `${(gram / 1000).toFixed(1)} kg` : `${gram} g`}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-brand-textSecondary font-semibold">
                            {log.kwh_potensi > 0 && (
                              <span className="flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-brand-yellow" />
                                {log.kwh_potensi.toFixed(3)} kWh
                              </span>
                            )}
                            {log.co2e_saved > 0 && (
                              <span className="flex items-center gap-1">
                                <Droplets className="w-3.5 h-3.5 text-sampah-organik" />
                                {log.co2e_saved.toFixed(3)} kg CO₂e
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-brand-textSecondary font-semibold">
                          {formattedDate}
                        </span>
                        {log.isOffline && (
                          <span className="text-[9px] text-brand-orange font-bold mt-1">
                            Belum Tersinkron
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal Panduan Pengolahan Organik */}
      {activeOlahCategory && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center bg-white sm:bg-brand-dark/40 sm:backdrop-blur-md sm:p-4 transition-all duration-300 ease-out animate-backdrop-fade">
          <div className="absolute inset-0 cursor-default hidden sm:block" onClick={handleCloseOlahModal}></div>
          <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl sm:border border-brand-primary/10 sm:shadow-premium-lg flex flex-col overflow-hidden animate-modal-content max-h-screen sm:max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-12 sm:pt-6 border-b border-brand-light shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                <h3 className="text-base font-extrabold text-brand-dark font-display">
                  {activeOlahCategory === 'daging' && 'Olah Sisa Makanan / Daging'}
                  {activeOlahCategory === 'sayur' && 'Buat Eco-Enzyme Sayur/Buah'}
                  {activeOlahCategory === 'upakara' && 'Kompos Semen Karang Upakara'}
                  {activeOlahCategory === 'lain' && 'Pemanfaatan Daun & Organik Lain'}
                </h3>
              </div>
              <button
                onClick={handleCloseOlahModal}
                className="p-2.5 rounded-2xl bg-brand-light hover:bg-brand-primary/10 text-brand-dark transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs md:text-sm text-brand-textSecondary leading-relaxed bg-[#F9FBF9]">
              {activeOlahCategory === 'daging' && (
                <>
                  <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-4 mb-2">
                    <p className="text-brand-orange font-bold text-xs">⚠️ PERINGATAN PENTING</p>
                    <p className="text-brand-dark text-xs mt-1">
                      Sampah makanan matang/daging cepat membusuk dan mengundang lalat pembawa penyakit jika dibiarkan terbuka. Jangan dicampur dengan sampah daun kering di wadah terbuka!
                    </p>
                  </div>
                  <h4 className="font-extrabold text-brand-dark text-sm">💡 Solusi Terbaik: Ember Tumpuk & BSF</h4>
                  <p>
                    <strong>Metode Ember Tumpuk</strong> adalah solusi paling praktis untuk sisa daging dan makanan matang:
                  </p>
                  <ol className="list-decimal pl-4 space-y-2 font-semibold text-brand-dark">
                    <li>Siapkan 2 ember plastik cat bekas yang ditumpuk. Ember atas dilubangi kecil-kecil di dasarnya, ember bawah dipasangi keran air.</li>
                    <li>Masukkan sisa daging/makanan ke ember atas. Tutup rapat agar lalat hijau tidak masuk.</li>
                    <li>Suhu panas di dalam ember akan menarik lalat <strong>BSF (Black Soldier Fly)</strong> alami untuk bertelur. Larva/maggot BSF akan memakan habis sisa daging dengan sangat cepat tanpa menimbulkan bau busuk.</li>
                    <li><strong>Cairan lindi</strong> yang menetes ke ember bawah dapat dipanen sebagai Pupuk Organik Cair (POC) setelah difermentasi selama 1 minggu.</li>
                  </ol>
                </>
              )}

              {activeOlahCategory === 'sayur' && (
                <>
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 mb-2">
                    <p className="text-brand-primary font-bold text-xs">🌿 POTENSI EMAS: ECO-ENZYME</p>
                    <p className="text-brand-dark text-xs mt-1">
                      Sisa buah dan sayuran mentah adalah bahan utama pembuatan cairan pembersih ajaib ramah lingkungan (Eco-Enzyme).
                    </p>
                  </div>
                  <h4 className="font-extrabold text-brand-dark text-sm">🧪 Cara Membuat Eco-Enzyme (Rumus 1 : 3 : 10)</h4>
                  <p>
                    Campurkan bahan-bahan berikut ke dalam botol/wadah plastik tertutup rapat:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 font-semibold text-brand-dark">
                    <li><strong>1 bagian</strong> Molase atau Gula Merah tebu asli (misal: 100 gram).</li>
                    <li><strong>3 bagian</strong> Sisa buah/sayuran mentah bersih (misal: 300 gram). Potong kecil-kecil.</li>
                    <li><strong>10 bagian</strong> Air bersih (misal: 1 Liter).</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Proses Fermentasi</strong>: Simpan selama 3 bulan. Pada bulan pertama, buka tutupnya sekali sehari untuk membuang gas fermentasi. Hasil akhirnya berupa cairan asam segar berwarna cokelat yang bisa digunakan sebagai pembersih lantai, sabun cuci piring alami, maupun disinfektan.
                  </p>
                </>
              )}

              {activeOlahCategory === 'upakara' && (
                <>
                  <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-4 mb-2">
                    <p className="text-brand-yellow font-extrabold text-xs">🌸 SAMPAH SUCI: UPAKARA & CANANG</p>
                    <p className="text-brand-dark text-xs mt-1">
                      Bunga kamboja, janur, dan daun kelapa dari canang/banten adalah sisa upacara yang sakral namun melimpah. Metode Semen Karang adalah cara terbaik mengolahnya dengan estetika pekarangan Bali.
                    </p>
                  </div>
                  <h4 className="font-extrabold text-brand-dark text-sm">🧱 Metode Kompos Semen Karang</h4>
                  <p>
                    Masyarakat Bali terkenal dengan keindahan pekarangannya. Buat komposter estetik terintegrasi:
                  </p>
                  <ol className="list-decimal pl-4 space-y-2 font-semibold text-brand-dark">
                    <li>Buat bak kecil dari bata merah atau semen bergaya tradisional Bali (*Semen Karang*) di sudut teba/pekarangan belakang rumah.</li>
                    <li>Pisahkan sampah bunga canang dari unsur anorganik (seperti uang kepeng, steples besi, plastik pembungkus biskuit).</li>
                    <li>Masukkan bunga canang ke dalam bak. Siram dengan sedikit air cucian beras (EM4 alami) seminggu sekali untuk mempercepat dekomposisi.</li>
                    <li>Dalam 45-60 hari, bunga-bunga suci ini akan hancur dan menjadi tanah humus hitam subur yang siap digunakan untuk memupuk kebun bunga di pekarangan Anda.</li>
                  </ol>
                </>
              )}

              {activeOlahCategory === 'lain' && (
                <>
                  <h4 className="font-extrabold text-brand-dark text-sm">🍂 Mulsa Organik & Kompos Daun Kering</h4>
                  <p>
                    Daun kering memiliki rasio karbon (C/N) yang tinggi. Sangat baik digunakan sebagai penyeimbang komposter basah maupun diaplikasikan langsung:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 font-semibold text-brand-dark">
                    <li><strong>Mulsa Alami</strong>: Tebarkan daun-daun kering di atas permukaan tanah pot atau bedengan kebun. Ini berfungsi mencegah penguapan air di musim kemarau, menjaga tanah tetap sejuk, dan mencegah gulma tumbuh.</li>
                    <li><strong>Bahan Komposter Cokelat</strong>: Campurkan daun kering dengan sampah sisa makanan basah dengan perbandingan 2:1. Daun kering akan menyerap kelebihan air lindi dan menghilangkan bau busuk dari sampah basah.</li>
                  </ul>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-brand-light flex justify-end shrink-0">
              <button
                onClick={handleCloseOlahModal}
                className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-2xl hover:bg-brand-primary/95 transition-all cursor-pointer border-0 shadow-sm"
              >
                Paham & Siap Praktek!
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal Detail Profil Warga (Level 2) - dirender via Portal */}
      {showProfileModal && profile && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/40 backdrop-blur-md p-4 transition-all duration-300 ease-out animate-backdrop-fade">
          <div className="absolute inset-0 cursor-default" onClick={() => setShowProfileModal(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-brand-primary/10 shadow-premium-lg flex flex-col overflow-hidden animate-modal-content p-6">
            
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 rounded-2xl bg-brand-light hover:bg-brand-primary/10 text-brand-dark transition-all duration-200 cursor-pointer border-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Profile Avatar Glow */}
            <div className="flex flex-col items-center text-center mt-4 mb-6">
              <div className="w-16 h-16 rounded-3xl bg-brand-light text-brand-primary flex items-center justify-center font-black text-2xl shadow-md border border-brand-primary/5 mb-3 relative animate-pulse-slow">
                {profile.nama_lengkap.charAt(0)}
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping" />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <h3 className="text-base font-extrabold text-brand-dark leading-tight">{profile.nama_lengkap}</h3>
              <span className="text-[10px] font-extrabold text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/5 mt-1.5 uppercase tracking-wider">
                Status: Warga Terdaftar (Level 2)
              </span>
            </div>

            {/* Profile Fields Details */}
            <div className="space-y-3.5 bg-brand-light/10 border border-brand-light/60 p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">No. Telepon / WhatsApp</span>
                  <span className="text-xs font-extrabold text-brand-dark">{profile.no_telepon}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Kabupaten/Kota</span>
                  <span className="text-xs font-extrabold text-brand-dark">{profile.kabupaten}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Kecamatan</span>
                  <span className="text-xs font-extrabold text-brand-dark">{profile.kecamatan}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Desa/Kelurahan</span>
                  <span className="text-xs font-extrabold text-brand-dark">{profile.desa}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-brand-textSecondary uppercase tracking-wider block">Banjar Adat</span>
                  <span className="text-xs font-extrabold text-brand-dark">{profile.banjar}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full h-11 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center cursor-pointer shadow-md shadow-brand-primary/10 mt-5 border-0"
            >
              Tutup Detail Profil
            </button>
          </div>
        </div>
      , document.body)}

      {/* Modal Lapor Aduan Warga - dirender via Portal */}
      {isLaporModalOpen && createPortal(
        <LaporAduan 
          initialTab={laporModalTab} 
          initialExpandedId={laporModalExpandedId} 
          onClose={() => setIsLaporModalOpen(false)} 
        />
      , document.body)}
    </div>
  );
}
