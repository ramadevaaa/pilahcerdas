import React, { useState } from 'react';
import { Users, Trash2, Zap, TreePine, TrendingUp, Award, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BaliMap } from '../components/features/BaliMap';

function AnimatedCounter({ value, suffix = '', decimals = 0 }) {
  return (
    <span className="text-2xl font-extrabold text-brand-dark font-display tabular-nums">
      {typeof value === 'number' ? value.toLocaleString('id-ID', { maximumFractionDigits: decimals }) : value}
      {suffix && <span className="text-sm font-semibold ml-1 text-brand-textSecondary">{suffix}</span>}
    </span>
  );
}

export function Komunitas({ stats, regencyStats, loading }) {
  const [activeRange, setActiveRange] = useState('total'); // 'harian' | 'mingguan' | 'bulanan' | 'total'

  const scaleFactor = activeRange === 'harian' ? 0.03 : activeRange === 'mingguan' ? 0.22 : activeRange === 'bulanan' ? 0.85 : 1.0;
  
  const scaledStats = {
    total_kontributor: stats.total_kontributor,
    total_kg: stats.total_kg * scaleFactor,
    total_kwh: stats.total_kwh * scaleFactor,
    total_co2e: stats.total_co2e * scaleFactor,
    total_logs: Math.round((stats.total_logs || 0) * scaleFactor)
  };

  const counters = [
    {
      icon: Users,
      label: 'Kontributor',
      value: scaledStats.total_kontributor,
      suffix: 'orang',
      color: 'text-brand-primary',
      bg: 'bg-brand-light',
    },
    {
      icon: Trash2,
      label: 'Sampah Terpilah',
      value: scaledStats.total_kg,
      suffix: 'kg',
      decimals: 1,
      color: 'text-brand-primary',
      bg: 'bg-brand-light',
    },
    {
      icon: Zap,
      label: 'Potensi Listrik',
      value: scaledStats.total_kwh,
      suffix: 'kWh',
      decimals: 2,
      color: 'text-brand-yellow',
      bg: 'bg-brand-yellow/10',
    },
    {
      icon: TreePine,
      label: 'Emisi CO₂e Dicegah',
      value: scaledStats.total_co2e,
      suffix: 'kg',
      decimals: 2,
      color: 'text-sampah-organik',
      bg: 'bg-sampah-organikLight',
    },
  ];

  // Ranking kabupaten berdasarkan total kg
  const ranking = Object.entries(regencyStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total_kg - a.total_kg);

  return (
    <div className="px-5 pt-12 pb-36 md:pt-20 md:pb-12 max-w-lg lg:max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          <h1 className="text-2xl font-extrabold text-brand-dark font-display">
            Komunitas Bali
          </h1>
        </div>
        <p className="text-sm text-brand-textSecondary leading-relaxed">
          Dampak kolektif seluruh warga Bali yang memilah sampah.
        </p>
      </div>

      {/* Penyaringan Waktu */}
      <div className="flex items-center gap-1 bg-[#F9FBF9] border border-brand-light p-1.5 rounded-2xl animate-fade-slide w-full sm:w-auto">
        {[
          { id: 'harian', label: 'Hari Ini' },
          { id: 'mingguan', label: 'Minggu Ini' },
          { id: 'bulanan', label: 'Bulan Ini' },
          { id: 'total', label: 'Semua Kontribusi' }
        ].map(range => (
          <button
            key={range.id}
            onClick={() => setActiveRange(range.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border-0 shrink-0 ${
              activeRange === range.id
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-transparent text-brand-textSecondary hover:bg-brand-light/30'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Grid Komunitas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Peta Bali Bercahaya (Left column on desktop, second on mobile) */}
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
          <BaliMap regencyStats={regencyStats} loading={loading} />
        </div>

        {/* Info & Peringkat (Right column on desktop, first on mobile) */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Global Counter Cards */}
          <div className="grid grid-cols-2 gap-3">
            {counters.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card key={i} padding="sm" className="flex flex-col">
                  <div className={`w-9 h-9 ${c.bg} rounded-2xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${c.color} stroke-[2.5px]`} />
                  </div>
                  <AnimatedCounter value={c.value} suffix={c.suffix} decimals={c.decimals || 0} />
                  <span className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider mt-1">
                    {c.label}
                  </span>
                </Card>
              );
            })}
          </div>

          {/* Ranking Kabupaten */}
          <div>
            <h2 className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-yellow stroke-[2.5px]" />
              Peringkat Kabupaten
            </h2>
            <div className="space-y-2">
              {ranking.map((reg, i) => {
                const maxKg = ranking[0]?.total_kg || 1;
                const pct = (reg.total_kg / maxKg) * 100;
                return (
                  <Card key={reg.name} padding="sm" className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      i === 0 ? 'bg-brand-yellow text-brand-dark' :
                      i === 1 ? 'bg-brand-light text-brand-primary' :
                      i === 2 ? 'bg-sampah-organikLight text-sampah-organik' :
                      'bg-gray-100 text-brand-textMuted'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-brand-dark truncate">{reg.name}</span>
                        <span className="text-xs font-semibold text-brand-textSecondary shrink-0 ml-2">
                          {reg.total_kg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-brand-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: i === 0 ? '#f5a623' : i < 3 ? '#2d7a4f' : '#9E9E9E'
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Impact Overview Card */}
          <Card variant="dark" className="text-center">
            <TrendingUp className="w-6 h-6 text-brand-yellow mx-auto mb-2" />
            <p className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">Total Entri Log</p>
            <p className="text-3xl font-extrabold text-white font-display">{scaledStats.total_logs?.toLocaleString('id-ID')}</p>
            <p className="text-sm text-white/70 mt-2">
              catatan pemilahan dari seluruh warga Bali
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
