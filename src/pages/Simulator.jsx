import React, { useState, useMemo } from 'react';
import { Sliders, Zap, Flame, TreePine, Info, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { getLogCalculations } from '../lib/calculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Simulator() {
  const [beratKg, setBeratKg] = useState(5); // default 5 kg
  const [rasioAnorganik, setRasioAnorganik] = useState(30); // default 30% anorganik

  const results = useMemo(() => {
    const totalGram = beratKg * 1000;

    // Skenario CAMPUR: semua sampah dicampur, moisture rata-rata tinggi (~55%), LHV rendah
    const campurLHV = 8.0 * (1 - 0.55) - 2.44 * 0.55; // ~2.26 MJ/kg
    const campurKwh = campurLHV > 0
      ? campurLHV * beratKg * 0.2778 * 0.22
      : 0;

    // Skenario TERPILAH: Anorganik murni kering
    const anorganikGram = totalGram * (rasioAnorganik / 100);
    // Dikalibrasi agar saat anorganik = 30% (standar), organik tepat 60% dari total sampah (data KLH 2026)
    const organikGram = totalGram * ((100 - rasioAnorganik) / 100) * 0.857; 
    const residuGram = totalGram * ((100 - rasioAnorganik) / 100) * 0.143; 

    const calcAnorganik = getLogCalculations('anorganik', anorganikGram);
    const calcOrganik = getLogCalculations('organik', organikGram);
    const calcResidu = getLogCalculations('residu', residuGram);

    const terpilahKwh = calcAnorganik.kwh + calcResidu.kwh; // organik tidak layak bakar
    const terpilahCo2e = calcOrganik.co2e;

    // Peningkatan efisiensi
    const peningkatan = campurKwh > 0
      ? (((terpilahKwh - campurKwh) / campurKwh) * 100).toFixed(0)
      : terpilahKwh > 0 ? '∞' : '0';

    return {
      campurKwh,
      terpilahKwh,
      terpilahCo2e,
      peningkatan,
      anorganikGram,
      organikGram,
      residuGram,
      calcAnorganik,
      calcOrganik,
      calcResidu,
    };
  }, [beratKg, rasioAnorganik]);

  const chartData = [
    { name: 'Campur', kwh: parseFloat(results.campurKwh.toFixed(3)), fill: '#e05c2a' },
    { name: 'Terpilah', kwh: parseFloat(results.terpilahKwh.toFixed(3)), fill: '#2d7a4f' },
  ];

  return (
    <div className="px-5 pt-12 pb-36 md:pt-20 md:pb-12 max-w-lg lg:max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          <h1 className="text-2xl font-extrabold text-brand-dark font-display">
            Simulator Dampak
          </h1>
        </div>
        <p className="text-sm text-brand-textSecondary leading-relaxed">
          Bandingkan potensi energi listrik antara sampah campur vs sampah terpilah.
        </p>
      </div>

      {/* Grid Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side (Spans 1 column on desktop) */}
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <div className="space-y-5">
              {/* Berat Total */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">
                    Total Sampah
                  </label>
                  <span className="text-lg font-extrabold text-brand-dark font-display">{beratKg} kg</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={beratKg}
                  onChange={(e) => setBeratKg(Number(e.target.value))}
                  className="w-full h-2 bg-brand-light rounded-full appearance-none cursor-pointer accent-brand-primary"
                />
                <div className="flex justify-between text-[10px] text-brand-textMuted font-semibold mt-1">
                  <span>1 kg</span>
                  <span>50 kg</span>
                </div>
              </div>

              {/* Rasio Anorganik */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">
                    Rasio Anorganik
                  </label>
                  <span className="text-lg font-extrabold text-brand-dark font-display">{rasioAnorganik}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={rasioAnorganik}
                  onChange={(e) => setRasioAnorganik(Number(e.target.value))}
                  className="w-full h-2 bg-brand-light rounded-full appearance-none cursor-pointer accent-sampah-anorganik"
                />
                <div className="flex justify-between text-[10px] text-brand-textMuted font-semibold mt-1">
                  <span>5%</span>
                  <span>80%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Insight Info */}
          <Card variant="flat" padding="sm" className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              <strong className="text-brand-dark">Mengapa bisa berbeda jauh?</strong> Sampah campur memiliki kadar air tinggi (~55%) yang menurunkan nilai kalor (LHV). Saat sampah dipilah, anorganik kering (moisture ~10%) memiliki LHV ≈14.16 MJ/kg, sementara campuran basah hanya ≈2.26 MJ/kg.
            </p>
          </Card>
        </div>

        {/* Right Side (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <h2 className="text-sm font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-yellow stroke-[2.5px]" />
              Perbandingan Proyeksi Potensi Listrik 2027 (kWh)
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#1a4a30' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#aaaaaa' }}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e8f5ee',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    formatter={(val) => [`${val} kWh`, 'Potensi Listrik']}
                  />
                  <Bar dataKey="kwh" radius={[12, 12, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Hasil Insight */}
          <div className="grid grid-cols-2 gap-3">
            <Card variant="green" padding="sm" className="text-center">
              <Flame className="w-5 h-5 text-brand-orange mx-auto mb-1.5" />
              <p className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">Sampah Campur (Proyeksi 2027)</p>
              <p className="text-xl font-extrabold text-brand-orange font-display mt-1">
                {results.campurKwh.toFixed(3)}
              </p>
              <p className="text-[10px] text-brand-textSecondary font-semibold">kWh</p>
            </Card>

            <Card variant="green" padding="sm" className="text-center">
              <Zap className="w-5 h-5 text-brand-primary mx-auto mb-1.5" />
              <p className="text-[10px] text-brand-textSecondary font-bold uppercase tracking-wider">Sampah Terpilah (Proyeksi 2027)</p>
              <p className="text-xl font-extrabold text-brand-primary font-display mt-1">
                {results.terpilahKwh.toFixed(3)}
              </p>
              <p className="text-[10px] text-brand-textSecondary font-semibold">kWh</p>
            </Card>
          </div>

          {/* Peningkatan Card */}
          <Card variant="dark" className="text-center">
            <p className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">
              Peningkatan Efisiensi (Proyeksi 2027)
            </p>
            <p className="text-4xl font-extrabold text-brand-yellow font-display">
              +{results.peningkatan}%
            </p>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              Dengan memilah sampah, potensi listrik dari PSEL Pesanggaran meningkat drastis karena anorganik kering memiliki nilai kalor (LHV) jauh lebih tinggi.
            </p>
          </Card>

          {/* CO2e Bonus */}
          {results.terpilahCo2e > 0 && (
            <Card padding="sm" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sampah-organikLight rounded-2xl flex items-center justify-center shrink-0">
                <TreePine className="w-5 h-5 text-sampah-organik" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-brand-dark">Bonus: Emisi CO₂e Dicegah</p>
                <p className="text-sm text-brand-textSecondary leading-relaxed mt-0.5">
                  Dengan mengkompos {(results.organikGram / 1000).toFixed(1)} kg organik, kamu mencegah{' '}
                  <strong className="text-brand-primary">{results.terpilahCo2e.toFixed(3)} kg CO₂e</strong> dari gas metana landfill.
                </p>
              </div>
            </Card>
          )}

          {/* Skenario Visual Timbal Balik Bali */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
              <TreePine className="w-4 h-4 text-brand-primary stroke-[2.5px]" />
              Dampak Nyata Terhadap Masa Depan Bali
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skenario Buruk */}
              <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-2xl p-4 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange/20 text-brand-orange uppercase">
                  Sampah Dicampur (Buruk)
                </span>
                <ul className="text-xs text-brand-textSecondary space-y-1.5 list-disc pl-4">
                  <li><strong>Kebakaran TPA</strong>: Tumpukan sampah basah & plastik menghasilkan gas metana eksplosif (seperti musibah TPA Suwung).</li>
                  <li><strong>Racun Subak</strong>: Air lindi (*leachate*) merembes mencemari sistem irigasi Subak Bali.</li>
                  <li><strong>Polusi Udara</strong>: Asap pembakaran sampah liar di desa adat merusak pernapasan anak-anak.</li>
                </ul>
              </div>

              {/* Skenario Baik */}
              <div className="bg-brand-light/60 border border-brand-primary/10 rounded-2xl p-4 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/20 text-brand-primary uppercase">
                  Sampah Dipilah (Baik)
                </span>
                <ul className="text-xs text-brand-textSecondary space-y-1.5 list-disc pl-4">
                  <li><strong>Dapur Mandiri</strong>: Organik terolah menjadi kompos subur & Eco-Enzyme harum di pekarangan.</li>
                  <li><strong>Banjar Bercahaya</strong>: Residu bernilai kalori tinggi diproses PSEL menjadi listrik jalan desa.</li>
                  <li><strong>Pariwisata Lestari</strong>: Alam Bali tetap bersih, hijau, dan harum bagi generasi penerus.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
