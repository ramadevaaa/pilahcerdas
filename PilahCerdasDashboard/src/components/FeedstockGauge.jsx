import React, { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Zap, Flame, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function FeedstockGauge({ logs = [] }) {
  // Menghitung skor kualitas feedstock berdasarkan log anorganik
  const feedstockStats = useMemo(() => {
    let totalAnorganicWeight = 0;
    let combustibleWeight = 0; // Plastik + Kertas (High LHV)
    
    logs.forEach(log => {
      if (log.kategori === 'anorganik') {
        const berat = log.berat_gram || 0;
        totalAnorganicWeight += berat;

        const sub = log.subkategori || [];
        if (sub.length === 0) {
          // Asumsikan rata-rata anorganik umum 70% layak
          combustibleWeight += berat * 0.7;
          return;
        }

        // Hitung share subkategori
        const share = berat / sub.length;
        sub.forEach(s => {
          if (s.includes('plastik') || s.includes('kertas')) {
            combustibleWeight += share;
          }
        });
      }
    });

    const score = totalAnorganicWeight > 0 
      ? Math.round((combustibleWeight / totalAnorganicWeight) * 100) 
      : 75; // Default baseline jika data kosong

    return {
      score,
      totalAnorganicWeight: totalAnorganicWeight / 1000 // kg
    };
  }, [logs]);

  const score = feedstockStats.score;

  // Tentukan status kelayakan
  let statusText = 'SANGAT LAYAK (Premium Feedstock)';
  let statusColor = 'text-brand-primary bg-brand-light border-brand-primary/20';
  let gaugeColor = '#2d7a4f';
  let advice = 'Saran Operator: Kualitas sampah anorganik kering sangat prima. Siap dipasok langsung ke insinerator PSEL Pesanggaran / RDF Plant untuk konversi listrik maksimal.';
  let Icon = ShieldCheck;

  if (score < 50) {
    statusText = 'TIDAK LAYAK / PRE-DRYING & SEPARATE';
    statusColor = 'text-brand-orange bg-brand-orange/10 border-brand-orange/20';
    gaugeColor = '#e05c2a';
    advice = 'Saran Operator: Terlalu banyak kontaminan non-combustible (kaca/logam) atau sampah terlalu lembap. Wajib dilakukan pengeringan awal (pre-drying) dan penyaringan mekanis ketat agar tidak mematikan tungku insinerator!';
    Icon = ShieldAlert;
  } else if (score < 75) {
    statusText = 'LAYAK DENGAN PENYARINGAN (Contamination Alert)';
    statusColor = 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20';
    gaugeColor = '#f5a623';
    advice = 'Saran Operator: Ditemukan kontaminasi minor kaca/kaleng. Diperlukan pemilahan manual di belt conveyor TPS3R sebelum diumpankan ke RDF untuk disaring dari logam/kaca.';
    Icon = ShieldAlert;
  }

  // Data untuk Pie Chart (Gauge Half-Donut)
  const chartData = [
    { value: score },
    { value: 100 - score }
  ];

  return (
    <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-brand-light pb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-yellow stroke-[2.5px]" />
          <h2 className="text-sm md:text-base font-bold text-brand-dark">Kualitas Feedstock RDF / PSEL</h2>
        </div>
        <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider">
          Kalor & Bakar Ready
        </span>
      </div>

      {/* Gauge Area */}
      <div className="flex flex-col items-center justify-center py-4 flex-1">
        <div className="relative w-44 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                startAngle={180}
                endAngle={0}
                cx="50%"
                cy="100%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={gaugeColor} />
                <Cell fill="#e8f5ee" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end">
            <span className="text-3xl font-extrabold text-brand-dark font-display leading-none">{score}%</span>
            <span className="text-[10px] text-brand-textSecondary font-bold mt-1 uppercase tracking-widest">Suitability</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`mt-4 px-4 py-2 border rounded-2xl flex items-center gap-2 text-xs font-bold ${statusColor} text-center`}>
          <Icon className="w-4 h-4 shrink-0 stroke-[2.5px]" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Info Stats & Advice */}
      <div className="mt-4 pt-4 border-t border-brand-light space-y-4 shrink-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-light/30 p-3 rounded-2xl border border-brand-light/50 text-center">
            <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block">Bahan Bakar Anorganik</span>
            <span className="text-sm font-extrabold text-brand-dark block mt-0.5">{feedstockStats.totalAnorganicWeight.toFixed(2)} Ton</span>
          </div>
          <div className="bg-[#FFFDF9] p-3 rounded-2xl border border-brand-yellow/20 text-center">
            <span className="text-[9px] text-brand-textSecondary font-bold uppercase tracking-wider block">Kategori Terbakar</span>
            <span className="text-sm font-extrabold text-brand-yellow block mt-0.5">{score}% Plastik/Kertas</span>
          </div>
        </div>

        <div className="bg-emerald-50/20 border border-brand-primary/10 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Info className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-textSecondary leading-normal">
            {advice}
          </p>
        </div>
      </div>
    </div>
  );
}
