import { useState } from "react";

const NAV = [
  { id: "overview",   icon: "🌿", label: "Gambaran"  },
  { id: "users",      icon: "👥", label: "Pengguna"  },
  { id: "problems",   icon: "⚡", label: "Masalah"   },
  { id: "features",   icon: "✨", label: "Fitur"     },
  { id: "screens",    icon: "📱", label: "Halaman"   },
  { id: "design",     icon: "🎨", label: "Desain"    },
  { id: "rules",      icon: "📏", label: "Aturan"    },
  { id: "roadmap",    icon: "🗓️", label: "Roadmap"   },
  { id: "tech",       icon: "⚙️", label: "Tech"      },
  { id: "risks",      icon: "⚠️", label: "Risiko"    },
  { id: "success",    icon: "🏆", label: "Sukses"    },
];

/* ─── reusable atoms ─────────────────────────────── */
const Tag = ({ color, children }) => (
  <span style={{
    background: color || "#e8f5ee", color: color ? "#fff" : "#2d7a4f",
    borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
    display: "inline-block", letterSpacing: 0.5, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 20, padding: 24,
    boxShadow: "0 2px 16px rgba(45,122,79,0.08)", marginBottom: 16,
    border: "1px solid #e8f5ee", ...style,
  }}>{children}</div>
);

const SectionTitle = ({ emoji, title, sub }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 36, marginBottom: 6 }}>{emoji}</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#1a4a30", lineHeight: 1.2 }}>{title}</div>
    {sub && <div style={{ color: "#6b9e7e", fontSize: 15, marginTop: 4 }}>{sub}</div>}
  </div>
);

const ColorSwatch = ({ hex, name, use }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: hex, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{name}</div>
      <div style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{hex}</div>
      <div style={{ fontSize: 12, color: "#6b9e7e" }}>{use}</div>
    </div>
  </div>
);

const FeaturePill = ({ icon, text, priority }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px",
    background: priority === "WAJIB" ? "#e8f5ee" : "#f9f9f9",
    borderRadius: 14, marginBottom: 10,
    borderLeft: `4px solid ${priority === "WAJIB" ? "#2d7a4f" : "#bbb"}`,
  }}>
    <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{text.title}</div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{text.desc}</div>
    </div>
    <Tag color={priority === "WAJIB" ? "#2d7a4f" : undefined}>{priority}</Tag>
  </div>
);

const ScreenCard = ({ no, name, desc, elements, flow }) => (
  <Card>
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: "#2d7a4f",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0,
      }}>{no}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#1a4a30", marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>{desc}</div>
        {flow && (
          <div style={{ background: "#f0faf4", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#2d7a4f", fontWeight: 600 }}>
            🔄 {flow}
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {elements.map((el, i) => (
            <span key={i} style={{ background: "#f0faf4", color: "#2d7a4f", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>✓ {el}</span>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

const RuleCard = ({ rule, desc, ok }) => (
  <div style={{
    display: "flex", gap: 14, padding: "14px 18px",
    background: "#fff", borderRadius: 14, marginBottom: 10,
    border: "1px solid #e8f5ee", boxShadow: "0 1px 6px rgba(45,122,79,0.06)",
  }}>
    <div style={{ fontSize: 20, flexShrink: 0 }}>{ok ? "✅" : "❌"}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{rule}</div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{desc}</div>
    </div>
  </div>
);

const InfoBox = ({ icon, text, color = "#e8f5ee", textColor = "#1a4a30" }) => (
  <div style={{ background: color, borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
    <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: 13, color: textColor, fontWeight: 600, lineHeight: 1.5 }}>{text}</span>
  </div>
);

/* ─── main component ─────────────────────────────── */
export default function PRD() {
  const [active, setActive] = useState("overview");

  /* ─────────────── OVERVIEW ─────────────── */
  const overview = (
    <div>
      <SectionTitle emoji="🌱" title="PilahCerdas — Gambaran Produk" sub="Apa ini, untuk apa, dan kenapa penting" />

      <div style={{
        background: "linear-gradient(135deg, #2d7a4f 0%, #1a4a30 100%)",
        borderRadius: 24, padding: 28, marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.07 }}>♻️</div>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Visi Produk</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 14 }}>
          "Siapapun bisa memilah sampah dengan benar — cukup dengan satu ketukan."
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.7 }}>
          PilahCerdas adalah Progressive Web App yang membantu warga Bali memilah sampah sesuai regulasi SE Bupati Badung 2026, sekaligus memvisualisasikan dampak nyata tindakan mereka terhadap produksi energi PSEL Pesanggaran.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { icon: "📍", label: "Platform",     val: "Progressive Web App" },
          { icon: "🎯", label: "Target",       val: "Warga & Mahasiswa Bali" },
          { icon: "⚙️", label: "Tech Stack",   val: "React + Supabase + Vercel" },
          { icon: "💰", label: "Biaya Deploy", val: "Gratis — Zero Cost" },
          { icon: "🌐", label: "Bahasa",       val: "Bahasa Indonesia" },
          { icon: "📶", label: "Offline",      val: "Sebagian fitur offline" },
        ].map((item, i) => (
          <div key={i} style={{ background: "#f0faf4", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a4a30", marginTop: 2 }}>{item.val}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>🔑 4 Fitur Inti</div>
        {[
          { icon: "💧", title: "Catat Pilah Harian",   desc: "Input sampah hari ini → lihat dampak energi langsung" },
          { icon: "⚡", title: "Simulator Energi",     desc: "Bandingkan sampah campur vs terpilah secara visual" },
          { icon: "🌍", title: "Dashboard Komunitas",  desc: "Lihat dampak kolektif seluruh pengguna" },
          { icon: "🗺️", title: "Alur Sampahku",       desc: "Infografik: dari dapur sampai PSEL jadi listrik" },
        ].map((f, i, arr) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#e8f5ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>🧭 Konteks Latar Belakang</div>
        {[
          { icon: "🏗️", text: "TPA Suwung Bali ditutup permanen awal 2026 → krisis pengelolaan 4.000 ton/hari sampah" },
          { icon: "📋", text: "SE Bupati Badung April 2026 mewajibkan warga pilah 3 kategori: Organik, Anorganik, Residu" },
          { icon: "⚡", text: "PSEL Pesanggaran butuh sampah terpilah agar efisiensi WtE maksimal (4× lebih banyak listrik)" },
          { icon: "🎓", text: "Gap: warga niat baik tapi tidak tahu dampak konkret tindakan mereka" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </Card>
    </div>
  );

  /* ─────────────── USERS ─────────────── */
  const users = (
    <div>
      <SectionTitle emoji="👥" title="Siapa Penggunanya?" sub="Tiga tipe pengguna yang harus dilayani dengan baik" />
      <InfoBox icon="💡" text="Semua fitur dan keputusan desain harus selalu ditanya: 'Apakah Pak/Bu Warga Biasa bisa pakai ini dalam 10 detik tanpa bantuan?'" />
      {[
        {
          emoji: "👴👵", name: "Warga / Ibu Rumah Tangga", age: "40–65 tahun", color: "#2d7a4f",
          desc: "Pengguna utama SE Bupati. Mau taat aturan, punya niat baik, tapi butuh panduan yang tidak ribet dan tidak menakutkan.",
          kebutuhan: ["Tulisan BESAR & jelas", "1 aksi per halaman", "Tanpa istilah teknis", "Tombol besar & kontras", "Konfirmasi setiap aksi penting"],
          pains: ["Takut salah", "Gaptek", "Nggak ngerti jargon lingkungan"],
        },
        {
          emoji: "🎓", name: "Mahasiswa / Anak Muda", age: "18–28 tahun", color: "#1a6b40",
          desc: "Tech-savvy, peduli lingkungan, mau share dampaknya. Jadi early adopter sekaligus ambassador organik PilahCerdas.",
          kebutuhan: ["Data bisa di-share ke sosmed", "Infografik estetik", "PWA install di HP", "Gamifikasi & streak"],
          pains: ["Bosan dengan app jelek", "Nggak ada bukti nyata dampaknya", "Susah ajak teman"],
        },
        {
          emoji: "🏘️", name: "Pengurus RT / TPS3R", age: "30–55 tahun", color: "#0f4a25",
          desc: "Butuh data agregat pemilahan untuk laporan mingguan ke Dinas LH Badung. Efisiensi waktu jadi prioritas utama.",
          kebutuhan: ["Dashboard komunitas lengkap", "Export laporan mingguan", "Filter per tanggal/wilayah", "Ringkasan otomatis"],
          pains: ["Rekap manual makan waktu", "Data tersebar tidak terstruktur", "Laporan ke DLH ribet"],
        },
      ].map((u, i) => (
        <Card key={i} style={{ borderLeft: `5px solid ${u.color}` }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ fontSize: 38 }}>{u.emoji}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: u.color }}>{u.name}</div>
              <Tag>{u.age}</Tag>
              <div style={{ fontSize: 13, color: "#555", marginTop: 8, lineHeight: 1.6 }}>{u.desc}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Yang Dibutuhkan</div>
              {u.kebutuhan.map((k, j) => (
                <div key={j} style={{ fontSize: 12, color: u.color, fontWeight: 600, padding: "3px 0" }}>✓ {k}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Pain Points</div>
              {u.pains.map((p, j) => (
                <div key={j} style={{ fontSize: 12, color: "#e05c2a", fontWeight: 600, padding: "3px 0" }}>✗ {p}</div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  /* ─────────────── PROBLEMS ─────────────── */
  const problems = (
    <div>
      <SectionTitle emoji="⚡" title="Masalah yang Diselesaikan" sub="5 masalah nyata — 5 solusi konkret" />
      {[
        { no: "01", icon: "🤷", impact: "TINGGI", problem: "Warga tidak tahu cara pilah yang benar",         solve: "Panduan visual tiga warna — Hijau (Organik) / Biru (Anorganik) / Abu (Residu) — langsung paham tanpa baca teks panjang." },
        { no: "02", icon: "😑", impact: "TINGGI", problem: "Nggak ada motivasi untuk konsisten memilah",    solve: "Setiap input langsung muncul: '0.5 kg plastikmu = 3 jam lampu LED menyala' — bukan angka abstrak, tapi gambaran nyata." },
        { no: "03", icon: "🏗️", impact: "TINGGI", problem: "PSEL Pesanggaran butuh sampah berkualitas",    solve: "Edukasi via Simulator: sampah terpilah menghasilkan 4× lebih banyak listrik di PSEL vs sampah campur." },
        { no: "04", icon: "📊", impact: "SEDANG", problem: "RT/TPS3R susah buat laporan manual",           solve: "Dashboard komunitas otomatis + ekspor ringkasan mingguan siap kirim ke Dinas LH." },
        { no: "05", icon: "📱", impact: "SEDANG", problem: "App lain perlu diunduh, warga malas install",  solve: "PWA = buka langsung dari browser, bisa pasang di home screen tanpa App Store." },
      ].map((item, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 12, boxShadow: "0 2px 12px rgba(45,122,79,0.07)", border: "1px solid #e8f5ee" }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#1a4a30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{item.no}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{item.icon} {item.problem}</div>
                <Tag color={item.impact === "TINGGI" ? "#e05c2a" : "#f5a623"}>{item.impact}</Tag>
              </div>
            </div>
          </div>
          <div style={{ background: "#f0faf4", borderRadius: 12, padding: "10px 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2d7a4f", textTransform: "uppercase", letterSpacing: 0.5 }}>Solusi → </span>
            <span style={{ fontSize: 13, color: "#333" }}>{item.solve}</span>
          </div>
        </div>
      ))}
    </div>
  );

  /* ─────────────── FEATURES ─────────────── */
  const features = (
    <div>
      <SectionTitle emoji="✨" title="Fitur-Fitur" sub="Prioritas jelas — nggak ada fitur yang bikin pengguna bingung" />
      <InfoBox icon="💡" text="Prinsip: 4 fitur utama saja di MVP. Pengguna tidak boleh bingung ada tombol apa-apa yang tidak mereka butuhkan." />

      <div style={{ fontWeight: 800, fontSize: 12, color: "#2d7a4f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🟢 MVP — Wajib Ada</div>
      {[
        { icon: "📝", title: "Catat Pilah Harian",  desc: "Form 3 langkah: pilih kategori → input berat (gram) → lihat dampak. Output real-time: kWh potensi PSEL, kg CO₂e dicegah, analogi manusiawi ('= 5 jam lampu LED 8W').", priority: "WAJIB" },
        { icon: "⚡", title: "Simulator Energi",    desc: "Dua panel berdampingan — Sampah Campur vs Sampah Terpilah. Slider komposisi organik/anorganik. Grafik batang real-time. Pengguna 'main-main' sambil belajar.", priority: "WAJIB" },
        { icon: "🌍", title: "Dashboard Komunitas", desc: "Agregasi anonim: total kg terpilah, total kWh potensial, total CO₂e terhindar dari semua pengguna. Counter animasi. Update real-time via Supabase.", priority: "WAJIB" },
        { icon: "🗺️", title: "Alur Sampahku",     desc: "Infografik klik-able: Rumah Tangga → TPS3R Jimbaran Lestari → RDF Processing → PSEL Pesanggaran → Listrik PLN Bali. Tap tiap tahap = popup penjelasan singkat.", priority: "WAJIB" },
      ].map((f, i) => <FeaturePill key={i} icon={f.icon} text={{ title: f.title, desc: f.desc }} priority={f.priority} />)}

      <div style={{ fontWeight: 800, fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 24 }}>⚪ V2 — Bagus Ditambahkan</div>
      {[
        { icon: "🔔", title: "Pengingat Pilah",   desc: "Notifikasi push PWA harian: 'Jangan lupa pilah sampah hari ini! ♻️'. Bisa diatur jam-nya.", priority: "V2" },
        { icon: "📅", title: "Riwayat Log",       desc: "Grafik bar konsistensi 7/30 hari. Lihat hari mana tidak log dan total dampak mingguan.", priority: "V2" },
        { icon: "🏅", title: "Pencapaian",        desc: "Badge sederhana: '7 hari berturut-turut!', '1 kg plastik terpilah', 'Pertama kali log organik!'.", priority: "V2" },
        { icon: "📤", title: "Share Dampak",      desc: "Gambar otomatis siap share: 'Minggu ini aku mencegah 1.2 kg CO₂e masuk atmosfer via PilahCerdas 🌿'.", priority: "V2" },
      ].map((f, i) => <FeaturePill key={i} icon={f.icon} text={{ title: f.title, desc: f.desc }} priority={f.priority} />)}

      <div style={{ fontWeight: 800, fontSize: 12, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 24 }}>⬜ V3 — Jangka Panjang</div>
      {[
        { icon: "🏘️", title: "Laporan RT/RW",     desc: "Export PDF laporan mingguan otomatis untuk diserahkan ke Dinas LH Badung.", priority: "V3" },
        { icon: "🌡️", title: "Integrasi Cuaca",  desc: "Saran perawatan terkait cuaca (misal: 'Musim hujan = kompos organik lebih cepat').", priority: "V3" },
        { icon: "🤖", title: "Identifikasi Foto", desc: "Foto sampah → AI klasifikasi otomatis masuk kategori yang tepat.", priority: "V3" },
      ].map((f, i) => <FeaturePill key={i} icon={f.icon} text={{ title: f.title, desc: f.desc }} priority={f.priority} />)}
    </div>
  );

  /* ─────────────── SCREENS ─────────────── */
  const screens = (
    <div>
      <SectionTitle emoji="📱" title="Halaman-Halaman App" sub="6 layar utama — alur navigasi yang simpel" />

      <div style={{ background: "linear-gradient(135deg, #1a4a30, #2d7a4f)", borderRadius: 20, padding: 20, marginBottom: 20, color: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🗺️ Alur Navigasi Lengkap</div>
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.8 }}>
          Splash → Onboarding (sekali saja) → <strong>Home</strong><br />
          Home → Catat Pilah / Simulator / Komunitas / Alur Sampah<br />
          Semua halaman bisa kembali ke Home dengan 1 ketukan
        </div>
      </div>

      <ScreenCard no="1" name="Splash & Onboarding"
        desc="Kesan pertama. Ilustrasi menarik, teks singkat, satu tombol saja."
        flow="Hanya muncul sekali saat pertama install — langsung skip jika sudah pernah buka"
        elements={["Ilustrasi sampah → listrik", "Tagline 1 kalimat", "Tombol hijau besar 'Mulai Pilah'", "3 slide penjelasan singkat"]} />

      <ScreenCard no="2" name="Home — Pusat Kendali"
        desc="Halaman utama. Ringkasan hari ini + 4 tombol akses fitur utama."
        flow="Titik kembali dari semua halaman — selalu terasa 'di rumah'"
        elements={["Salam + tanggal hari ini", "Kartu status hari ini ('Belum log hari ini ⏰')", "4 tombol fitur (grid 2×2)", "Navigasi bawah — Home & Komunitas"]} />

      <ScreenCard no="3" name="Catat Pilah Harian"
        desc="Form simpel 3 langkah: kategori → berat → dampak."
        flow="Langkah 1: pilih kategori → Langkah 2: input berat → Langkah 3: lihat hasil → Simpan"
        elements={["3 tombol besar berwarna: Organik/Anorganik/Residu", "Input berat (gram) — keyboard angka langsung muncul", "Panel hasil real-time (kWh + CO₂e + analogi)", "Tombol 'Simpan Log' hijau solid"]} />

      <ScreenCard no="4" name="Simulator Energi"
        desc="Edukasi interaktif. Geser slider, lihat perbedaannya langsung."
        flow="Geser slider komposisi → dua kartu berubah real-time → bandingkan"
        elements={["Slider komposisi organik vs anorganik (%)", "Dua kartu bersebelahan (Campur vs Terpilah)", "Grafik batang perbandingan kWh", "Label perbedaan: '4× lebih banyak listrik jika dipilah'"]} />

      <ScreenCard no="5" name="Dashboard Komunitas"
        desc="Dampak kolektif seluruh pengguna PilahCerdas — motivasi bersama."
        flow="Data masuk otomatis setiap ada pengguna log — real-time via Supabase"
        elements={["Counter total kg terpilah (animasi angka)", "Counter total kWh potensi", "Counter total CO₂e dicegah", "Kontributor aktif hari ini"]} />

      <ScreenCard no="6" name="Alur Sampahku"
        desc="Infografik interaktif — dari dapur sampai jadi listrik PLN Bali."
        flow="Tap tiap node → popup singkat (2–3 kalimat) → tutup → lanjut explore"
        elements={["Rantai visual: Rumah → TPS3R → RDF → PSEL → PLN", "Tap tiap tahap = popup penjelasan", "Animasi aliran sederhana antar tahap", "Info jarak & kapasitas PSEL Pesanggaran"]} />
    </div>
  );

  /* ─────────────── DESIGN ─────────────── */
  const design = (
    <div>
      <SectionTitle emoji="🎨" title="Panduan Tampilan" sub="Warna, font, komponen — konsisten di seluruh app" />

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 16, fontSize: 15 }}>🎨 Palet Warna Utama</div>
        <ColorSwatch hex="#2d7a4f" name="Hijau Utama"    use="Tombol CTA, ikon aktif, aksen header" />
        <ColorSwatch hex="#1a4a30" name="Hijau Gelap"    use="Judul halaman, teks heading penting" />
        <ColorSwatch hex="#e8f5ee" name="Hijau Muda"     use="Background kartu, highlight pasif" />
        <ColorSwatch hex="#f5faf7" name="Putih Hijau"    use="Background halaman utama" />
        <ColorSwatch hex="#f5a623" name="Kuning Aksi"    use="Badge, notifikasi, pengingat" />
        <ColorSwatch hex="#e05c2a" name="Oranye Alert"   use="Dampak tinggi, peringatan penting" />
        <ColorSwatch hex="#ffffff" name="Putih Bersih"   use="Background kartu, modal, popup" />
        <div style={{ background: "#f0faf4", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#2d7a4f", marginTop: 8 }}>
          ⚠️ Aturan ketat: maksimal 3 warna dominan per halaman. Hijau utama + putih + 1 aksen saja.
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 16, fontSize: 15 }}>🔤 Tipografi — Nunito</div>
        <div style={{ background: "#f0faf4", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#2d7a4f", marginBottom: 14 }}>
          💡 Nunito dipilih karena bentuknya bulat & ramah — tidak terasa teknis atau menakutkan. Ideal untuk semua usia termasuk lansia.
        </div>
        {[
          { nama: "Nunito Bold 32px",     pakai: "Judul halaman utama, nama fitur besar" },
          { nama: "Nunito Bold 24px",     pakai: "Angka dampak besar (counter kWh, CO₂e)" },
          { nama: "Nunito SemiBold 18px", pakai: "Subjudul, label kartu, nama kategori" },
          { nama: "Nunito Regular 15px",  pakai: "Body teks, deskripsi, penjelasan" },
          { nama: "Nunito Medium 12px",   pakai: "Label ikon, tag, metadata, caption" },
        ].map((t, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a4a30" }}>{t.nama}</div>
            <div style={{ fontSize: 12, color: "#666", textAlign: "right", maxWidth: "55%" }}>{t.pakai}</div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>📐 Aturan Komponen</div>
        {[
          { label: "Border radius kartu",    val: "20–24px",  note: "Terasa lembut, bukan kotak kaku" },
          { label: "Tombol utama",           val: "min. 56px tinggi", note: "Teks 18px Bold, lebar penuh" },
          { label: "Padding layar",          val: "20px kiri-kanan", note: "24px atas-bawah" },
          { label: "Ukuran ikon minimum",    val: "28px",     note: "Selalu ada label teks di bawah" },
          { label: "Spacing antar elemen",   val: "kelipatan 8px", note: "8 / 16 / 24 / 32px" },
          { label: "Shadow kartu",           val: "0 2px 16px", note: "rgba(45,122,79,0.10)" },
          { label: "Warna teks primer",      val: "#1a4a30",  note: "Hijau gelap — kontras tinggi" },
          { label: "Warna teks sekunder",    val: "#666",     note: "Abu — untuk deskripsi & meta" },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div style={{ fontSize: 13, color: "#444" }}>{r.label}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2d7a4f" }}>{r.val}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{r.note}</div>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>🎭 Kode Warna Kategori Sampah</div>
        {[
          { hex: "#4CAF50", nama: "Organik",   contoh: "Sisa makanan, daun, kulit buah" },
          { hex: "#2196F3", nama: "Anorganik", contoh: "Plastik, kertas, kaleng, kaca" },
          { hex: "#9E9E9E", nama: "Residu",    contoh: "Popok, pembalut, masker, styrofoam" },
        ].map((k, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < 2 ? "1px solid #f0f0f0" : "none" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: k.hex, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1a4a30" }}>{k.nama}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{k.contoh}</div>
            </div>
          </div>
        ))}
        <div style={{ background: "#fff8e1", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#856404" }}>
          ⚠️ Warna kategori ini harus konsisten di SELURUH app — tombol, ikon, label, kartu, dan infografik.
        </div>
      </Card>
    </div>
  );

  /* ─────────────── RULES ─────────────── */
  const rules = (
    <div>
      <SectionTitle emoji="📏" title="Aturan Desain" sub="Setiap keputusan desain harus lulus uji ini sebelum diimplementasi" />

      <div style={{ background: "linear-gradient(135deg, #1a4a30 0%, #2d7a4f 100%)", borderRadius: 24, padding: 24, marginBottom: 24, color: "#fff" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧪</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Uji "Simpel" — Wajib Lulus</div>
        <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.8 }}>
          Tunjukkan halaman ke orang awam selama <strong>5 detik</strong>, lalu tutup. Tanya:<br />
          <em>"Kamu harus ngapain di sini?"</em><br /><br />
          ✅ Bisa jawab benar → <strong>LULUS, boleh di-deploy</strong><br />
          ❌ Bingung lebih dari 3 detik → <strong>Desain ulang, jangan dikompromikan</strong>
        </div>
      </div>

      <div style={{ fontWeight: 800, fontSize: 12, color: "#2d7a4f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>✅ Yang Harus Dilakukan</div>
      <RuleCard ok rule="1 Halaman = 1 Tujuan"            desc="Setiap layar hanya punya SATU aksi utama. Jika ada dua tujuan sama pentingnya → pecah jadi dua halaman." />
      <RuleCard ok rule="Tombol Utama = Paling Dominan"   desc="Warna hijau solid, ukuran besar, paling mencolok. Nggak ada elemen lain yang bersaing secara visual." />
      <RuleCard ok rule="Ikon SELALU Ada Label Teks"      desc="Tanpa teks, pengguna awam tidak hapal arti ikon. Label di bawah ikon = wajib, bukan opsional." />
      <RuleCard ok rule="Bahasa Manusia Seutuhnya"        desc="'Waduh, koneksimu putus. Coba lagi ya 🙏' — bukan 'Error 404 Connection Timeout'." />
      <RuleCard ok rule="Konfirmasi Sebelum Aksi Fatal"   desc="'Yakin mau hapus log ini?' — satu klik tidak boleh langsung menghilangkan data." />
      <RuleCard ok rule="Loading Selalu Ada Feedback"     desc="Spinner + teks 'Menyimpan...' saat proses berlangsung. Layar kosong = pengguna pikir hang." />
      <RuleCard ok rule="Istilah Teknis Wajib Ada Padanan" desc="Jika LHV / MJ/kg / WtE harus muncul, tulis padanannya: 'LHV (panas yang bisa dilepas sampah)'." />
      <RuleCard ok rule="Scrolling Cukup 1–2 Layar"      desc="Konten satu halaman tidak boleh terlalu panjang. Informasi lebih → buat halaman baru." />

      <div style={{ fontWeight: 800, fontSize: 12, color: "#e05c2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 24 }}>❌ Yang Dilarang</div>
      <RuleCard ok={false} rule="Info Penting di Tooltip/Hover"    desc="Info tersembunyi di balik ikon '?' kecil = tidak ada. Semua info penting harus langsung terlihat." />
      <RuleCard ok={false} rule="Paragraf Panjang di UI"           desc="Maks. 2–3 kalimat per kartu. Lebih dari itu → pecah jadi poin, ikon, atau accordion." />
      <RuleCard ok={false} rule="Lebih dari 3 Warna Dominan"       desc="Hijau, putih, satu aksen. Lebih dari itu = visual berantakan dan fokus pengguna buyar." />
      <RuleCard ok={false} rule="Form Lebih dari 3 Input Sekaligus" desc="Maksimal 3 field per halaman. Lebih → wizard langkah demi langkah." />
      <RuleCard ok={false} rule="Animasi Berlebihan"               desc="Animasi hanya untuk feedback aksi (simpan, berhasil, error) — bukan dekorasi tiap scroll." />
      <RuleCard ok={false} rule="Font Kecil di Bawah 13px"         desc="Minimum 13px untuk teks apapun. Pertimbangkan pengguna 50+ tahun." />
    </div>
  );

  /* ─────────────── ROADMAP ─────────────── */
  const roadmap = (
    <div>
      <SectionTitle emoji="🗓️" title="Roadmap Pengembangan" sub="Dari MVP hingga replikasi nasional — bertahap, realistis" />
      <InfoBox icon="📌" text="Roadmap ini mengikuti prinsip: ship early, learn fast, improve continuously. Jangan sempurnakan di balik layar terlalu lama." />

      {[
        {
          fase: "Fase 0 — Selesai", periode: "April–Mei 2026", color: "#2d7a4f", bg: "#e8f5ee",
          items: [
            { done: true,  text: "Pemilahan mandiri 3 kategori di Jimbaran (baseline data)" },
            { done: true,  text: "Riset SE Bupati Badung & konteks PSEL Pesanggaran" },
            { done: true,  text: "Wireframe & arsitektur React + Supabase" },
            { done: true,  text: "Build MVP 4 fitur inti dalam 3 hari" },
            { done: true,  text: "Deploy ke Vercel — gratis & dapat diakses publik" },
            { done: true,  text: "Onboarding 11 pengguna pertama (8 mahasiswa + 3 warga)" },
          ],
        },
        {
          fase: "Fase 1 — In Progress", periode: "Juni–Juli 2026", color: "#f5a623", bg: "#fff8e1",
          items: [
            { done: true,  text: "Perbaiki UX form Catat Pilah berdasarkan feedback pengguna awal" },
            { done: false, text: "Push notification pengingat harian (Web Push API)" },
            { done: false, text: "Halaman riwayat log 7/30 hari + grafik konsistensi" },
            { done: false, text: "Open-source repositori di GitHub + dokumentasi Bahasa Indonesia" },
            { done: false, text: "Presentasi ke TPS3R Jimbaran Lestari untuk kemitraan data" },
          ],
        },
        {
          fase: "Fase 2 — Planned", periode: "Agustus–Oktober 2026", color: "#1a6b40", bg: "#f0faf4",
          items: [
            { done: false, text: "Integrasi data dengan TPS3R Jimbaran → laporan mingguan otomatis" },
            { done: false, text: "Fitur Share Dampak — gambar siap posting ke Instagram/WhatsApp" },
            { done: false, text: "Badge & gamifikasi — streak harian, pencapaian milestone" },
            { done: false, text: "Perluasan ke 2 TPS3R tambahan di Badung Selatan" },
            { done: false, text: "Integrasi sebagai program kerja HMTI Universitas Udayana" },
          ],
        },
        {
          fase: "Fase 3 — Vision", periode: "2027 dan seterusnya", color: "#0f3d25", bg: "#f5faf7",
          items: [
            { done: false, text: "Data komunitas masuk laporan resmi Dinas LH Kabupaten Badung" },
            { done: false, text: "Template open-source diadaptasi mahasiswa IT kota lain" },
            { done: false, text: "Fitur identifikasi foto sampah via AI (V3)" },
            { done: false, text: "Studi kasus: jurnal ilmiah mahasiswa / konferensi teknologi lingkungan" },
            { done: false, text: "10.000 kg sampah terpilah terdokumentasi secara kumulatif" },
          ],
        },
      ].map((fase, fi) => (
        <div key={fi} style={{ background: fase.bg, borderRadius: 20, padding: 20, marginBottom: 16, border: `2px solid ${fase.color}20` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: fase.color }}>{fase.fase}</div>
              <Tag color={fase.color}>{fase.periode}</Tag>
            </div>
          </div>
          {fase.items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: ii < fase.items.length - 1 ? `1px solid ${fase.color}15` : "none" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.done ? "✅" : "⬜"}</span>
              <span style={{ fontSize: 13, color: item.done ? "#2d7a4f" : "#444", fontWeight: item.done ? 600 : 400 }}>{item.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  /* ─────────────── TECH ─────────────── */
  const tech = (
    <div>
      <SectionTitle emoji="⚙️" title="Tech Stack" sub="Teknologi yang dipilih — semua gratis, semua open-source" />
      <InfoBox icon="💡" text="Setiap teknologi dipilih dengan kriteria: gratis, mudah di-deploy sendiri, dan bisa dikontribusi oleh mahasiswa lain." />

      {[
        {
          layer: "Frontend", icon: "🖥️", color: "#2d7a4f",
          items: [
            { nama: "React.js",       peran: "Framework UI utama",              alasan: "Ekosistem besar, banyak tutorial Bahasa Indonesia, mahasiswa IT sudah kenal" },
            { nama: "Tailwind CSS",   peran: "Styling komponen",                alasan: "Rapid prototyping, class utilities, konsistensi desain mudah dijaga" },
            { nama: "Vite",           peran: "Build tool & dev server",         alasan: "Sangat cepat, PWA plugin tersedia, zero config" },
            { nama: "Recharts",       peran: "Grafik batang simulator energi",  alasan: "Native React, ringan, cukup untuk bar chart sederhana" },
            { nama: "vite-plugin-pwa", peran: "PWA manifest & service worker", alasan: "Install di home screen tanpa App Store" },
          ],
        },
        {
          layer: "Backend & Database", icon: "🗄️", color: "#1a6b40",
          items: [
            { nama: "Supabase",       peran: "Database + Auth + Realtime",     alasan: "PostgreSQL gratis, real-time subscription, no backend server perlu ditulis" },
            { nama: "Supabase Edge Functions", peran: "Logika server ringan",  alasan: "Kalkulasi agregat komunitas — agar Carbon Calc tidak bisa dimanipulasi di client" },
            { nama: "Row Level Security", peran: "Keamanan data pengguna",     alasan: "Data log tiap pengguna hanya bisa dibaca oleh diri sendiri, bukan pengguna lain" },
          ],
        },
        {
          layer: "Deployment & Infrastructure", icon: "🚀", color: "#0f4a25",
          items: [
            { nama: "Vercel",         peran: "Hosting frontend + CI/CD",       alasan: "Deploy otomatis setiap push ke GitHub, HTTPS gratis, edge network global" },
            { nama: "GitHub",         peran: "Version control + open-source",  alasan: "Repositori publik agar mahasiswa lain bisa fork & kontribusi" },
            { nama: "Vercel Analytics", peran: "Monitoring penggunaan",        alasan: "Lihat halaman mana paling sering dibuka, tanpa bayar" },
          ],
        },
        {
          layer: "Formula & Kalkulasi", icon: "🔢", color: "#2d7a4f",
          items: [
            { nama: "LHV Formula",    peran: "Hitung nilai kalor sampah",      alasan: "LHV = LHV_kering × (1-M) - 2.44×M — diimplementasi di client-side JS" },
            { nama: "IPCC 2006 Waste Sector", peran: "Estimasi emisi CH₄",    alasan: "Metodologi standar internasional untuk hitung CO₂e dari sampah landfill" },
            { nama: "Efisiensi PSEL η=22%", peran: "Konversi LHV ke kWh",     alasan: "Nilai tipikal incinerator skala kota Asia Tenggara — dikalibrasi dari literatur" },
          ],
        },
      ].map((layer, li) => (
        <Card key={li} style={{ borderTop: `4px solid ${layer.color}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>{layer.icon}</span>
            <div style={{ fontWeight: 800, fontSize: 15, color: layer.color }}>{layer.layer}</div>
          </div>
          {layer.items.map((item, ii) => (
            <div key={ii} style={{ padding: "10px 0", borderBottom: ii < layer.items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a4a30" }}>{item.nama}</div>
                <Tag>{item.peran}</Tag>
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>→ {item.alasan}</div>
            </div>
          ))}
        </Card>
      ))}

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>💰 Estimasi Biaya Operasional</div>
        {[
          { item: "Vercel Hosting",    biaya: "Gratis",   catatan: "Hingga 100GB bandwidth/bulan" },
          { item: "Supabase Database", biaya: "Gratis",   catatan: "Hingga 500MB storage, 2GB transfer" },
          { item: "Domain .id",        biaya: "~Rp 150rb/tahun", catatan: "Opsional — bisa pakai subdomain Vercel gratis" },
          { item: "Total MVP",         biaya: "Rp 0",     catatan: "Atau maks Rp 150rb/tahun jika beli domain custom" },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <div style={{ fontSize: 13, color: "#444" }}>{r.item}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: i === arr.length - 1 ? "#2d7a4f" : "#1a4a30" }}>{r.biaya}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{r.catatan}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  /* ─────────────── RISKS ─────────────── */
  const risks = (
    <div>
      <SectionTitle emoji="⚠️" title="Risiko & Mitigasi" sub="Antisipasi sebelum jadi masalah — lebih baik siap dari pada kaget" />
      <InfoBox icon="🧠" text="Setiap risiko sudah punya rencana mitigasi konkret. Bukan untuk menakut-nakuti, tapi agar proyek tetap berjalan walau ada hambatan." />

      {[
        {
          kategori: "Risiko Adopsi", icon: "👥", color: "#e05c2a",
          items: [
            {
              risiko: "Pengguna malas input data setiap hari",
              prob: "TINGGI", dampak: "TINGGI",
              mitigasi: "Buat input semudah mungkin (< 30 detik). Push notification pengingat pagi hari. Gamifikasi streak harian.",
            },
            {
              risiko: "Warga lansia kesulitan pakai PWA",
              prob: "SEDANG", dampak: "SEDANG",
              mitigasi: "Sesi pendampingan langsung via HMTI. Video tutorial YouTube 3 menit. Mode font besar opsional.",
            },
            {
              risiko: "Pengguna tidak percaya angka dampaknya akurat",
              prob: "SEDANG", dampak: "TINGGI",
              mitigasi: "Tampilkan referensi formula (IPCC 2006) yang bisa diklik. Tambahkan disclaimer 'estimasi berdasarkan metodologi standar'.",
            },
          ],
        },
        {
          kategori: "Risiko Teknis", icon: "⚙️", color: "#1a6b40",
          items: [
            {
              risiko: "Supabase free tier mencapai batas quota",
              prob: "RENDAH", dampak: "TINGGI",
              mitigasi: "Monitor penggunaan dashboard Supabase. Jika mendekati batas, ajukan sponsor lokal (DLH Badung) atau upgrade ke paid tier ~$25/bulan.",
            },
            {
              risiko: "PWA tidak bisa diinstall di HP Android lawas",
              prob: "SEDANG", dampak: "SEDANG",
              mitigasi: "PWA tetap bisa diakses via browser biasa. Fungsi utama tidak bergantung pada install. Uji di Chrome Android 80+.",
            },
            {
              risiko: "Data komunitas bisa dimanipulasi (input palsu)",
              prob: "RENDAH", dampak: "SEDANG",
              mitigasi: "Rate limiting via Supabase RLS. Validasi input server-side (berat maks logis per log). Monitoring anomali data.",
            },
          ],
        },
        {
          kategori: "Risiko Keberlanjutan", icon: "🌱", color: "#0f3d25",
          items: [
            {
              risiko: "Proyek berhenti setelah lulus kuliah",
              prob: "SEDANG", dampak: "TINGGI",
              mitigasi: "Open-source sejak awal. Dokumentasi lengkap. Integrasikan ke program kerja HMTI Udayana agar ada penerus mahasiswa.",
            },
            {
              risiko: "TPS3R Jimbaran Lestari tidak mau bermitra",
              prob: "RENDAH", dampak: "SEDANG",
              mitigasi: "Mulai dari data komunitas dulu tanpa integrasi formal. Buktikan value dulu dengan 100+ pengguna aktif, baru proposal kemitraan.",
            },
            {
              risiko: "Regulasi SE Bupati berubah atau dicabut",
              prob: "SANGAT RENDAH", dampak: "SEDANG",
              mitigasi: "App tidak bergantung pada satu regulasi — fungsi edukasi dampak energi tetap relevan bahkan tanpa SE. Framing ulang jika perlu.",
            },
          ],
        },
      ].map((kat, ki) => (
        <Card key={ki} style={{ borderLeft: `5px solid ${kat.color}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>{kat.icon}</span>
            <div style={{ fontWeight: 800, fontSize: 15, color: kat.color }}>{kat.kategori}</div>
          </div>
          {kat.items.map((item, ii) => (
            <div key={ii} style={{ padding: "12px 0", borderBottom: ii < kat.items.length - 1 ? `1px solid ${kat.color}15` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a4a30", flex: 1 }}>⚠️ {item.risiko}</div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <Tag color={item.prob === "TINGGI" ? "#e05c2a" : item.prob === "SEDANG" ? "#f5a623" : "#aaa"}>P:{item.prob}</Tag>
                  <Tag color={item.dampak === "TINGGI" ? "#e05c2a" : item.dampak === "SEDANG" ? "#f5a623" : "#aaa"}>D:{item.dampak}</Tag>
                </div>
              </div>
              <div style={{ background: "#f0faf4", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#2d7a4f" }}>
                🛡️ {item.mitigasi}
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );

  /* ─────────────── SUCCESS ─────────────── */
  const success = (
    <div>
      <SectionTitle emoji="🏆" title="Ukuran Keberhasilan" sub="Kapan bisa bilang PilahCerdas berhasil? Ini jawabannya." />
      <InfoBox icon="💡" text="Ukuran sukses dibagi dua: kuantitatif (angka) dan kualitatif (cerita). Keduanya sama pentingnya." />

      {[
        {
          fase: "Minggu 1–2 — Launch", color: "#2d7a4f",
          metrics: [
            { icon: "👤", label: "Pengguna aktif",      target: "50",        unit: "pengguna",  desc: "Dari log yang masuk ke Supabase" },
            { icon: "📝", label: "Total log pemilahan", target: "200",       unit: "entri",     desc: "Dari semua pengguna gabungan" },
            { icon: "⏱️", label: "Waktu onboarding",   target: "< 2",       unit: "menit",     desc: "Buka app → pertama kali simpan log" },
            { icon: "📊", label: "Penyelesaian Alur Sampahku", target: "60", unit: "% pengguna", desc: "Yang buka & baca infografik sampai selesai" },
          ],
        },
        {
          fase: "Bulan 1–3 — Growth", color: "#1a6b40",
          metrics: [
            { icon: "🔄", label: "Retensi 7 hari",      target: "60",  unit: "%",     desc: "Pengguna yang kembali setelah 1 minggu" },
            { icon: "⚡", label: "kWh terdokumentasi",  target: "500", unit: "kWh",   desc: "Potensi energi dari sampah terpilah komunitas" },
            { icon: "🌿", label: "CO₂e terhindar",      target: "250", unit: "kg",    desc: "Total emisi metana yang dicegah dari landfill" },
            { icon: "🤝", label: "Mitra TPS3R",         target: "1",   unit: "TPS3R", desc: "Integrasi data resmi Jimbaran Lestari" },
          ],
        },
        {
          fase: "Bulan 6–12 — Scale", color: "#0f3d25",
          metrics: [
            { icon: "🏘️", label: "Cakupan TPS3R",      target: "3",      unit: "TPS3R", desc: "Replikasi ke TPS3R lain di Badung Selatan" },
            { icon: "📊", label: "Data masuk DLH",      target: "1",      unit: "laporan resmi", desc: "Data komunitas dipakai Dinas LH Badung" },
            { icon: "🌱", label: "Sampah terdokumentasi", target: "10.000", unit: "kg",  desc: "Total kumulatif sejak launch" },
            { icon: "⭐", label: "NPS App",             target: "> 70",   unit: "skor", desc: "Net Promoter Score dari survei pengguna" },
          ],
        },
      ].map((fase, fi) => (
        <Card key={fi} style={{ borderTop: `4px solid ${fase.color}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: fase.color, flexShrink: 0 }} />
            <div style={{ fontWeight: 800, fontSize: 14, color: fase.color }}>{fase.fase}</div>
          </div>
          {fase.metrics.map((m, mi, arr) => (
            <div key={mi} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: mi < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{m.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ background: "#e8f5ee", color: fase.color, borderRadius: 10, padding: "6px 12px", fontWeight: 800, fontSize: 15 }}>{m.target}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{m.unit}</div>
              </div>
            </div>
          ))}
        </Card>
      ))}

      <Card>
        <div style={{ fontWeight: 700, color: "#1a4a30", marginBottom: 14, fontSize: 15 }}>📖 Ukuran Kualitatif — Yang Tidak Bisa Di-angka</div>
        {[
          { icon: "💬", text: "Seorang warga lansia berkata: 'Sekarang aku ngerti kenapa harus pilah. Ternyata bisa jadi listrik!'" },
          { icon: "🏫", text: "PilahCerdas dijadikan materi kuliah atau PKM mahasiswa IT universitas lain" },
          { icon: "📰", text: "Diliput media lokal Bali sebagai contoh inovasi civic-tech mahasiswa" },
          { icon: "🔬", text: "Data PilahCerdas dikutip dalam penelitian atau laporan lingkungan hidup" },
          { icon: "🌏", text: "Mahasiswa IT dari kota lain fork repositori dan adaptasi untuk daerahnya" },
        ].map((q, i, arr) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{q.icon}</span>
            <span style={{ fontSize: 13, color: "#444", lineHeight: 1.6, fontStyle: "italic" }}>{q.text}</span>
          </div>
        ))}
      </Card>

      <div style={{ background: "linear-gradient(135deg, #1a4a30, #2d7a4f)", borderRadius: 20, padding: 24, textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
          "Sukses sejati bukan di jumlah download —<br />tapi saat satu warga bilang:<br />'Sekarang aku ngerti kenapa harus pilah.'"
        </div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Dampak edukasi &gt; metrik vanitas</div>
      </div>
    </div>
  );

  /* ─────────────── RENDER ─────────────── */
  const sectionMap = { overview, users, problems, features, screens, design, rules, roadmap, tech, risks, success };

  return (
    <div style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif", background: "#f5faf7", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a4a30 0%, #2d7a4f 60%, #3a9a60 100%)", padding: "32px 24px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, fontSize: 140, opacity: 0.07 }}>♻️</div>
        <div style={{ position: "absolute", left: -20, bottom: -20, fontSize: 100, opacity: 0.05 }}>🌿</div>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Product Requirements Document</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>🌿 PilahCerdas</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16 }}>Aplikasi Pemilahan Sampah Berbasis Dampak Energi — Bali 2026</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["v1.0 MVP", "PWA", "React + Supabase", "Jimbaran, Badung", "Open-Source"].map((t, i) => (
            <Tag key={i} color="rgba(255,255,255,0.18)">{t}</Tag>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#fff", padding: "0 4px", display: "flex", overflowX: "auto", borderBottom: "2px solid #e8f5ee", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 12px rgba(45,122,79,0.08)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)} style={{
            background: "none", border: "none", padding: "13px 12px 11px",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            borderBottom: active === n.id ? "3px solid #2d7a4f" : "3px solid transparent",
            color: active === n.id ? "#2d7a4f" : "#999",
            fontWeight: active === n.id ? 800 : 500,
            fontSize: 10, whiteSpace: "nowrap", transition: "all 0.15s", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: 17 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 20px 60px", maxWidth: 680, margin: "0 auto" }}>
        {sectionMap[active]}
      </div>

      {/* Footer */}
      <div style={{ background: "#1a4a30", color: "rgba(255,255,255,0.55)", textAlign: "center", padding: "18px 16px", fontSize: 12 }}>
        PilahCerdas PRD v1.0 · Universitas Udayana · Beasiswa Sobat Bumi Pertamina Foundation 2026<br />
        <span style={{ opacity: 0.4, fontSize: 11 }}>11 tab · Dibuat dengan niat baik untuk bumi yang lebih baik 🌿</span>
      </div>
    </div>
  );
}
