import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Leaf, Zap, CloudSun, Trash2, ChevronRight,
  Calendar, TrendingUp, Droplets, Sun, Moon, Sunrise,
  X, Filter, CalendarRange
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { KATEGORI_COLORS } from '../lib/constants';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { text: 'Selamat Pagi', icon: Sunrise, sub: 'Mulai hari dengan memilah sampah!' };
  if (h >= 11 && h < 15) return { text: 'Selamat Siang', icon: Sun, sub: 'Sudahkah memilah sampah hari ini?' };
  if (h >= 15 && h < 18) return { text: 'Selamat Sore', icon: CloudSun, sub: 'Waktu yang tepat untuk mencatat pilahan!' };
  return { text: 'Selamat Malam', icon: Moon, sub: 'Ayo catat sampah hari ini sebelum tidur.' };
}

export function Home({ logs = [], regency, onNavigate }) {
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  // State untuk modal riwayat lengkap
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Kunci scroll halaman utama saat modal riwayat dibuka
  useEffect(() => {
    if (isHistoryModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isHistoryModalOpen]);

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

  // Kalender konsistensi: 30 hari terakhir
  const calendarDots = useMemo(() => {
    const today = new Date();
    const days = [];
    const logDates = new Set(
      logs.map(l => {
        const d = new Date(l.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const isToday = i === 0;
      days.push({
        date: d,
        hasLog: logDates.has(key),
        isToday,
        dayLabel: d.getDate()
      });
    }
    return days;
  }, [logs]);

  // 5 log terbaru
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="px-5 pt-6 pb-36 md:pb-12 md:px-8 md:pt-8 md:space-y-8 space-y-6 max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1 md:mb-1.5">
            <GreetIcon className="w-5 h-5 md:w-7 md:h-7 text-brand-yellow stroke-[2.5px]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-display">
              {greeting.text}
            </h1>
          </div>
          <p className="text-sm md:text-base text-brand-textSecondary leading-relaxed">
            {greeting.sub}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-light text-brand-primary text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2.5 rounded-full border border-brand-primary/5 shadow-sm">
          <Leaf className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 stroke-[2.5px]" />
          {regency || 'Bali'}
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

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Consistency Calendar (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2">
          {/* Kalender Konsistensi */}
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 md:w-6 md:h-6 text-brand-primary stroke-[2.5px]" />
                <h2 className="text-sm md:text-base font-bold text-brand-dark">Kalender Konsistensi</h2>
              </div>
              <span className="text-[10px] md:text-xs text-brand-textSecondary font-semibold uppercase tracking-wider">
                30 Hari Terakhir
              </span>
            </div>

            <div className="grid grid-cols-10 gap-1.5 md:gap-3.5">
              {calendarDots.map((day, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center"
                  title={day.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                >
                  <div
                    className={`w-6 h-6 md:w-11 md:h-11 rounded-lg md:rounded-2xl flex items-center justify-center text-[8px] md:text-sm font-bold transition-all duration-300 ${
                      day.hasLog
                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                        : day.isToday
                        ? 'bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30'
                        : 'bg-brand-light/60 text-brand-textMuted'
                    }`}
                  >
                    {day.dayLabel}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-brand-light">
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-brand-primary" />
                Sudah Memilah
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-brand-light/60 border border-brand-light" />
                Belum
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-brand-textSecondary font-semibold">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-brand-yellow/15 border border-brand-yellow/30" />
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
            <div className="flex items-center justify-between px-6 pb-5 pt-2 sm:pt-5 border-b border-brand-light">
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
                className="p-2 rounded-2xl bg-brand-light hover:bg-brand-primary/10 text-brand-dark transition-all duration-200 cursor-pointer border-0"
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
    </div>
  );
}
