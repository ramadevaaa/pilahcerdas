import React from 'react';
import { Calendar, AlertTriangle, Truck, ShieldAlert, Sparkles } from 'lucide-react';

export function SurgePredictor({ regency = 'Badung' }) {
  // Data simulasi hari raya dan tingkat lonjakan anorganik jalanan
  const holidayModels = [
    {
      name: "Hari Raya Nyepi (Pengerupukan)",
      date: "18 Maret 2026", // Simulasi Nyepi terdekat
      daysRemaining: 7,
      type: "Critical Surge (Street Waste)",
      surgePercent: 85,
      material: "Plastik Kemasan, Botol Minuman, Styrofoam, & Kertas/Kardus Sisa Ogoh-Ogoh",
      alertText: "Malam Pengerupukan (Pawai Ogoh-ogoh) diproyeksikan menyisakan timbunan sampah plastik & kemasan masif di persimpangan jalan protokol desa adat.",
      armadaRecommendation: "KERAHKAN ARMADA EKSTRA SAPU JALAN H-1 (Sore sebelum Nyepi mulai) & H+1 (Ngembak Geni pagi). Ingat: Selama Nyepi, operasional armada mati total (Amati Lelungaan).",
      tonProjection: regency === 'Denpasar' ? 14.5 : regency === 'Badung' ? 8.2 : 4.5
    },
    {
      name: "Hari Raya Galungan & Kuningan",
      date: "15 April 2026",
      daysRemaining: 35,
      type: "Moderate Surge (Temple Areas)",
      surgePercent: 30,
      material: "Plastik Pembungkus, Kaleng Minuman, & Kantong Kresek",
      alertText: "Upacara ke Pura besar (seperti Pura Jagatnatha atau Besakih) memicu lonjakan sampah kemasan plastik dari krama yang tangkil/bersembahyang.",
      armadaRecommendation: "Siapkan bak sampah anorganik *portable* tambahan di sekeliling area pura utama dan jadwalkan armada truk penyisir jalan H+1.",
      tonProjection: regency === 'Denpasar' ? 7.2 : regency === 'Badung' ? 5.1 : 2.8
    }
  ];

  return (
    <div className="bg-white border border-brand-light rounded-3xl p-6 shadow-premium flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-brand-light pb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          <h2 className="text-sm md:text-base font-bold text-brand-dark">Prediksi Lonjakan Hari Raya</h2>
        </div>
        <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full border border-brand-orange/5 animate-pulse">
          Sistem Proaktif
        </span>
      </div>

      {/* Main Alert Card (Nyepi H-7) */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {holidayModels.map((holiday, idx) => {
          const isCritical = holiday.surgePercent > 50;
          return (
            <div 
              key={idx}
              className={`border rounded-3xl p-5 ${
                isCritical 
                  ? 'bg-brand-orange/5 border-brand-orange/20' 
                  : 'bg-brand-light/30 border-brand-primary/10'
              }`}
            >
              {/* Badge & Date */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                  isCritical 
                    ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/10' 
                    : 'bg-brand-primary/20 text-brand-primary border-brand-primary/10'
                }`}>
                  {holiday.type}
                </span>
                <span className="text-[10px] text-brand-textSecondary font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  {holiday.date} (H-{holiday.daysRemaining} Hari)
                </span>
              </div>

              {/* Title & Projection */}
              <div className="flex justify-between items-start mb-2 gap-4">
                <h3 className="text-sm font-extrabold text-brand-dark">{holiday.name}</h3>
                <span className="text-base font-black text-brand-orange whitespace-nowrap">+{holiday.surgePercent}%</span>
              </div>

              <p className="text-xs text-brand-textSecondary leading-relaxed">
                {holiday.alertText}
              </p>

              {/* Technical breakdown */}
              <div className="mt-3 p-3 bg-white border border-brand-light rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] text-brand-textSecondary font-semibold">
                  <span>Proyeksi Tambahan Sampah Anorganik/Residu Jalan:</span>
                  <span className="font-extrabold text-brand-dark">+{holiday.tonProjection.toFixed(1)} Ton</span>
                </div>
                <div className="text-[10px] text-brand-textSecondary leading-normal">
                  <span className="font-bold text-brand-dark block">Dominasi Material:</span>
                  {holiday.material}
                </div>
              </div>

              {/* Action Recommendation */}
              <div className={`mt-3.5 p-3 rounded-2xl border flex items-start gap-2.5 text-[11px] ${
                isCritical 
                  ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange' 
                  : 'bg-brand-primary/15 border-brand-primary/20 text-brand-primary'
              }`}>
                <Truck className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <p className="leading-normal font-semibold">
                  <strong className="block text-brand-dark uppercase text-[10px] tracking-wide mb-0.5">Rekomendasi Operasional Armada:</strong>
                  {holiday.armadaRecommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
