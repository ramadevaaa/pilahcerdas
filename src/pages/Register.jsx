import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import baliRegions from '../lib/bali_regions.json';

export function Register({ onNavigateToLogin }) {
  const { signUpWarga } = useAuth();
  
  // State Input Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State Alamat Berjenjang
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [banjar, setBanjar] = useState('');

  // Dropdown options lists
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Kabupaten list dari JSON keys
  const kabupatenList = Object.keys(baliRegions);

  // Trigger saat Kabupaten berubah
  useEffect(() => {
    if (selectedKabupaten) {
      const kecs = Object.keys(baliRegions[selectedKabupaten] || {});
      setKecamatanList(kecs);
    } else {
      setKecamatanList([]);
    }
    setSelectedKecamatan('');
    setSelectedDesa('');
  }, [selectedKabupaten]);

  // Trigger saat Kecamatan berubah
  useEffect(() => {
    if (selectedKabupaten && selectedKecamatan) {
      const desas = baliRegions[selectedKabupaten][selectedKecamatan] || [];
      setDesaList(desas);
    } else {
      setDesaList([]);
    }
    setSelectedDesa('');
  }, [selectedKabupaten, selectedKecamatan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi Form
    if (!fullName || !phone || !password || !confirmPassword || !selectedKabupaten || !selectedKecamatan || !selectedDesa || !banjar) {
      setError('Harap lengkapi semua isian formulir ya, jangan ada yang kosong! 🙏');
      return;
    }

    if (phone.length < 10) {
      setError('Nomor HP-mu kurang lengkap, silakan cek kembali 📱');
      return;
    }

    if (password.length < 6) {
      setError('Password-mu harus minimal 6 karakter demi keamanan ya! 🔒');
      return;
    }

    if (password !== confirmPassword) {
      setError('Sandi baru dan konfirmasi sandimu tidak cocok. Silakan disamakan 🔑');
      return;
    }

    setLoading(true);
    try {
      await signUpWarga(
        fullName.trim(),
        phone.trim(),
        selectedKabupaten,
        selectedKecamatan,
        selectedDesa,
        banjar.trim(),
        password
      );
      setSuccessMsg('Registrasi Berhasil! 🎉 Akun warga Anda telah aktif. Silakan masuk menggunakan nomor HP dan password Anda. Mengalihkan...');
      setError('');
      // Bersihkan seluruh formulir
      setFullName('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setSelectedKabupaten('');
      setSelectedKecamatan('');
      setSelectedDesa('');
      setBanjar('');
      
      // Dialihkan setelah 3.5 detik agar warga sempat membaca pesan sukses
      setTimeout(() => {
        onNavigateToLogin();
      }, 3500);
    } catch (err) {
      console.error(err);
      if (err.message.includes('unique_phone') || err.message.includes('profiles_no_telepon_key')) {
        setError('Nomor HP ini sudah terdaftar sebagai warga. Silakan langsung login 📱');
      } else if (err.message.includes('already registered')) {
        setError('Akun dengan nomor HP ini sudah terdaftar. Silakan login ya! 😊');
      } else {
        setError(err.message || 'Waduh, terjadi gangguan saat mendaftar. Silakan coba sesaat lagi 🙏');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-nunito">
      {/* Background Decorative Elements */}
      <div className="absolute w-72 h-72 bg-[#e8f5ee] rounded-full -top-16 -right-16 filter blur-3xl opacity-60 animate-pulse" />
      <div className="absolute w-80 h-80 bg-[#e3f2fd] rounded-full -bottom-24 -left-24 filter blur-3xl opacity-60 animate-pulse" />

      {/* Register Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-green-900/5 p-6 md:p-8 border border-[#e8f5ee]/80 relative z-10 animate-fade-slide my-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1a4a30] tracking-tight">Daftar Akun Warga</h1>
          <p className="text-sm text-gray-500 mt-1">Lengkapi data diri untuk mulai mencatat dan memilah sampah</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-[#e05c2a] rounded-r-xl text-sm text-[#e05c2a] flex items-start gap-2.5 animate-bounce-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-[#2d7a4f] rounded-r-xl text-sm text-[#2d7a4f] flex items-start gap-2.5 animate-fade-slide">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Informasi Personal */}
          <div className="bg-[#f5faf7]/50 p-4 rounded-2xl border border-[#e8f5ee]/60 space-y-4">
            <h2 className="text-xs font-bold text-[#2d7a4f] uppercase tracking-wider mb-2">1. Data Pribadi</h2>
            
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-[#1a4a30] mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                disabled={loading}
              />
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold text-[#1a4a30] mb-1">Nomor Handphone (WhatsApp)</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Section 2: Alamat Pengguna */}
          <div className="bg-[#f5faf7]/50 p-4 rounded-2xl border border-[#e8f5ee]/60 space-y-4">
            <h2 className="text-xs font-bold text-[#2d7a4f] uppercase tracking-wider mb-2">2. Lokasi Tempat Tinggal</h2>
            
            {/* Grid Alamat Berjenjang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kabupaten Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Kabupaten/Kota</label>
                <select
                  value={selectedKabupaten}
                  onChange={(e) => setSelectedKabupaten(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                  disabled={loading}
                >
                  <option value="">-- Pilih Kabupaten --</option>
                  {kabupatenList.map((kab) => (
                    <option key={kab} value={kab}>{kab}</option>
                  ))}
                </select>
              </div>

              {/* Kecamatan Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Kecamatan</label>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => setSelectedKecamatan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all disabled:opacity-60"
                  disabled={loading || !selectedKabupaten}
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {kecamatanList.map((kec) => (
                    <option key={kec} value={kec}>{kec}</option>
                  ))}
                </select>
              </div>

              {/* Desa Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Desa/Kelurahan</label>
                <select
                  value={selectedDesa}
                  onChange={(e) => setSelectedDesa(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all disabled:opacity-60"
                  disabled={loading || !selectedKecamatan}
                >
                  <option value="">-- Pilih Desa/Kelurahan --</option>
                  {desaList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Banjar Bebas Text */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Banjar Adat</label>
                <input
                  type="text"
                  placeholder="Contoh: Banjar Seseh / Kaja"
                  value={banjar}
                  onChange={(e) => setBanjar(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Keamanan */}
          <div className="bg-[#f5faf7]/50 p-4 rounded-2xl border border-[#e8f5ee]/60 space-y-4">
            <h2 className="text-xs font-bold text-[#2d7a4f] uppercase tracking-wider mb-2">3. Buat Sandi Keamanan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Buat Password</label>
                <input
                  type="password"
                  placeholder="Min 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                  disabled={loading}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#1a4a30] mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#e8f5ee] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] text-gray-800 text-sm font-medium transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 mt-2 bg-[#2d7a4f] hover:bg-[#1a4a30] text-white font-bold rounded-2xl shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sedang Mendaftarkan...</span>
              </>
            ) : (
              <span>Daftar & Mulai Pilah Sampah</span>
            )}
          </button>
        </form>

        {/* Login Redirection Link */}
        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          Sudah terdaftar sebagai warga?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-[#2d7a4f] hover:underline font-bold bg-transparent border-none cursor-pointer"
            disabled={loading}
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
