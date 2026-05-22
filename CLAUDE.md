# PilahCerdas — Project Context for AI Assistant

> Baca file ini sebelum membantu coding apapun di proyek ini.
> Semua keputusan teknis dan desain harus konsisten dengan konteks di bawah.

---

## 🌿 Apa Ini?

**PilahCerdas** adalah Progressive Web App (PWA) yang membantu warga Bali memilah sampah rumah tangga sesuai regulasi **Surat Edaran Bupati Badung No. 600.1.17.3/3908/SETDA/DLHK (April 2026)**, sekaligus memvisualisasikan dampak nyata tindakan mereka terhadap produksi energi **PSEL Pesanggaran, Denpasar**.

**Masalah inti yang diselesaikan:**
Warga punya niat baik memilah sampah, tapi tidak tahu dampak konkretnya. PilahCerdas menjembatani gap ini dengan mengubah data pemilahan harian menjadi visualisasi energi yang nyata dan memotivasi.

**Konteks kritis:**
- TPA Suwung Bali ditutup permanen awal 2026 → krisis 4.000 ton/hari sampah
- PSEL Pesanggaran (Waste-to-Energy) butuh sampah **terpilah** agar efisien — sampah anorganik kering menghasilkan **4× lebih banyak listrik** vs sampah campur organik basah
- Formula: `LHV = LHV_kering × (1 - M) - 2.44 × M` di mana M = moisture fraction

---

## 🏗️ Tech Stack

```
Frontend  : React.js (Vite) + Tailwind CSS
Database  : Supabase (PostgreSQL + Realtime)
Hosting   : Vercel (free tier)
PWA       : vite-plugin-pwa (manifest + service worker)
Charts    : Recharts
Auth      : Supabase Auth (opsional, anonymous session default)
```

**Prinsip arsitektur:**
- Zero-cost deployment — semua free tier
- Client-side kalkulasi untuk Carbon Calculator (tidak perlu server)
- Supabase Edge Functions hanya untuk agregasi komunitas (cegah manipulasi client)
- PWA-first: tidak perlu App Store, bisa install dari browser

---

## 📁 Struktur Folder

```
pilahcerdas/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons berbagai ukuran
├── src/
│   ├── components/
│   │   ├── ui/                # Komponen atom (Button, Card, Tag, Modal)
│   │   ├── layout/            # Navbar, BottomNav, PageWrapper
│   │   └── features/          # Komponen per fitur (lihat bawah)
│   ├── pages/
│   │   ├── Home.jsx           # Dashboard pribadi
│   │   ├── CatatPilah.jsx     # Form input pemilahan harian
│   │   ├── Simulator.jsx      # Simulator energi interaktif
│   │   ├── Komunitas.jsx      # Dashboard komunitas
│   │   └── AlurSampah.jsx     # Infografik alur sampah
│   ├── hooks/
│   │   ├── useLog.js          # CRUD log pemilahan (Supabase)
│   │   ├── useCommunity.js    # Subscribe real-time data komunitas
│   │   └── useCalculator.js   # Formula LHV & CO₂e
│   ├── lib/
│   │   ├── supabase.js        # Supabase client init
│   │   ├── calculator.js      # Semua formula energi & emisi
│   │   └── constants.js       # Konstanta (kategori sampah, warna, dll)
│   ├── store/                 # Zustand atau React Context untuk state global
│   └── App.jsx
├── supabase/
│   ├── migrations/            # SQL schema migrations
│   └── functions/             # Edge functions (agregasi komunitas)
├── CLAUDE.md                  # ← file ini
└── vite.config.js
```

---

## 🔢 Formula Kalkulasi (Kritis — Jangan Ubah Tanpa Diskusi)

Semua formula ada di `src/lib/calculator.js`.

### Lower Heating Value (LHV)
```js
// LHV dalam MJ/kg
// M = moisture fraction (0–1), bukan persentase
// LHV_kering: organik ~3 MJ/kg, anorganik (plastik/kertas) ~15–18 MJ/kg
function calculateLHV(lhvDry, moistureFraction) {
  return lhvDry * (1 - moistureFraction) - 2.44 * moistureFraction;
}
```

### Konversi ke kWh (Potensi PSEL)
```js
// Efisiensi konversi termal PSEL η = 22% (tipikal incinerator Asia Tenggara)
// 1 MJ = 0.2778 kWh
const ETA_PSEL = 0.22;
function lhvToKwh(lhvMJperKg, weightKg) {
  return lhvMJperKg * weightKg * 0.2778 * ETA_PSEL;
}
```

### Estimasi CO₂e Terhindar (Metodologi IPCC 2006 Waste Sector)
```js
// 1 ton sampah organik dialihkan dari landfill → ~45 kg CH₄ dicegah
// GWP CH₄ = 28 (IPCC AR6) → 45 kg CH₄ × 28 = 1.260 kg CO₂e per ton
const KG_CH4_PER_TON_ORGANIC = 45;
const GWP_CH4 = 28;
function estimateCO2eSaved(organicWeightKg) {
  const tons = organicWeightKg / 1000;
  return tons * KG_CH4_PER_TON_ORGANIC * GWP_CH4; // hasil dalam kg CO₂e
}
```

### Analogi Manusiawi (Wajib Ditampilkan ke User)
```js
// Konversi kWh ke analogi yang mudah dipahami
function kwhToAnalogy(kwh) {
  const lampLED8W = kwh / 0.008; // jam menyala lampu LED 8W
  return `≈ ${lampLED8W.toFixed(0)} jam lampu LED 8W menyala`;
}
```

---

## 🗃️ Database Schema (Supabase)

```sql
-- Tabel utama log pemilahan
CREATE TABLE pilah_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id),  -- null jika anonymous
  session_id  TEXT,                             -- untuk anonymous tracking
  kategori    TEXT CHECK (kategori IN ('organik', 'anorganik', 'residu')),
  berat_gram  INTEGER NOT NULL CHECK (berat_gram > 0 AND berat_gram < 50000),
  lhv_mj      FLOAT,   -- hasil kalkulasi LHV
  kwh_potensi FLOAT,   -- kWh potensi PSEL
  co2e_saved  FLOAT,   -- kg CO₂e terhindar
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- View untuk dashboard komunitas (agregasi)
CREATE VIEW community_stats AS
SELECT
  COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS total_kontributor,
  SUM(berat_gram) / 1000.0   AS total_kg,
  SUM(kwh_potensi)            AS total_kwh,
  SUM(co2e_saved)             AS total_co2e,
  COUNT(*)                    AS total_logs
FROM pilah_logs
WHERE created_at > now() - interval '30 days';

-- RLS: user hanya bisa lihat log miliknya sendiri
ALTER TABLE pilah_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_logs" ON pilah_logs
  FOR ALL USING (
    auth.uid() = user_id
    OR session_id = current_setting('app.session_id', true)
  );

-- Community stats bisa dibaca semua orang (public)
CREATE POLICY "public_community_stats" ON pilah_logs
  FOR SELECT USING (true);
```

---

## 🎨 Design System

### Warna (CSS Variables)
```css
:root {
  --green-primary:  #2d7a4f;  /* Tombol CTA, ikon aktif */
  --green-dark:     #1a4a30;  /* Heading, teks judul */
  --green-light:    #e8f5ee;  /* Background kartu */
  --green-bg:       #f5faf7;  /* Background halaman */
  --yellow-accent:  #f5a623;  /* Badge, notifikasi */
  --orange-alert:   #e05c2a;  /* Peringatan, dampak tinggi */
  --text-primary:   #1a4a30;
  --text-secondary: #666666;
  --text-muted:     #aaaaaa;
}
```

### Warna Kategori Sampah (Konsisten di seluruh app — jangan diubah)
```js
export const KATEGORI_COLORS = {
  organik:   { bg: '#4CAF50', light: '#E8F5E9', label: 'Organik'   },
  anorganik: { bg: '#2196F3', light: '#E3F2FD', label: 'Anorganik' },
  residu:    { bg: '#9E9E9E', light: '#F5F5F5', label: 'Residu'    },
};
```

### Font
```
Nunito (Google Fonts) — bulat, ramah, mudah dibaca semua usia
Fallback: 'Segoe UI', sans-serif
```

### Spacing & Radius
```
Border radius kartu : 20–24px
Tombol utama        : min-height 56px, font-size 18px bold, full-width
Padding layar       : 20px kiri-kanan, 24px atas-bawah
Spacing             : kelipatan 8px (8 / 16 / 24 / 32px)
```

---

## 📱 Halaman & Routing

```
/              → Home (Dashboard pribadi)
/catat         → Catat Pilah Harian (form 3 langkah)
/simulator     → Simulator Energi (slider interaktif)
/komunitas     → Dashboard Komunitas (data real-time)
/alur-sampah   → Alur Sampahku (infografik klik-able)
/onboarding    → Onboarding (hanya muncul sekali, first visit)
```

---

## ✅ Aturan Coding (Wajib Diikuti)

### Umum
- Bahasa UI **seluruhnya Bahasa Indonesia** — tidak ada teks Inggris yang terlihat user
- Semua teks error harus manusiawi: `"Waduh, koneksinya putus. Coba lagi ya 🙏"` bukan `"Error 500"`
- Jangan tampilkan istilah teknis mentah (LHV, MJ/kg, WtE) tanpa padanan Bahasa Indonesia di sebelahnya

### Komponen
- Setiap komponen maksimal **1 tanggung jawab**
- Props harus punya default value yang aman
- Gunakan komponen dari `src/components/ui/` — jangan buat inline style ad-hoc
- Ikon **selalu** disertai label teks (`aria-label` juga wajib untuk aksesibilitas)

### Form & Input
- Maksimal **3 field** per halaman/step
- Keyboard angka langsung muncul untuk input berat: `inputMode="numeric"`
- Validasi: berat minimal 1 gram, maksimal 50.000 gram (50 kg) per entri
- Loading state wajib saat submit — tombol disabled + spinner

### Kalkulasi
- **Jangan hitung ulang formula di komponen** — selalu import dari `src/lib/calculator.js`
- Semua nilai kalkulasi harus di-round ke 2 desimal sebelum ditampilkan
- Analogi manusiawi wajib ditampilkan bersama angka teknis

### Supabase
- Gunakan `useLog` hook untuk semua operasi CRUD log — jangan query Supabase langsung dari komponen
- Real-time subscription untuk komunitas ada di `useCommunity` hook
- Handle error Supabase dengan toast notification, bukan console.error saja

### PWA
- Fitur catat pilah harus bisa dipakai **offline** (simpan ke localStorage, sync saat online)
- Service worker jangan cache data komunitas (harus selalu fresh)

---

## 🚫 Yang Dilarang

```
❌ Jangan gunakan localStorage untuk data sensitif pengguna
❌ Jangan tampilkan angka tanpa satuan (tulis "3,2 kWh" bukan "3.2")
❌ Jangan gunakan desimal titik dalam UI — gunakan koma (standar Indonesia)
❌ Jangan hapus data tanpa konfirmasi dialog terlebih dahulu
❌ Jangan buat halaman baru tanpa bottom navigation
❌ Jangan hardcode warna di luar design system (selalu pakai CSS variable)
❌ Jangan ubah formula kalkulasi tanpa mendiskusikannya dulu
❌ Jangan render loading state sebagai halaman kosong — selalu ada skeleton atau spinner
```

---

## 🧪 Cara Test Kalkulasi

Nilai referensi untuk memvalidasi implementasi:

| Skenario | Input | Expected Output |
|---|---|---|
| 100g plastik kering (anorganik) | M=0.10, LHV_dry=16 MJ/kg | LHV ≈ 14.16 MJ/kg, kWh ≈ 0.087 |
| 100g sisa makanan (organik basah) | M=0.75, LHV_dry=4 MJ/kg | LHV ≈ -0.83 MJ/kg (tidak layak bakar) |
| 500g campuran terpilah (anorganik) | M=0.15, LHV_dry=15 MJ/kg | LHV ≈ 12.4 MJ/kg, kWh ≈ 0.38 |
| 1kg organik ke komunitas | 1000g organik | CO₂e saved ≈ 1.26 kg |

---

## 🔗 Referensi Penting

- **SE Bupati Badung**: No. 600.1.17.3/3908/SETDA/DLHK, April 2026
- **PSEL Pesanggaran**: Jl. Raya Pelabuhan Benoa, Denpasar — kapasitas ~900 ton/hari
- **Formula LHV**: Tchobanoglous & Kreith, *Handbook of Solid Waste Management* (2002)
- **CO₂e metodologi**: IPCC 2006 Guidelines, Volume 5: Waste Sector
- **GWP CH₄**: 28 (IPCC Sixth Assessment Report / AR6, 2021)
- **Efisiensi η PSEL**: 22% — tipikal incinerator skala kota Asia Tenggara

---

## 💬 Cara Minta Bantuan AI yang Efektif

Saat meminta bantuan coding di proyek ini, sertakan konteks seperti:

```
"Di PilahCerdas, saya sedang mengerjakan halaman [nama halaman].
Saya ingin [deskripsi fitur].
File yang relevan: [nama file].
Constraint: [batasan desain/teknis yang berlaku]."
```

Contoh yang baik:
> "Di PilahCerdas, saya sedang mengerjakan halaman CatatPilah.jsx.
> Saya ingin tambahkan validasi agar input berat tidak melebihi 50.000 gram.
> File relevan: src/pages/CatatPilah.jsx dan src/lib/calculator.js.
> Constraint: error message harus dalam Bahasa Indonesia yang ramah."

---

*PilahCerdas · Universitas Udayana · Beasiswa Sobat Bumi Pertamina Foundation 2026*
*"Energi baik dimulai dari dapur rumah tangga."*
