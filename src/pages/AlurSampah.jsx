import React, { useState } from 'react';
import {
  Map, Home as HomeIcon, Truck, Factory, Zap, ChevronDown, ChevronUp,
  Recycle, Leaf, Flame, ArrowDown, CheckCircle2
} from 'lucide-react';
import { Card } from '../components/ui/Card';

const WASTE_JOURNEY = [
  {
    id: 'rumah',
    title: 'Dapur Rumah Tangga',
    subtitle: 'Sumber Sampah',
    icon: HomeIcon,
    color: '#2d7a4f',
    bg: '#e8f5ee',
    detail: 'Sampah dipilah menjadi 3 kategori: Organik (sisa makanan, daun), Anorganik (plastik, kertas, botol), dan Residu (popok, pembalut, masker). Pemilahan dilakukan sejak di dapur menggunakan wadah terpisah.',
    tips: [
      'Siapkan 3 wadah berbeda warna di dapur',
      'Organik: wadah hijau, Anorganik: wadah biru, Residu: wadah abu-abu',
      'Keringkan anorganik sebelum dikumpulkan untuk memaksimalkan LHV'
    ]
  },
  {
    id: 'tps3r',
    title: 'TPS3R',
    subtitle: 'Tempat Pengolahan Sampah 3R',
    icon: Recycle,
    color: '#4CAF50',
    bg: '#E8F5E9',
    detail: 'TPS3R (Reduce, Reuse, Recycle) adalah fasilitas di tingkat kelurahan/desa tempat sampah dipilah lebih lanjut. Organik diproses menjadi kompos, anorganik bernilai jual disortir untuk dijual ke pengepul atau disiapkan sebagai RDF.',
    tips: [
      'Organik basah diolah menjadi pupuk kompos dalam 30-60 hari',
      'Anorganik bersih (PET, HDPE) langsung dijual ke bank sampah',
      'Residu dan anorganik kotor dikirim ke tahap selanjutnya'
    ]
  },
  {
    id: 'rdf',
    title: 'Produksi RDF',
    subtitle: 'Refuse Derived Fuel',
    icon: Factory,
    color: '#2196F3',
    bg: '#E3F2FD',
    detail: 'Sampah anorganik yang tidak laku dijual diolah menjadi RDF (Refuse Derived Fuel), yaitu bahan bakar padat dari sampah. Proses meliputi pencacahan, pengeringan, dan pemadatan. RDF memiliki nilai kalor tinggi (LHV ≈14-18 MJ/kg) karena sudah terpisah dari air.',
    tips: [
      'RDF berbentuk pelet atau briket siap bakar',
      'Kadar air RDF \u003C 15% (vs sampah campur 50-60%)',
      'Nilai kalor RDF 3-6x lipat lebih tinggi dari sampah campur'
    ]
  },
  {
    id: 'psel',
    title: 'PSEL Pesanggaran',
    subtitle: 'Pembangkit Listrik Tenaga Sampah',
    icon: Flame,
    color: '#e05c2a',
    bg: '#FFF3E0',
    detail: 'PSEL (Pembangkit Sampah Listrik) Pesanggaran di Bali menggunakan teknologi insinerasi modern untuk membakar RDF/sampah anorganik pada suhu >850°C. Panas digunakan untuk menghasilkan uap air yang menggerakkan turbin generator listrik. Efisiensi konversi termal ≈22%.',
    tips: [
      'Kapasitas PSEL Pesanggaran: hingga 900 ton/hari',
      'Suhu pembakaran >850°C menghancurkan dioksin',
      'Abu sisa pembakaran digunakan sebagai bahan bangunan'
    ]
  },
  {
    id: 'pln',
    title: 'Jaringan PLN Bali',
    subtitle: 'Listrik Bersih ke Rumah Warga',
    icon: Zap,
    color: '#f5a623',
    bg: '#FFF8E1',
    detail: 'Listrik yang dihasilkan PSEL disalurkan ke jaringan PLN Bali, menerangi rumah-rumah warga. Siklus ini menutup lingkaran: sampah yang dipilah warga kembali menjadi energi untuk warga. Setiap 1 kg anorganik kering berpotensi menghasilkan ≈0.87 kWh listrik.',
    tips: [
      '1 kg plastik kering ≈ 10.8 jam lampu LED 8W',
      'Listrik PSEL mengurangi ketergantungan Bali pada BBM impor',
      'Setiap kWh PSEL menggantikan ≈0.7 kg CO₂ dari PLTD'
    ]
  }
];

function JourneyNode({ node, isOpen, onToggle, isLast }) {
  const Icon = node.icon;

  return (
    <div className="relative">
      {/* Connecting Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-brand-light z-0" />
      )}

      <Card
        hoverable
        onClick={onToggle}
        padding="sm"
        className={`relative z-10 transition-all duration-300 ${
          isOpen ? 'ring-1 ring-brand-primary/20' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: node.bg }}
          >
            <Icon className="w-6 h-6" style={{ color: node.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-brand-dark">{node.title}</h3>
            <p className="text-xs text-brand-textSecondary mt-0.5">{node.subtitle}</p>
          </div>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'bg-brand-primary text-white rotate-180' : 'bg-brand-light text-brand-primary'
          }`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Expanded Detail */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-brand-light space-y-3 animate-in">
            <p className="text-sm text-brand-textSecondary leading-relaxed">
              {node.detail}
            </p>

            {node.tips && node.tips.length > 0 && (
              <div className="bg-[#F9FBF9] rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                  Fakta Menarik
                </p>
                {node.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5 stroke-[2.5px]" />
                    <span className="text-xs text-brand-textSecondary leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Arrow Indicator Between Nodes */}
      {!isLast && (
        <div className="flex justify-center py-2 relative z-10">
          <div className="w-6 h-6 bg-brand-light rounded-full flex items-center justify-center">
            <ArrowDown className="w-3.5 h-3.5 text-brand-primary stroke-[2.5px]" />
          </div>
        </div>
      )}
    </div>
  );
}

export function AlurSampah() {
  const [openNode, setOpenNode] = useState('rumah');

  return (
    <div className="px-5 pt-6 pb-36 md:pb-12 max-w-lg lg:max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-5 h-5 text-brand-primary stroke-[2.5px]" />
          <h1 className="text-2xl font-extrabold text-brand-dark font-display">
            Alur Sampah
          </h1>
        </div>
        <p className="text-sm text-brand-textSecondary leading-relaxed">
          Perjalanan sampahmu dari dapur hingga menjadi listrik bersih untuk Bali.
        </p>
      </div>

      {/* Grid Alur Sampah */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side (Spans 1 column on desktop) */}
        <div className="space-y-6">
          {/* Journey Hero Card */}
          <Card variant="dark" className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-primary/30 rounded-2xl flex items-center justify-center">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-brand-yellow/40 rounded-full" />
                <ArrowDown className="w-4 h-4 text-brand-yellow rotate-[-90deg]" />
              </div>
              <div className="w-10 h-10 bg-brand-primary/30 rounded-2xl flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-brand-yellow/40 rounded-full" />
                <ArrowDown className="w-4 h-4 text-brand-yellow rotate-[-90deg]" />
              </div>
              <div className="w-10 h-10 bg-brand-yellow/30 rounded-2xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-yellow" />
              </div>
            </div>
            <p className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">5 Tahap Perjalanan</p>
            <h2 className="text-base font-bold text-white">
              Dapur <span className="text-brand-yellow mx-1">→</span> TPS3R <span className="text-brand-yellow mx-1">→</span> RDF <span className="text-brand-yellow mx-1">→</span> PSEL <span className="text-brand-yellow mx-1">→</span> PLN
            </h2>
            <p className="text-xs text-white/50 mt-2">Tap setiap tahap untuk melihat detail</p>
          </Card>

          {/* Bottom CTA */}
          <Card variant="green" className="text-center">
            <Leaf className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <h3 className="text-sm font-bold text-brand-dark">
              Setiap pilahan dimulai dari dapurmu
            </h3>
            <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
              Dengan memahami alur perjalanan sampah, kamu bisa memastikan sampah yang kamu pilah benar-benar memberikan dampak positif bagi Bali.
            </p>
          </Card>
        </div>

        {/* Right Side (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2">
          {WASTE_JOURNEY.map((node, i) => (
            <JourneyNode
              key={node.id}
              node={node}
              isOpen={openNode === node.id}
              onToggle={() => setOpenNode(openNode === node.id ? '' : node.id)}
              isLast={i === WASTE_JOURNEY.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
