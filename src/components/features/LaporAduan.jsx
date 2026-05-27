import React, { useState, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, ShieldCheck, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAduan } from '../../hooks/useAduan';
import { Card } from '../ui/Card';

export function LaporAduan({ onClose }) {
  const { addAduan, submitting } = useAduan();
  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [kategori, setKategori] = useState('tumpukan_liar');
  const [deskripsi, setDeskripsi] = useState('');
  const [coords, setCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [honestyChecked, setHonestyChecked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Ambil lokasi GPS otomatis saat komponen pertama kali termuat
  useEffect(() => {
    getGPSLocation();
  }, []);

  const getGPSLocation = () => {
    setGpsLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Ponsel/Browser Anda tidak mendukung deteksi lokasi GPS otomatis.');
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
        console.warn(err);
        setError('Gagal mendeteksi koordinat GPS. Mohon nyalakan izin lokasi GPS di ponsel Anda.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
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
      setError('Mohon ambil/unggah foto bukti sampah terlebih dahulu 📸');
      return;
    }
    if (!coords) {
      setError('Koordinat lokasi GPS diperlukan. Mohon nyalakan GPS ponsel Anda 📍');
      return;
    }
    if (!honestyChecked) {
      setError('Anda wajib menyetujui Pakta Kejujuran sebelum mengirim aduan 🛡️');
      return;
    }

    try {
      await addAduan(
        foto,
        kategori,
        deskripsi,
        coords.latitude,
        coords.longitude
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
          <h2 className="text-xl font-bold text-[#1a4a30] mb-2 font-display">Aduan Berhasil Dikirim! 🎉</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Terima kasih atas kepedulian Anda menjaga lingkungan desa adat Bali. <br/>
            Laporan Anda telah tercatat dan segera diinvestigasi oleh pengelola DLH / TPS3R setempat.
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
            <h2 className="text-lg font-bold text-brand-dark font-display">Lapor Aduan Lingkungan</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-brand-light text-brand-textSecondary transition-all cursor-pointer border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          
          {/* Error Alert Box */}
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs font-bold text-red-600 flex items-start gap-2.5 animate-bounce-subtle">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
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
              <option value="tumpukan_liar">Sampah Menumpuk di Jalan / Liar ⚠️</option>
              <option value="tps_penuh">TPS Penuh / Tidak Terangkut 🚚</option>
              <option value="pembakaran_terbuka">Pembakaran Sampah Terbuka 💨</option>
              <option value="sungai_tercemar">Pembuangan Sampah Liar ke Sungai 🌊</option>
            </select>
          </div>

          {/* 3. Deskripsi & Patokan Tambahan */}
          <div className="space-y-2">
            <label htmlFor="aduan-deskripsi" className="text-xs font-bold text-brand-dark uppercase tracking-wider block">3. Deskripsi & Detail Patokan Lokasi</label>
            <textarea
              id="aduan-deskripsi"
              placeholder="Contoh: Depan warung makan nasi jinggo, sebelah pohon beringin banjar kaja..."
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
                className="px-2.5 py-1.5 bg-white border border-brand-light hover:bg-brand-light text-brand-primary font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                disabled={submitting}
              >
                Pindai Ulang
              </button>
            )}
          </div>

          {/* 5. Pakta Komitmen Kejujuran / Kontra-Spam (Honesty Oath) */}
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
                Saya bersumpah/berjanji aduan ini **jujur, akurat, & terjadi di lokasi saya** saat ini. Saya bersedia menerima pembatasan akun jika terbukti sengaja memanipulasi aduan fiktif.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || gpsLoading}
              className="w-full h-12 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mengompresi & Mengunggah...
                </>
              ) : (
                <>
                  Kirim Aduan Sekarang 🚀
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
