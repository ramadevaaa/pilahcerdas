# 🌿 PilahCerdas

> **"Energi baik dimulai dari dapur rumah tangga."**  
> Sebuah Progressive Web App (PWA) premium untuk membantu warga Bali memilah sampah rumah tangga sesuai regulasi **SE Bupati Badung No. 600.1.17.3/3908/SETDA/DLHK (April 2026)** dan memvisualisasikan dampaknya secara nyata terhadap produksi energi bersih di **PSEL Pesanggaran, Denpasar**.

---

## 🧭 Latar Belakang & Masalah Kritis

Awal tahun 2026 menjadi momen krusial bagi Bali dengan **ditutupnya TPA Suwung secara permanen**, memicu krisis pengelolaan sampah sebesar **4.000 ton/hari**. Sebagai solusinya, **PSEL Pesanggaran (Waste-to-Energy)** diaktifkan untuk mengolah sampah menjadi listrik. 

Namun, efisiensi PSEL sangat bergantung pada **kualitas sampah**:
* Sampah **terpilah kering** (anorganik) menghasilkan **4× lebih banyak listrik** dibandingkan sampah basah yang tercampur.
* Warga Bali memiliki niat baik untuk memilah, namun seringkali kehilangan motivasi karena **tidak melihat dampak konkret** dari tindakan mereka.

**PilahCerdas** hadir menjembatani kesenjangan ini dengan mengubah data pemilahan sampah harian menjadi visualisasi energi listrik yang riil, intuitif, dan memotivasi warga untuk terus konsisten memilah.

---

## ✨ Fitur Utama (MVP)

Aplikasi dirancang dengan antarmuka yang **simpel, bersih, dan premium** tanpa emoji kekanak-kanakan di dalam UI utama—menggunakan ikon linear berkualitas tinggi serta palet warna alam yang menenangkan.

1. **📝 Catat Pilah Harian**
   * Antarmuka pencatatan *3-step wizard* yang sangat ramah lansia (<30 detik).
   * Input kategori (Organik, Anorganik, Residu) dan berat sampah dalam gram dengan deteksi keyboard angka otomatis.
   * Kalkulasi dampak langsung berupa potensi energi (kWh), emisi gas rumah kaca terhindar (kg CO₂e), serta analogi manusiawi (misal: *“Setara menyalakan 5 jam lampu LED 8W”*).

2. **⚡ Simulator Energi**
   * Panel visual interaktif berdampingan: **Sampah Campur vs Sampah Terpilah**.
   * Slider komposisi sampah (%) dengan kalkulasi real-time.
   * Grafik batang modern untuk membuktikan secara visual bahwa memilah sampah meningkatkan efisiensi energi PSEL hingga 400%.

3. **🌍 Dashboard Komunitas**
   * Agregasi data kontribusi real-time dari seluruh warga pengguna PilahCerdas.
   * Angka *counter* dinamis yang menunjukkan total kg sampah terpilah, total potensi listrik (kWh), dan total emisi karbon terhindar.

4. **🗺️ Alur Sampahku**
   * Infografik interaktif yang memetakan perjalanan sampah dari tempat sampah rumah tangga, TPS3R (contoh: Jimbaran Lestari), unit pemrosesan RDF, hingga menjadi listrik di PSEL Pesanggaran untuk menerangi Bali.

---

## ⚙️ Tech Stack & Arsitektur

Didesain untuk keandalan maksimal tanpa biaya operasional (*Zero-Cost Deployment*):

* **Frontend**: React.js (Vite) + Tailwind CSS
* **Database**: Supabase (PostgreSQL + Realtime untuk data komunitas)
* **PWA**: `vite-plugin-pwa` (bisa diinstal di HP langsung dari browser, mendukung pencatatan offline)
* **Grafik**: Recharts (ringan, responsif, dan elegan)
* **Hosting**: Vercel (CI/CD otomatis)

---

## 🔢 Formula Kalkulasi Ilmiah

Semua perhitungan diimplementasikan secara akurat pada `src/lib/calculator.js` merujuk pada standar industri dan sains:

### 1. Lower Heating Value (LHV)
Menggunakan formula *Tchobanoglous & Kreith (2002)* untuk menentukan nilai kalor sampah berdasarkan kadar air (*moisture fraction*, $M$):
$$\text{LHV} = \text{LHV}_{\text{dry}} \times (1 - M) - 2.44 \times M$$
* *Organik basah*: $M \approx 75\%$, $\text{LHV}_{\text{dry}} \approx 4\text{ MJ/kg}$ (tidak layak bakar jika basah).
* *Anorganik kering*: $M \approx 10\%$, $\text{LHV}_{\text{dry}} \approx 15\text{--}18\text{ MJ/kg}$.

### 2. Potensi Listrik PSEL (kWh)
Dengan efisiensi termal PSEL $\eta = 22\%$ (incinerator Asia Tenggara) dan konversi $1\text{ MJ} = 0.2778\text{ kWh}$:
$$\text{Potensi Listrik (kWh)} = \text{LHV (MJ/kg)} \times \text{Berat (kg)} \times 0.2778 \times 0.22$$

### 3. Estimasi CO₂e Terhindar
Merujuk metodologi *IPCC 2006 Waste Sector*, pengalihan sampah organik dari landfill mencegah terbentuknya gas metana ($\text{CH}_4$). Di mana $1\text{ ton}$ sampah organik mencegah $\approx 45\text{ kg CH}_4$. Dengan GWP $\text{CH}_4 = 28$ (IPCC AR6):
$$\text{CO}_2\text{e Saved (kg)} = \left(\frac{\text{Berat Organik (kg)}}{1000}\right) \times 45 \times 28$$

---

## 📁 Struktur Folder Proyek

```
pilahcerdas/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # Ikon aplikasi beresolusi tinggi
├── src/
│   ├── components/
│   │   ├── ui/                # Komponen atom premium (Button, Card, Badge)
│   │   ├── layout/            # Navigation, Sidebar, BottomNav melayang
│   │   └── features/          # Komponen spesifik per fitur
│   ├── pages/
│   │   ├── Home.jsx           # Dashboard utama
│   │   ├── CatatPilah.jsx     # Form input 3-langkah
│   │   ├── Simulator.jsx      # Simulator perbandingan interaktif
│   │   ├── Komunitas.jsx      # Statistik komunitas real-time
│   │   ├── AlurSampah.jsx     # Infografik peta alur
│   │   └── Onboarding.jsx     # Splash screen onboarding (sekali muncul)
│   ├── hooks/
│   │   ├── useLog.js          # CRUD database log sampah
│   │   ├── useCommunity.js    # Sinkronisasi real-time Supabase
│   │   └── useCalculator.js   # Perhitungan LHV, kWh, & emisi
│   ├── lib/
│   │   ├── supabase.js        # Inisialisasi Supabase client
│   │   ├── calculator.js      # Logika perhitungan formula sains
│   │   └── constants.js       # Konstanta warna, kategori, dan batas input
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/            # Migrasi database PostgreSQL
│   └── functions/             # Edge Functions untuk agregasi aman
├── CLAUDE.md                  # Konteks proyek untuk asisten AI
├── README.md                  # Dokumentasi proyek (file ini)
└── vite.config.js
```

---

## 🚀 Memulai Pengembangan Lokal

### Prasyarat
* Node.js versi 18 atau lebih tinggi
* npm atau yarn

### Langkah Instalasi
1. Clone repositori ini:
   ```bash
   git clone https://github.com/ramadevaaa/PilahCerdas.git
   cd PilahCerdas
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:5173` di browser Anda.

---

## 🎓 Tim Pengembang & Apresiasi
Proyek ini dikembangkan dalam rangka mendukung keberhasilan program kelestarian lingkungan di Bali.
* **Universitas Udayana**
* **Beasiswa Sobat Bumi — Pertamina Foundation 2026**

*“Mari ubah sampah menjadi cahaya, satu pilahan untuk masa depan Bali yang bersih.”* 🌿
