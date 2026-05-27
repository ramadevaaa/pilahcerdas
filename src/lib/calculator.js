import { CALCULATOR_CONFIG } from './constants';

/**
 * Menghitung Lower Heating Value (LHV) dalam MJ/kg
 * Formula: LHV = LHV_dry * (1 - M) - 2.44 * M
 * @param {number} lhvDry - Kalor kering (MJ/kg)
 * @param {number} moistureFraction - Fraksi kadar air (0 - 1)
 */
export function calculateLHV(lhvDry, moistureFraction) {
  return lhvDry * (1 - moistureFraction) - 2.44 * moistureFraction;
}

/**
 * Mengonversi nilai kalor (LHV) ke potensi energi listrik PSEL (kWh)
 * Formula: Potensi Listrik (kWh) = LHV * Berat * 0.2778 * η (eta PSEL = 22%)
 * @param {number} lhvMJperKg - Nilai kalor (MJ/kg)
 * @param {number} weightKg - Berat sampah (kg)
 */
export function lhvToKwh(lhvMJperKg, weightKg) {
  // Hanya jika LHV > 0, jika LHV negatif (sampah terlalu basah), potensi listrik adalah 0
  if (lhvMJperKg <= 0) return 0;
  return lhvMJperKg * weightKg * CALCULATOR_CONFIG.MJ_TO_KWH * CALCULATOR_CONFIG.ETA_PSEL;
}

/**
 * Mengestimasi CO2e Terhindar (Metodologi IPCC 2006 Waste Sector)
 * Khusus sampah organik yang dialihkan dari landfill.
 * @param {number} organicWeightKg - Berat sampah organik (kg)
 */
export function estimateCO2eSaved(organicWeightKg) {
  const tons = organicWeightKg / 1000;
  return tons * CALCULATOR_CONFIG.KG_CH4_PER_TON_ORGANIC * CALCULATOR_CONFIG.GWP_CH4;
}

/**
 * Mengubah kWh ke analogi jam menyala lampu LED 8W
 * @param {number} kwh - Potensi energi listrik
 */
export function kwhToAnalogy(kwh) {
  const lampLED8W = kwh / 0.008; // jam menyala lampu LED 8W
  if (kwh <= 0) return '0 jam lampu LED menyala';
  return `≈ ${lampLED8W.toFixed(0)} jam lampu LED 8W menyala`;
}

/**
 * Melakukan kalkulasi lengkap dari input berat sampah (dalam gram)
 * @param {string} kategori - 'organik' | 'anorganik' | 'residu'
 * @param {number} beratGram - Berat sampah (gram)
 */
export function getLogCalculations(kategori, beratGram) {
  const weightKg = beratGram / 1000;
  const config = CALCULATOR_CONFIG[kategori];
  
  // Guard: jika kategori tidak dikenal (typo, kategori baru, data korup dari DB),
  // kembalikan nilai nol daripada crash dengan TypeError
  if (!config) {
    console.warn(`[calculator] Kategori tidak dikenal: '${kategori}'. Menggunakan nilai nol.`);
    return { lhv: 0, kwh: 0, co2e: 0, analogi: null };
  }
  
  // 1. Hitung LHV
  const lhv = calculateLHV(config.lhvDry, config.moisture);
  
  // 2. Hitung Listrik kWh
  // Untuk organik basah, LHV negatif (-0.83 MJ/kg), jadi tidak layak bakar (0 kWh).
  const kwh = lhvToKwh(lhv, weightKg);
  
  // 3. Hitung CO2e saved (Khusus organik yang dialihkan dari landfill)
  const co2e = kategori === 'organik' ? estimateCO2eSaved(weightKg) : 0;
  
  // 4. Analogi jam lampu
  const analogi = kwh > 0 ? kwhToAnalogy(kwh) : null;

  return {
    lhv: parseFloat(lhv.toFixed(2)),
    kwh: parseFloat(kwh.toFixed(3)),
    co2e: parseFloat(co2e.toFixed(3)),
    analogi
  };
}
