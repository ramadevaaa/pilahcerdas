# ♻️ PilahCerdas — Energi Baik Dimulai dari Dapur Rumah Tangga

[![React](https://img.shields.io/badge/React-19.0-blue.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **PilahCerdas** adalah platform *civic-tech* berbasis **Progressive Web App (PWA)** yang dirancang untuk membantu warga Bali memilah sampah rumah tangga sesuai dengan **Surat Edaran Bupati Badung No. 600.1.17.3/3908/SETDA/DLHK (April 2026)**. Aplikasi ini secara interaktif memvisualisasikan dampak nyata dari pemilahan sampah harian warga terhadap potensi produksi energi listrik di **PSEL (Pengolahan Sampah menjadi Energi Listrik) Pesanggaran, Denpasar**.

---

## 🧭 Latar Belakang & Urgensi

Awal tahun 2026 menjadi titik kritis bagi Provinsi Bali dengan **ditutupnya TPA Suwung secara permanen**, menyisakan krisis pengelolaan sampah sebesar **4.000 ton per hari**. Sebagai solusi, pemerintah mengoperasikan PSEL Pesanggaran (kapasitas ~900 ton/hari). 

Namun, efisiensi PSEL sangat bergantung pada kualitas sampah yang masuk (*feedstock*):
* ❌ **Sampah campur (organik basah + anorganik)** memiliki tingkat kadar air tinggi, menurunkan nilai bakar, serta mempersulit pembakaran.
* ✅ **Sampah anorganik kering terpilah** memiliki nilai kalor tinggi, menghasilkan **listrik hingga 4 kali lebih banyak** dibanding sampah campur.

**PilahCerdas** hadir untuk menjembatani celah motivasi warga. Melalui pendekatan data personal dan komunitas, kami mengubah sampah harian yang terpilah menjadi visualisasi dampak nyata seperti produksi kWh listrik, emisi karbon yang berhasil dihindari, dan analogi sederhana yang mudah dipahami warga awam (misalnya, jam menyala lampu LED).

---

## 🏗️ Arsitektur Sistem & Fitur Utama

Proyek ini terdiri dari dua sistem aplikasi utama yang terintegrasi melalui database **Supabase**:

### 1. 📱 Aplikasi Warga (PWA) — *Direktori Root*
Aplikasi berbasis mobile-first PWA yang dapat diinstal langsung dari browser tanpa melalui App Store/Play Store.
* **Tamu (Guest)**: Dapat mengakses fitur edukasi statis seperti **Simulator Energi**, **Alur Sampahku**, dan **Klinik Organik Mandiri**.
* **Warga Terdaftar**: Registrasi cepat menggunakan Nomor HP dan data alamat berjenjang (**Kabupaten → Kecamatan → Desa → Banjar**).
* **Catat Pilah Harian**: Input berat sampah harian berdasarkan 3 kategori (Organik, Anorganik, Residu) dengan validasi aman (1 gram - 50 kg per input).
* **Riwayat & Streak Kalender**: Kalender interaktif untuk mencatat konsistensi pemilahan warga (*streak* harian).
* **Personal Carbon Calculator**: Perhitungan emisi karbon $\text{CO}_2\text{e}$ terhindar yang terakumulasi secara historis.

### 2. 📊 Dashboard Institusi (Admin TPS3R & DLH) — `PilahCerdasDashboard/`
Portal khusus untuk pengelola TPS3R (Tempat Pengolahan Sampah Terpadu) dan Dinas Lingkungan Hidup (DLH) untuk memonitor data pemilahan di wilayahnya.
* **Peta Choropleth Bali**: Visualisasi distribusi partisipasi pemilahan sampah per kabupaten/kecamatan secara real-time.
* **Volume Sampah Agregat**: Grafik historis (harian/mingguan/bulanan) untuk memantau tren pengumpulan sampah.
* **Kualitas Feedstock Gauge**: Pengukur persentase sampah yang layak masuk proses RDF (*Refuse Derived Fuel*) / insinerator PSEL.
* **Hindu Holiday Waste Surge Predictor**: Prediksi lonjakan volume sampah berbasis kalender hari raya Hindu di Bali (Galungan, Kuningan, Nyepi, Pagerwesi, dll.) untuk membantu kesiapan armada.
* **Alert Anomali**: Sistem peringatan otomatis jika partisipasi wilayah tertentu menurun drastis.
* **Ekspor Laporan Resmi**: Fitur ekspor laporan agregat dalam format CSV/PDF siap saji untuk pelaporan ke Pemprov Bali.

---

## 📁 Struktur Repositori

```
PilahCerdas/
├── public/                       # PWA assets & icons
│   ├── manifest.json             # Manifest untuk install PWA
│   └── icons/                    # App icons berbagai resolusi
├── src/                          # SOURCE CODE APLIKASI WARGA (PWA)
│   ├── components/
│   │   ├── ui/                   # Komponen Atom (Button, Card, Modal, dll)
│   │   ├── layout/               # Navigasi bottom, Sidebar
│   │   └── features/             # Komponen kompleks (BaliMap.jsx, EdisonBulb.jsx)
│   ├── pages/
│   │   ├── Home.jsx              # Dashboard personal warga & tamu
│   │   ├── CatatPilah.jsx        # Formulir input sampah 3 langkah
│   │   ├── Simulator.jsx         # Simulator perbandingan LHV & kWh
│   │   ├── Komunitas.jsx         # Statistik kontribusi komunitas Bali
│   │   ├── AlurSampah.jsx        # Infografik alur sampah interaktif
│   │   ├── Login.jsx             # Autentikasi Warga
│   │   ├── Register.jsx          # Register dengan dropdown Banjar berjenjang
│   │   └── Onboarding.jsx        # Panduan geser saat pertama kali install
│   ├── hooks/                    # Custom React hooks (useLog, useCommunity, useCalculator)
│   ├── lib/                      # Utilitas (supabase.js, calculator.js, constants.js)
│   └── App.jsx                   # Entry point Router & Auth State
│
├── PilahCerdasDashboard/         # SOURCE CODE PORTAL ADMIN & DLH
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChoroplethMap.jsx # Peta panas kontribusi Bali
│   │   │   ├── FeedstockGauge.jsx# Gauge kualitas feedstock PSEL
│   │   │   ├── SurgePredictor.jsx# AI/Rule-based predictor hari raya
│   │   │   ├── ReportGenerator.jsx# Ekspor laporan PDF/CSV
│   │   │   └── ProtectedRoute.jsx# Proteksi Admin Auth
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main Admin Control Panel
│   │   │   └── Login.jsx         # Portal masuk Admin
│   │   └── index.css             # Style khusus dashboard admin
│   └── package.json
│
├── supabase/                     # Konfigurasi Supabase
│   └── migrations/               # Skema tabel, views, RLS Policies SQL
├── CLAUDE.md                     # Panduan operasional asisten AI
├── PRD_BARU                      # Spesifikasi kebutuhan sistem V2
└── package.json                  # Dependencies aplikasi warga
```

---

## 🔢 Formula & Kalkulasi Ilmiah (Kritis)

Kalkulasi dalam aplikasi dihitung di sisi client (dan diverifikasi di database) menggunakan standar ilmiah yang presisi di `src/lib/calculator.js`:

### 1. Lower Heating Value (LHV) Sampah
Menentukan kandungan energi panas dalam sampah berdasarkan kadar air (*Moisture Fraction* - $M$).
$$LHV = LHV_{kering} \times (1 - M) - 2.44 \times M$$

* **Nilai Konstanta Kadar Air ($M$):**
  * Sampah Organik Basah (Sisa Makanan): $M \approx 75\%$ ($LHV_{kering} \approx 4\text{ MJ/kg}$)
  * Sampah Anorganik Kering (Plastik/Kertas): $M \approx 10\%$ ($LHV_{kering} \approx 16\text{ MJ/kg}$)
  * Sampah Residu Campuran: $M \approx 40\%$ ($LHV_{kering} \approx 8\text{ MJ/kg}$)

### 2. Potensi Energi Listrik PSEL (kWh)
Konversi dari nilai kalor sampah ($LHV$ dalam $\text{MJ/kg}$) menjadi energi listrik ($\text{kWh}$) dengan asumsi efisiensi termal PSEL $\eta = 22\%$ (tipikal insinerator perkotaan Asia Tenggara).
$$\text{kWh} = LHV \times \text{Berat (kg)} \times 0.2778 \times \eta_{PSEL}$$
*(Catatan: $1\text{ MJ} \approx 0.2778\text{ kWh}$)*

### 3. Estimasi Penyelamatan Emisi Karbon ($\text{CO}_2\text{e}$)
Mengalihkan sampah organik dari TPA/Landfill akan menghindari pembusukan anaerobik yang menghasilkan gas Metana ($\text{CH}_4$). Berdasarkan Metodologi **IPCC 2006 Waste Sector**:
* $1\text{ ton}$ sampah organik dialihkan = menghindari **$45\text{ kg } \text{CH}_4$**
* Global Warming Potential (GWP) Metana = **$28$** (IPCC AR6, 2021)
$$\text{CO}_2\text{e Terhindar (kg)} = \text{Tons Organik} \times 45 \times 28$$

### 4. Analogi Manusiawi
Untuk memudahkan pemahaman warga, energi listrik ($\text{kWh}$) dikonversi ke analogi konsumsi perangkat rumah tangga:
$$\text{Jam Menyala Lampu LED 8W} = \frac{\text{kWh}}{0.008\text{ kW}}$$

---

## 🗃️ Skema Database Supabase

Jalankan script SQL berikut di SQL Editor Supabase Anda untuk mempersiapkan tabel, relasi, views, dan Row Level Security (RLS) policies:

```sql
-- 1. Tabel Profil Pengguna (Warga & Admin)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  nomor_telepon TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'warga' CHECK (role IN ('warga', 'admin', 'tps3r')),
  kabupaten TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  desa TEXT NOT NULL,
  banjar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Log Pemilahan Sampah
CREATE TABLE pilah_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- tracking untuk guest/anonymous
  kategori TEXT NOT NULL CHECK (kategori IN ('organik', 'anorganik', 'residu')),
  berat_gram INTEGER NOT NULL CHECK (berat_gram > 0 AND berat_gram <= 50000),
  lhv_mj FLOAT NOT NULL,
  kwh_potensi FLOAT NOT NULL,
  co2e_saved FLOAT NOT NULL,
  kabupaten TEXT, -- Denormalisasi wilayah untuk visualisasi dashboard regional
  kecamatan TEXT,
  desa TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. View Agregasi Komunitas (Real-time dashboard)
CREATE VIEW community_stats AS
SELECT
  COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS total_kontributor,
  SUM(berat_gram) / 1000.0 AS total_kg,
  SUM(kwh_potensi) AS total_kwh,
  SUM(co2e_saved) AS total_co2e,
  COUNT(*) AS total_logs
FROM pilah_logs;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilah_logs ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan Keamanan (RLS Policies)
CREATE POLICY "Profil dapat dibaca oleh pemilik" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profil dapat diedit oleh pemilik" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Warga hanya bisa melihat log milik sendiri" ON pilah_logs
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Warga bisa menyisipkan log miliknya" ON pilah_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Admin dapat melihat semua log regional" ON pilah_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'tps3r')
    )
  );
```

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
* [Node.js](https://nodejs.org/) (Versi 18 ke atas)
* npm (biasanya terbundel dengan Node.js)
* Proyek [Supabase](https://supabase.com/) aktif

---

### Langkah 1: Kloning Repositori & Setup Environment
1. Buka terminal dan kloning repositori ini:
   ```bash
   git clone https://github.com/username/PilahCerdas.git
   cd PilahCerdas
   ```

2. Buat file `.env` di dalam direktori **root** berdasarkan `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Isi dengan URL dan Kunci Anonim dari proyek Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://id-proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Buat juga file `.env` di dalam direktori **`PilahCerdasDashboard/`** dengan struktur yang sama untuk portal admin.

---

### Langkah 2: Jalankan Aplikasi Warga (PWA)
1. Di direktori root proyek, pasang seluruh dependency:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di [http://localhost:5173](http://localhost:5173) untuk melihat aplikasi warga.

---

### Langkah 3: Jalankan Dashboard Institusi (Admin)
1. Pindah ke direktori dashboard:
   ```bash
   cd PilahCerdasDashboard
   ```
2. Pasang dependency khusus dashboard:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan portal admin:
   ```bash
   npm run dev
   ```
4. Buka browser di [http://localhost:5174](http://localhost:5174) (atau port yang tertera pada terminal Anda) untuk melihat dashboard admin.

---

## 🎨 Panduan Desain & Kode Warna (Design System)

PilahCerdas menggunakan palet warna bertema ekologi Bali yang ramah pengguna. Sangat direkomendasikan untuk mempertahankan konsistensi warna berikut:

### CSS Variables (Ada di `src/index.css`)
```css
:root {
  --green-primary:  #2d7a4f;  /* Warna tombol CTA, ikon aktif, navigasi */
  --green-dark:     #1a4a30;  /* Judul utama, teks heading tebal */
  --green-light:    #e8f5ee;  /* Latar belakang kartu, panel highlight */
  --green-bg:       #f5faf7;  /* Warna latar belakang halaman */
  --yellow-accent:  #f5a623;  /* Notifikasi, badge, streak aktif */
  --orange-alert:   #e05c2a;  /* Indikator dampak tinggi, peringatan anomali */
  --text-primary:   #1a4a30;  /* Warna teks utama */
  --text-secondary: #666666;  /* Deskripsi sekunder */
  --text-muted:     #aaaaaa;  /* Placeholder, teks non-aktif */
}
```

### Warna Kategori Sampah (Wajib Konsisten di Seluruh UI)
* **Organik (Hijau Standar Sampah)**: `#4CAF50` (Light bg: `#E8F5E9`) - *Sisa makanan, dedaunan.*
* **Anorganik (Biru Daur Ulang)**: `#2196F3` (Light bg: `#E3F2FD`) - *Plastik, kertas, kaca, kaleng.*
* **Residu (Abu-abu Pembuangan)**: `#9E9E9E` (Light bg: `#F5F5F5`) - *Masker, popok bayi, styrofoam.*

### 📏 Aturan Tampilan Kritis
1. **Tipografi**: Selalu gunakan font **Nunito (Google Fonts)**. Bentuk font yang membulat merepresentasikan sifat aplikasi yang ramah lingkungan, tidak menakutkan, dan mudah dibaca oleh warga senior.
2. **Uji 5 Detik**: Setiap halaman baru harus lolos uji kesederhanaan. Jika pengguna awam melihat layar tersebut selama 5 detik, mereka harus langsung mengerti aksi utama apa yang harus ditekan.
3. **Bahasa Indonesia Seutuhnya**: Tidak ada istilah teknis atau pesan error komputer di UI. Gunakan pesan yang bersahabat: *“Waduh, koneksinya putus. Coba lagi ya 🙏”* daripada *“Error 500: Connection Timeout”*.

---

## 🤝 Kontribusi

Kami sangat menyambut baik kontribusi dari mahasiswa, aktivis lingkungan, dan developer di seluruh penjuru Bali!
1. Fork repositori ini.
2. Buat branch fitur baru (`git checkout -b fitur/FiturKerenAnda`).
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren yang bermanfaat'`).
4. Push ke branch Anda (`git push origin fitur/FiturKerenAnda`).
5. Buat Pull Request baru ke repositori utama.

---

## 🏆 Penghargaan & Kemitraan

Aplikasi ini dikembangkan dan didukung penuh oleh:
* **Himpunan Mahasiswa Teknologi Informasi (HMTI), Universitas Udayana**
* **Beasiswa Sobat Bumi — Pertamina Foundation 2026**
* Berkolaborasi dengan **TPS3R Jimbaran Lestari** dalam pengujian data dan kesesuaian armada pengangkutan.

> *"Energi baik dimulai dari dapur rumah tangga. Mari bersama pilah sampah kita demi Bali yang bersih dan hijau."* 🌴💚
