import React, { useState } from 'react';
import { Leaf, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BALI_REGENCY_LIST } from '../lib/constants';

export function Onboarding({ onComplete, saveRegency }) {
  const [selectedRegency, setSelectedRegency] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!selectedRegency) {
      setError('Silakan pilih kabupaten asal Anda terlebih dahulu.');
      return;
    }
    saveRegency(selectedRegency);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center px-4 py-8 md:py-16">
      <div className="w-full max-w-md bg-white md:shadow-premium md:border md:border-brand-primary/5 md:rounded-4xl p-6 md:p-10 flex flex-col justify-between min-h-[85vh] md:min-h-0 md:space-y-8">
        {/* Upper Logo / Title */}
        <div className="flex flex-col items-center mt-2">
          <img src="/logo-pilahcerdas.svg" alt="PilahCerdas Logo" className="w-16 h-16 rounded-3xl shadow-premium mb-3" />
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight font-display">
            Pilah<span className="text-brand-primary">Cerdas</span>
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1 font-semibold tracking-wider uppercase">
            Waste-To-Energy PWA Bali
          </p>
        </div>

        {/* Center Premium Illustration (glowing leaf e-bulb vector style) */}
        <div className="w-full flex flex-col items-center my-4">
          <div className="relative w-44 h-44 flex items-center justify-center bg-[#F9FBF9] border border-brand-light rounded-full shadow-premium p-4">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-2xl animate-pulse" />
            
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e8f5ee" />
                  <stop offset="100%" stopColor="#2d7a4f" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Minimalist plant silhouette inside glowing energy frame */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#leafG)" strokeWidth="2.5" filter="url(#glow)" className="map-breath" />
              <path d="M50 78 C50 78 50 35 50 25 C50 25 35 45 35 55 C35 65 42 70 50 70 Z" fill="url(#leafG)" filter="url(#glow)" opacity="0.85" />
              <path d="M50 78 C50 78 50 35 50 25 C50 25 65 45 65 55 C65 65 58 70 50 70 Z" fill="#2d7a4f" opacity="0.95" />
              <circle cx="50" cy="22" r="3" fill="#f5a623" filter="url(#glow)" />
            </svg>
          </div>

          <div className="text-center mt-6">
            <h2 className="text-lg font-bold text-brand-dark leading-snug">
              Energi baik dimulai dari <br /> dapur rumah tangga.
            </h2>
            <p className="text-xs text-brand-textSecondary mt-2 px-2 leading-relaxed">
              Membantu memilah sampah harian Anda sesuai regulasi SE Bupati Bali dan menerangi malam Bali lewat konversi listrik bersih PSEL.
            </p>
          </div>
        </div>

        {/* Bottom Setup Panel */}
        <div className="w-full flex flex-col gap-4">
          {/* Regency Selection Card */}
          <Card className="flex flex-col gap-3" padding="sm">
            <label className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider flex items-center px-1">
              <MapPin className="w-3.5 h-3.5 text-brand-primary mr-1 stroke-[2.5px]" />
              Kabupaten Asal Anda
            </label>
            <div className="relative">
              <select
                value={selectedRegency}
                onChange={(e) => {
                  setSelectedRegency(e.target.value);
                  setError('');
                }}
                className="w-full h-12 px-4 bg-[#F9FBF9] border border-brand-light rounded-2xl text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer"
              >
                <option value="" disabled>Pilih Kabupaten/Kota...</option>
                {BALI_REGENCY_LIST.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-textSecondary/60">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            {error && (
              <p className="text-xs text-brand-orange font-semibold mt-1 px-1">
                {error}
              </p>
            )}
          </Card>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            fullWidth
            size="lg"
            className="flex items-center justify-center gap-1 shadow-lg shadow-brand-primary/10"
          >
            Mulai Memilah
            <ChevronRight className="w-5 h-5 mt-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
