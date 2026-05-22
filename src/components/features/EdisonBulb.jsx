import React from 'react';
import { Zap } from 'lucide-react';

export function EdisonBulb({ active = false, percentage = 0, hours = 0 }) {
  // Pijar warna kuning emas neon
  const glowStyle = active
    ? {
        filter: 'drop-shadow(0 0 15px rgba(245, 166, 35, 0.8)) drop-shadow(0 0 30px rgba(245, 166, 35, 0.4))',
        stroke: '#f5a623',
        transition: 'all 1s ease-in-out',
      }
    : {
        stroke: '#666666',
        transition: 'all 0.5s ease-in-out',
      };

  const glassStyle = active
    ? {
        fill: 'rgba(245, 166, 35, 0.08)',
        stroke: '#f5a623',
        filter: 'drop-shadow(0 0 8px rgba(245, 166, 35, 0.2))',
        transition: 'all 1s ease-in-out',
      }
    : {
        fill: 'rgba(255, 255, 255, 0.03)',
        stroke: '#aaaaaa',
        transition: 'all 0.5s ease-in-out',
      };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full">
      {/* Lightbulb Container */}
      <div className="relative w-48 h-64 flex items-center justify-center">
        {/* Soft Ambient Radial Glow Behind */}
        {active && (
          <div 
            className="absolute inset-0 rounded-full bg-brand-yellow/10 blur-3xl opacity-80 animate-pulse"
            style={{ transition: 'all 1s ease-in-out' }}
          />
        )}

        {/* High-Fidelity SVG Edison Bulb */}
        <svg 
          viewBox="0 0 100 120" 
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Light Rays */}
          {active && (
            <g className="animate-pulse" style={{ transformOrigin: '50px 50px' }}>
              <line x1="50" y1="12" x2="50" y2="2" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="22" y1="28" x2="14" y2="20" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="12" y1="56" x2="2" y2="56" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="78" y1="28" x2="86" y2="20" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="88" y1="56" x2="98" y2="56" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </g>
          )}

          {/* Outer Glass Shape */}
          <path
            d="M50 16 
               C68 16 78 28 78 50 
               C78 64 70 72 65 79 
               L65 89 
               C65 91 63 93 61 93 
               L39 93 
               C37 93 35 91 35 89 
               L35 79 
               C30 72 22 64 22 50 
               C22 28 32 16 50 16 Z"
            style={glassStyle}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Filament Base Supports */}
          <line x1="42" y1="93" x2="44" y2="68" stroke="#888888" strokeWidth="1.5" />
          <line x1="58" y1="93" x2="56" y2="68" stroke="#888888" strokeWidth="1.5" />

          {/* Glowing Filament Loop (Edison style) */}
          <path
            d="M44 68 
               C44 56 47 48 50 48 
               C53 48 56 56 56 68"
            fill="none"
            className={active ? 'glow-bulb' : ''}
            style={glowStyle}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sparkles / Electric center arc */}
          {active && (
            <path
              d="M48 55 L52 51 L48 47 L52 43"
              fill="none"
              stroke="#e8f5ee"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}

          {/* Metallic Cap Base */}
          <rect x="38" y="93" width="24" height="6" rx="2" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
          
          {/* Thread ridges */}
          <line x1="39" y1="96" x2="61" y2="96" stroke="#9ca3af" strokeWidth="1.5" />
          <line x1="40" y1="99" x2="60" y2="99" stroke="#9ca3af" strokeWidth="1.5" />
          <line x1="41" y1="102" x2="59" y2="102" stroke="#9ca3af" strokeWidth="1.5" />
          
          {/* Black bottom contact point */}
          <path d="M43 105 C43 109 57 109 57 105 Z" fill="#374151" />
        </svg>

        {/* Small Lightning Indicator badge inside the bulb center if active */}
        {active && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-yellow text-brand-dark p-1.5 rounded-full shadow-md animate-bounce">
            <Zap className="w-4 h-4 fill-brand-dark stroke-brand-dark" />
          </div>
        )}
      </div>

      {/* Energy impact text */}
      <div className="text-center mt-4 max-w-xs">
        <h3 className={`text-2xl font-bold tracking-tight ${active ? 'text-brand-yellow' : 'text-brand-textMuted'}`}>
          {active ? `≈ ${hours.toFixed(0)} Jam Menyala` : '0 Jam Menyala'}
        </h3>
        <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
          {active 
            ? `Bagus sekali! Log sampah anorganikmu sukses menyalakan lampu LED 8W ini.` 
            : 'Masukkan sampah anorganik untuk menghidupkan cahaya bohlam.'}
        </p>
      </div>
    </div>
  );
}
