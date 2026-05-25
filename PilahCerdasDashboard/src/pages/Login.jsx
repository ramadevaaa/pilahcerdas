import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { KeyRound, Mail, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card'; // Reusing root design Card

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Mohon masukkan email dan password.');
      return;
    }

    setLoading(true);
    setError('');

    // 1. Jika Supabase tidak dikonfigurasi, gunakan Mode Demo Lokal
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        if (email.toLowerCase() === 'admin' && password === 'admin') {
          localStorage.setItem('pilah_admin_logged_in', 'true');
          window.location.hash = '/dashboard';
        } else {
          setError('Email/Username atau Password salah. (Gunakan "admin" & "admin" untuk mode demo).');
        }
        setLoading(false);
      }, 600);
      return;
    }

    // 2. Jika Supabase dikonfigurasi, jalankan login auth
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (data.session) {
        window.location.hash = '/dashboard';
      }
    } catch (e) {
      setError(e.message || 'Waduh, gagal masuk. Periksa kembali email dan sandi Anda!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg px-5 py-12 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-white border border-brand-light rounded-3xl flex items-center justify-center mx-auto shadow-premium animate-pulse-slow">
            <img src="/logo.svg" alt="PilahCerdas Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-brand-dark font-display tracking-tight mt-3">
            Pilah<span className="text-brand-primary">Cerdas</span> Portal Admin
          </h1>
          <p className="text-xs text-brand-textSecondary">
            Sistem Informasi Pengelolaan Sampah Dinas Lingkungan Hidup Bali
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-brand-light rounded-3xl p-6 sm:p-8 shadow-premium-lg">
          <h2 className="text-base font-extrabold text-brand-dark mb-4 text-center">Masuk ke Dashboard</h2>
          
          {error && (
            <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl px-4 py-3 mb-4 animate-fade-slide">
              <p className="text-xs text-brand-orange font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </p>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="bg-[#FFFDF9] border border-brand-yellow/30 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
              <p className="text-[11px] text-brand-textSecondary leading-normal font-semibold">
                <strong className="text-brand-dark block text-[10px] uppercase tracking-wider mb-0.5">Mode Demo Offline Aktif</strong>
                Supabase belum terhubung. Masuk instan dengan mengisi **Username: admin** & **Password: admin**.
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1.5">Email / Username</label>
              <div className="relative flex items-center bg-[#F9FBF9] border border-brand-light rounded-2xl px-4 h-12">
                <Mail className="w-4.5 h-4.5 text-brand-primary/60 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder={isSupabaseConfigured ? "nama@badungkab.go.id" : "admin"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-sm font-bold text-brand-dark focus:outline-none w-full placeholder:text-brand-textMuted placeholder:font-normal border-0"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block mb-1.5">Kata Sandi</label>
              <div className="relative flex items-center bg-[#F9FBF9] border border-brand-light rounded-2xl px-4 h-12">
                <KeyRound className="w-4.5 h-4.5 text-brand-primary/60 shrink-0 mr-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-sm font-bold text-brand-dark focus:outline-none w-full placeholder:text-brand-textMuted placeholder:font-normal border-0"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary/10 disabled:opacity-50 disabled:pointer-events-none mt-6"
            >
              {loading ? 'Menghubungkan...' : 'Masuk Sistem'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-brand-textSecondary text-center leading-normal max-w-xs mx-auto">
          Portal khusus terenkripsi untuk staff Dinas Lingkungan Hidup Badung, Denpasar Raya, dan pengurus Banjar TPS3R Bali.
        </p>
      </div>
    </div>
  );
}
