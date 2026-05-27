import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, AlertTriangle, ShieldCheck, X, Loader2, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, Clock, ClipboardList, Send
} from 'lucide-react';
import { useAduan } from '../../hooks/useAduan';
import { Card } from '../ui/Card';
import { BALI_REGENCY_LIST } from '../../lib/constants';

const KATEGORI_LABELS = {
  tumpukan_liar: 'Sampah Menumpuk di Jalan / Liar',
  tps_penuh: 'TPS Penuh / Tidak Terangkut',
  pembakaran_terbuka: 'Pembakaran Sampah Terbuka',
  sungai_tercemar: 'Pembuangan Sampah Liar ke Sungai'
};

// Fallback koordinat pusat masing-masing Kabupaten di Bali jika GPS diblokir koneksi tidak aman (HTTP)
const KABUPATEN_COORDINATES = {
  'Badung': { latitude: -8.5833, longitude: 115.1833 },
  'Bangli': { latitude: -8.4500, longitude: 115.3500 },
  'Buleleng': { latitude: -8.1167, longitude: 115.0833 },
  'Gianyar': { latitude: -8.5333, longitude: 115.3167 },
  'Jembrana': { latitude: -8.3000, longitude: 114.6667 },
  'Karangasem': { latitude: -8.4500, longitude: 115.6000 },
  'Klungkung': { latitude: -8.5333, longitude: 115.4000 },
  'Tabanan': { latitude: -8.5333, longitude: 115.1167 },
  'Denpasar': { latitude: -8.6500, longitude: 115.2167 }
};

export function LaporAduan({ onClose, initialTab = 'lapor', initialExpandedId = null }) {
  const { aduanList, loading, addAduan, submitting, syncError } = useAduan();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedId, setExpandedId] = useState(initialExpandedId);

  // Form State
  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [kategori, setKategori] = useState('tumpukan_liar');
  const [deskripsi, setDeskripsi] = useState('');
  const [coords, setCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsFailed, setGpsFailed] = useState(false);
  const [honestyChecked, setHonestyChecked] = useState(false);
  const [kabupaten, setKabupaten] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [desa, setDesa] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sinkronkan tab aktif jika prop initialTab berubah
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sinkronkan ID yang diperluas jika prop initialExpandedId berubah
  useEffect(() => {
    if (initialExpandedId) {
      setExpandedId(initialExpandedId);
    }
  }, [initialExpandedId]);

  // Tampilkan syncError dari hook jika upload ke Supabase gagal
  useEffect(() => {
    if (syncError) {
      setError(`Gagal mengunggah ke server: ${syncError}`);
    }
  }, [syncError]);

  // Ambil lokasi GPS otomatis saat komponen pertama kali termuat (hanya jika di tab lapor)
  useEffect(() => {
    if (activeTab === 'lapor') {
      getGPSLocation();
    }
  }, [activeTab]);

  const getGPSLocation = () => {
    setGpsLoading(true);
    setGpsFailed(false);
    setError('');
    if (!navigator.geolocation) {
      setGpsFailed(true);
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation Error:', err);
        setGpsFailed(true);
        setGpsLoading(false);
        // Jika diblokir karena koneksi tidak aman (HTTP), informasikan fallback
        if (err.code === 1) {
          setError('Akses GPS dibatasi oleh browser karena koneksi non-HTTPS. Lokasi akan disesuaikan otomatis dengan Kabupaten yang Anda pilih.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // Batasi file awal max 15MB sebelum kompresi
        setError('Ukuran file foto terlalu besar. Silakan pilih foto lain di bawah 15 MB.');
        return;
      }
      setFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!foto) {
      setError('Mohon ambil atau unggah foto bukti sampah terlebih dahulu.');
      return;
    }
    if (!kabupaten) {
      setError('Kabupaten lokasi aduan wajib dipilih.');
      return;
    }

    // Geolocation Secure Fallback Logic
    let finalCoords = coords;
    if (!finalCoords) {
      const fallback = KABUPATEN_COORDINATES[kabupaten];
      if (fallback) {
        finalCoords = fallback;
        console.log(`[LaporAduan Fallback] Menggunakan koordinat pusat Kabupaten ${kabupaten} karena GPS diblokir/gagal.`);
      } else {
        setError('Koordinat GPS lokasi diperlukan. Silakan pilih Kabupaten terlebih dahulu untuk fallback otomatis.');
        return;
      }
    }

    if (!honestyChecked) {
      setError('Anda wajib menyetujui Pakta Kejujuran sebelum mengirim aduan.');
      return;
    }

    try {
      await addAduan(
        foto,
        kategori,
        deskripsi,
        finalCoords.latitude,
        finalCoords.longitude,
        kabupaten,
        kecamatan,
        desa
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Gagal mengirim laporan aduan. Silakan coba kembali.');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md font-nunito animate-fade-slide">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-green-100 shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5ee] text-[#2d7a4f] rounded-full flex items-center justify-center mb-5 animate-bounce-subtle">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5px]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a4a30] mb-2 font-display">Aduan Berhasil Dikirim</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Terima kasih atas kepedulian Anda menjaga lingkungan desa adat Bali. <br/>
            Laporan Anda telah tercatat dan segera diinvestigasi oleh petugas DLH setempat.
          </p>
          <div className="w-full bg-[#f5faf7] border border-[#e8f5ee] rounded-xl p-3 mt-5 flex items-center justify-center gap-2 text-xs font-bold text-[#2d7a4f] animate-pulse">
            <Sparkles className="w-4 h-4" /> Mengalihkan kembali...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-nunito animate-backdrop-fade overflow-y-auto">
      {/* Click Outside Overlay */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium-lg border border-brand-primary/10 flex flex-col max-h-[85vh] md:max-h-[90vh] overflow-hidden my-auto animate-modal-content">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-brand-light flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-brand-orange stroke-[2.2px] animate-pulse" />
            <h2 className="text-lg font-bold text-brand-dark font-display">Aduan Sampah Lingkungan</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-brand-light text-brand-textSecondary transition-all cursor-pointer border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex border-b border-brand-light px-5 shrink-0 bg-brand-light/10">
          <button
            type="button"
            onClick={() => setActiveTab('lapor')}
            className={`flex-1 py-3 text-xs font-bold text-center border-0 border-b-2 transition-all cursor-pointer bg-transparent flex items-center justify-center gap-1.5 ${
              activeTab === 'lapor'
                ? 'border-brand-primary text-brand-primary font-black'
                : 'border-transparent text-brand-textSecondary hover:text-brand-dark font-bold'
            }`}
          >
            <Camera className="w-4 h-4" /> Lapor Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-3 text-xs font-bold text-center border-0 border-b-2 transition-all cursor-pointer bg-transparent flex items-center justify-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'border-brand-primary text-brand-primary font-black'
                : 'border-transparent text-brand-textSecondary hover:text-brand-dark font-bold'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Riwayat Laporan
            {aduanList.length > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-brand-primary/10 text-brand-primary rounded-full shrink-0">
                {aduanList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'lapor' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
            
            {/* Error / Fallback Alert Box */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-brand-orange rounded-r-xl text-xs font-bold text-brand-orange flex items-start gap-2.5 animate-bounce-subtle">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-brand-orange" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Ambil Foto (Kamera / File) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block">1. Ambil Foto Bukti Sampah</label>
              
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-brand-light shadow-sm aspect-video group">
                  <img src={previewUrl} alt="Preview Aduan" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all border-none cursor-pointer"
                    title="Hapus Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2 text-center text-[10px] text-white font-bold backdrop-blur-xs">
                    Foto Sukses Dimuat (Siap dikompresi otomatis)
                  </div>
                </div>
              ) : (
                <label 
                  htmlFor="aduan-foto"
                  className="flex flex-col items-center justify-center p-8 bg-brand-light/40 border-2 border-dashed border-brand-primary/20 rounded-2xl hover:border-brand-primary cursor-pointer transition-all active:scale-[0.99] text-center"
                >
                  <div className="w-12 h-12 bg-white text-brand-primary rounded-2xl flex items-center justify-center shadow-sm mb-3">
                    <Camera className="w-6 h-6 stroke-[2.2px]" />
                  </div>
                  <span className="text-xs font-bold text-brand-dark">Ketuk untuk Ambil Foto / Kamera</span>
                  <span className="text-[10px] text-brand-textSecondary mt-1">Gunakan kamera belakang ponsel Anda</span>
                </label>
              )}

              <input
                type="file"
                id="aduan-foto"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={submitting}
              />
            </div>

            {/* 2. Pilih Kategori Isu */}
            <div className="space-y-2">
              <label htmlFor="aduan-kategori" className="text-xs font-bold text-brand-dark uppercase tracking-wider block">2. Kategori Pelanggaran Lingkungan</label>
              <select
                id="aduan-kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-4 py-2.5 bg-brand-light/40 border border-brand-light rounded-xl font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer text-xs"
                disabled={submitting}
              >
                <option value="tumpukan_liar">Sampah Menumpuk di Jalan / Liar</option>
                <option value="tps_penuh">TPS Penuh / Tidak Terangkut</option>
                <option value="pembakaran_terbuka">Pembakaran Sampah Terbuka</option>
                <option value="sungai_tercemar">Pembuangan Sampah Liar ke Sungai</option>
              </select>
            </div>

            {/* Lokasi Isu Kejadian */}
            <div className="space-y-3 p-4 bg-brand-light/35 border border-brand-primary/5 rounded-2xl">
              <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block flex items-center gap-1">
                <MapPin className="w-4 h-4 text-brand-primary" /> Lokasi Kejadian Isu
              </span>
              
              <div className="space-y-1.5">
                <label htmlFor="aduan-kabupaten" className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Kabupaten/Kota (Wajib)</label>
                <select
                  id="aduan-kabupaten"
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-brand-light rounded-xl font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer text-xs"
                  disabled={submitting}
                >
                  <option value="">-- Pilih Kabupaten --</option>
                  {BALI_REGENCY_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="aduan-kecamatan" className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Kecamatan (Opsional)</label>
                  <input
                    type="text"
                    id="aduan-kecamatan"
                    placeholder="Kecamatan..."
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-brand-light rounded-xl font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-xs"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="aduan-desa" className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Desa/Kelurahan (Opsional)</label>
                  <input
                    type="text"
                    id="aduan-desa"
                    placeholder="Desa..."
                    value={desa}
                    onChange={(e) => setDesa(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-brand-light rounded-xl font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-xs"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* 3. Deskripsi & Patokan Tambahan */}
            <div className="space-y-2">
              <label htmlFor="aduan-deskripsi" className="text-xs font-bold text-brand-dark uppercase tracking-wider block">3. Deskripsi & Detail Patokan Lokasi</label>
              <textarea
                id="aduan-deskripsi"
                placeholder="Contoh: Depan warung makan, sebelah pohon beringin banjar kaja..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-brand-light/40 border border-brand-light rounded-xl font-medium text-brand-dark text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all resize-none"
                disabled={submitting}
              />
            </div>

            {/* 4. Lokasi GPS Geotagging */}
            <div className="bg-brand-light/30 border border-brand-primary/5 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-brand-primary shrink-0 stroke-[2.2px] animate-bounce-subtle" />
                <div>
                  <p className="font-bold text-brand-dark">Geotagging GPS Lokasi</p>
                  <p className="text-[10px] text-brand-textSecondary mt-0.5">
                    {coords 
                      ? `Koordinat: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (Terkunci)`
                      : gpsFailed
                      ? 'GPS gagal terdeteksi (Gunakan Kabupaten untuk fallback)'
                      : 'Mendeteksi titik koordinat Anda...'}
                  </p>
                </div>
              </div>
              {gpsLoading ? (
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={getGPSLocation}
                  className="px-2.5 py-1.5 bg-white border border-brand-light hover:bg-brand-light text-brand-primary font-bold rounded-lg transition-all active:scale-95 cursor-pointer text-xs"
                  disabled={submitting}
                >
                  Pindai Ulang
                </button>
              )}
            </div>

            {/* 5. Pakta Komitmen Kejujuran (Honesty Oath) */}
            <div className="p-4 bg-orange-50/70 border-l-4 border-brand-orange rounded-r-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brand-orange shrink-0 stroke-[2.2px]" />
                <div>
                  <p className="text-xs font-bold text-brand-orange uppercase tracking-wider leading-none">Pakta Kejujuran Warga Bali</p>
                  <p className="text-[10px] text-brand-textSecondary mt-1 leading-normal">
                    Demi kebersihan alam Bali dan efisiensi petugas di lapangan, warga wajib menjamin keaslian dan kejujuran dari aduan foto yang dikirimkan.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none text-[11px] font-semibold text-brand-dark bg-white border border-brand-orange/20 rounded-xl p-2.5 hover:bg-orange-50/20 active:scale-[0.99] transition-all">
                <input
                  type="checkbox"
                  checked={honestyChecked}
                  onChange={(e) => setHonestyChecked(e.target.checked)}
                  className="mt-0.5 accent-brand-orange rounded cursor-pointer w-4 h-4 shrink-0"
                  disabled={submitting}
                />
                <span className="leading-tight">
                  Saya bersumpah dan berjanji aduan ini jujur, akurat, dan terjadi di lokasi saya saat ini. Saya bersedia menerima pembatasan akun jika terbukti sengaja memanipulasi aduan fiktif.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || gpsLoading}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed border-none text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengompresi & Mengunggah...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Kirim Aduan Sekarang
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* TAB RIWAYAT LAPORAN (Opsi C) */
          <div className="flex-1 overflow-y-auto p-5 bg-[#F9FBF9] space-y-3.5 scrollbar-none">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
                <p className="text-xs text-brand-textSecondary font-bold">Membaca riwayat aduan Anda...</p>
              </div>
            ) : aduanList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary mb-4 shadow-sm border border-brand-primary/5">
                  <ClipboardList className="w-7 h-7 stroke-[1.8px]" />
                </div>
                <h3 className="text-sm font-black text-brand-dark mb-1">Belum Ada Aduan Lingkungan</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed max-w-xs">
                  Semua aduan sampah yang Anda laporkan akan tercatat di sini lengkap dengan status investigasi dari DLH.
                </p>
                <button
                  onClick={() => setActiveTab('lapor')}
                  className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-md shadow-brand-primary/15 hover:bg-brand-primary/95 transition-all active:scale-95 cursor-pointer mt-5 border-none flex items-center justify-center gap-1"
                >
                  <Camera className="w-4 h-4" /> Lapor Aduan Pertama
                </button>
              </div>
            ) : (
              aduanList.map((item) => {
                const isExpanded = expandedId === item.id;
                const date = new Date(item.created_at);
                
                // Styling Badge Status
                let badgeClass = 'bg-amber-50 text-amber-600 border-amber-200';
                let statusLabel = 'Baru';
                if (item.status === 'proses') {
                  badgeClass = 'bg-blue-50 text-blue-600 border-blue-200';
                  statusLabel = 'Diatensi Petugas';
                } else if (item.status === 'selesai') {
                  badgeClass = 'bg-green-50 text-green-700 border-green-200';
                  statusLabel = 'Selesai Bersih';
                }

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl transition-all duration-300 shadow-premium overflow-hidden ${
                      isExpanded 
                        ? 'border-brand-primary ring-1 ring-brand-primary/10' 
                        : 'border-brand-light hover:border-brand-primary/20'
                    }`}
                  >
                    {/* Header Card (Selalu Terlihat) */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl border border-brand-light/80 overflow-hidden shrink-0 bg-brand-light/30 relative">
                          <img src={item.foto_url} alt="Aduan" className="w-full h-full object-cover" />
                          {item.isOffline && (
                            <span className="absolute inset-0 bg-black/55 text-[8px] text-brand-orange font-black flex items-center justify-center text-center leading-none">Lokal</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-brand-dark leading-tight">
                            {KATEGORI_LABELS[item.kategori] || item.kategori}
                          </h4>
                          <p className="text-[10px] text-brand-textSecondary mt-1 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-brand-textMuted" />
                            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {item.isOffline && <span className="text-[9px] font-extrabold text-brand-orange bg-orange-50 px-1.5 py-0.5 rounded border border-brand-orange/20 ml-1">Belum Sinkron</span>}
                          </p>
                          <p className="text-[10px] text-brand-textMuted mt-1 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-brand-textMuted" /> {item.kabupaten}{item.kecamatan && `, Kec. ${item.kecamatan}`}{item.desa && `, Desa ${item.desa}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${badgeClass}`}>
                          {statusLabel}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-brand-textSecondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-brand-textSecondary" />
                        )}
                      </div>
                    </div>

                    {/* Detail Card (Terbuka saat Diklik) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1.5 border-t border-brand-light/75 bg-brand-light/10 space-y-4 animate-fade-slide text-xs">
                        
                        {/* 1. Foto Full Preview */}
                        <div>
                          <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1.5">Foto Bukti Kerusakan Lingkungan</span>
                          <div className="rounded-xl overflow-hidden border border-brand-light/70 max-h-56">
                            <img src={item.foto_url} alt="Aduan Bukti" className="w-full object-cover max-h-56" />
                          </div>
                        </div>

                        {/* 2. Deskripsi Laporan */}
                        {item.deskripsi && (
                          <div>
                            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1">Deskripsi Warga</span>
                            <p className="text-xs font-semibold text-brand-dark leading-relaxed bg-white border border-brand-light/50 p-3 rounded-xl shadow-xs">
                              "{item.deskripsi}"
                            </p>
                          </div>
                        )}

                        {/* 3. Koordinat GPS */}
                        <div className="flex items-center gap-2 text-[10px] text-brand-textSecondary bg-white border border-brand-light/40 rounded-xl p-2.5 shadow-xs">
                          <MapPin className="w-4.5 h-4.5 text-brand-primary shrink-0" />
                          <span>
                            Koordinat Satelit: <span className="font-extrabold text-brand-dark">{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</span>
                          </span>
                        </div>

                        {/* 4. Bagian Bukti Selesai Petugas DLH */}
                        {item.status === 'selesai' && (
                          <div className="p-3.5 bg-green-50 border border-green-200/60 rounded-xl space-y-3 shadow-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 stroke-[2.5px]" />
                              <span className="text-xs font-extrabold text-[#1a4a30] uppercase tracking-wide">Laporan Dinyatakan Selesai</span>
                            </div>
                            
                            <p className="text-xs font-medium text-[#2d7a4f] leading-normal bg-white/70 border border-green-100 p-2.5 rounded-lg">
                              "Petugas DLH / TPS3R setempat telah menindaklanjuti laporan Anda dan area tersebut telah dibersihkan secara tuntas. Terima kasih atas kontribusi aktif Anda menjaga alam Bali! Matur suksma."
                            </p>

                            {item.foto_selesai_url && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-[#2d7a4f] uppercase tracking-wider block">Foto Bukti Jalan Bersih Petugas:</span>
                                <div className="rounded-lg overflow-hidden border border-green-200/50 max-h-48">
                                  <img src={item.foto_selesai_url} alt="Bukti Selesai Bersih" className="w-full object-cover max-h-48" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}


