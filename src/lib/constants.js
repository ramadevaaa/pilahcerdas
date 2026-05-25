export const KATEGORI_COLORS = {
  organik: {
    bg: '#4CAF50',
    light: '#E8F5E9',
    label: 'Organik',
    text: '#1B5E20',
    desc: 'Sisa makanan, daun, kulit buah, sisa sayuran'
  },
  anorganik: {
    bg: '#2196F3',
    light: '#E3F2FD',
    label: 'Anorganik',
    text: '#0D47A1',
    desc: 'Plastik, kertas, botol minuman, kardus, kaleng, kaca'
  },
  residu: {
    bg: '#9E9E9E',
    light: '#F5F5F5',
    label: 'Residu',
    text: '#37474F',
    desc: 'Popok, pembalut, masker, tissue basah, styrofoam'
  }
};

export const BALI_REGENCY_LIST = [
  'Badung',
  'Denpasar',
  'Gianyar',
  'Tabanan',
  'Klungkung',
  'Bangli',
  'Karangasem',
  'Buleleng',
  'Jembrana'
];

export const CALCULATOR_CONFIG = {
  ETA_PSEL: 0.22,               // Efisiensi konversi termal PSEL η = 22%
  KG_CH4_PER_TON_ORGANIC: 45,   // Pengalihan organik mencegah 45kg CH4 per ton
  GWP_CH4: 28,                  // Global Warming Potential CH4 (IPCC AR6)
  MJ_TO_KWH: 0.2778,            // 1 MJ = 0.2778 kWh
  
  // Kadar air (Moisture Fraction M) & LHV dry untuk perhitungan LHV
  organik: {
    moisture: 0.75,             // Organik basah (75% moisture)
    lhvDry: 4.0                 // ~4 MJ/kg
  },
  anorganik: {
    moisture: 0.10,             // Anorganik kering (10% moisture)
    lhvDry: 16.0                // ~16 MJ/kg (kertas/plastik)
  },
  residu: {
    moisture: 0.50,             // Residu campuran (50% moisture)
    lhvDry: 8.0                 // ~8 MJ/kg
  }
};

// Estimasi volume wadah sampah representatif untuk Bali (dalam Gram)
// Ikon di sini bertindak sebagai metadata visual (bukan emoji di UI utama, akan digantikan Lucide di render)
export const VOLUME_ESTIMATES = {
  organik: [
    { id: 'vol_org_1', label: 'Ember Kecil', sublabel: '≈ 500 gram', value: 500, type: 'bucket' },
    { id: 'vol_org_2', label: 'Ember Cat Sedang', sublabel: '≈ 1,5 kg', value: 1500, type: 'bucket-large' },
    { id: 'vol_org_3', label: 'Kantong Kresek Kecil', sublabel: '≈ 250 gram', value: 250, type: 'bag' }
  ],
  anorganik: [
    { id: 'vol_ano_1', label: 'Kantong Kresek Kecil', sublabel: '≈ 100 gram', value: 100, type: 'bag' },
    { id: 'vol_ano_2', label: 'Kantong Kresek Besar', sublabel: '≈ 400 gram', value: 400, type: 'bag-large' },
    { id: 'vol_ano_3', label: 'Kardus Mie Instan', sublabel: '≈ 800 gram', value: 800, type: 'box' }
  ],
  residu: [
    { id: 'vol_res_1', label: 'Kantong Kresek Kecil', sublabel: '≈ 150 gram', value: 150, type: 'bag' },
    { id: 'vol_res_2', label: 'Kantong Kresek Besar', sublabel: '≈ 600 gram', value: 600, type: 'bag-large' }
  ]
};
