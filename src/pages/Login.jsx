import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login({ onNavigateToRegister }) {
  const { loginWarga, loginAsGuest } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Waduh, nomor HP dan password harus diisi ya! 🙏');
      return;
    }

    if (phone.length < 10) {
      setError('Nomor HP kayaknya kurang lengkap deh. Coba cek lagi 📱');
      return;
    }

    setLoading(true);
    try {
      await loginWarga(phone, password);
      // AuthContext otomatis meng-update state dan memicu re-render di App.jsx
    } catch (err) {
      console.error('Eror saat warga login:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.includes('Invalid login credentials') || 
        errMsg.toLowerCase().includes('credentials') || 
        errMsg.toLowerCase().includes('invalid') ||
        errMsg.toLowerCase().includes('grant')
      ) {
        setError('Nomor HP atau password-mu salah. Cek lagi ya! 🧐');
      } else {
        setError(errMsg || 'Gagal masuk. Pastikan koneksi internet aktif ya 🙏');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden font-nunito">
      {/* Background Decorative Circles */}
      <div className="absolute w-64 h-64 bg-[#e8f5ee] rounded-full -top-12 -left-12 filter blur-3xl opacity-60 animate-pulse" />
      <div className="absolute w-80 h-80 bg-[#e3f2fd] rounded-full -bottom-16 -right-16 filter blur-3xl opacity-60 animate-pulse" />

      {/* Login Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-green-900/5 p-8 border border-[#e8f5ee]/80 relative z-10 animate-fade-slide">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e8f5ee] mb-4 text-[#2d7a4f]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a4a30] tracking-tight">PilahCerdas v2.0</h1>
          <p className="text-sm text-gray-500 mt-1">Energi baik dimulai dari dapur rumah tangga</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-[#e05c2a] rounded-r-xl text-sm text-[#e05c2a] flex items-start gap-2.5 animate-bounce-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-sm font-semibold text-[#1a4a30] mb-1.5">Nomor Handphone</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f5faf7] border border-[#e8f5ee] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] focus:bg-white text-gray-800 transition-all font-medium"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-semibold text-[#1a4a30]">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Masukkan password akunmu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f5faf7] border border-[#e8f5ee] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2d7a4f] focus:bg-white text-gray-800 transition-all font-medium"
                disabled={loading}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-4 bg-[#2d7a4f] hover:bg-[#1a4a30] text-white font-bold rounded-2xl shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sedang Masuk...</span>
              </>
            ) : (
              <span>Masuk ke Akun</span>
            )}
          </button>
        </form>

        {/* Guest Option Separator */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="absolute px-4 bg-white text-xs text-gray-400 font-semibold uppercase tracking-wider">Atau</span>
        </div>

        {/* Guest Access Button */}
        <button
          onClick={loginAsGuest}
          className="w-full py-3.5 border-2 border-gray-200 hover:border-[#2d7a4f] hover:text-[#2d7a4f] text-gray-500 font-bold rounded-2xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 bg-transparent"
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Masuk sebagai Tamu</span>
        </button>

        {/* Register Redirection Link */}
        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          Belum punya akun warga?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-[#2d7a4f] hover:underline font-bold bg-transparent border-none cursor-pointer"
            disabled={loading}
          >
            Daftar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
