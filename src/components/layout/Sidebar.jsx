import React from 'react';
import { Home, Sliders, Plus, Users, Map, Leaf, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ activeTab, onChangeTab, regency }) {
  const { profile, isGuest, logout } = useAuth();
  const tabs = [
    { id: 'catat', label: 'Catat Pilah', icon: Plus, isCTA: true },
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'komunitas', label: 'Komunitas', icon: Users },
    { id: 'alur', label: 'Alur Sampah', icon: Map }
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 h-screen bg-white border-r border-brand-primary/5 fixed left-0 top-0 z-50 py-8 px-5 shadow-premium">
      {/* Brand Header */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <img 
            src="/logo.svg" 
            alt="PilahCerdas Logo" 
            className="w-10 h-10 rounded-2xl shadow-premium shrink-0" 
          />
          <div>
            <h1 className="text-lg font-extrabold text-brand-dark leading-none font-display">
              Pilah<span className="text-brand-primary">Cerdas</span>
            </h1>
            <span className="text-[10px] text-brand-textSecondary font-bold tracking-wider uppercase">
              Bali Waste-To-Energy
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <nav className="flex flex-col gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isCTA) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`mb-3 w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 active:scale-[0.98] border-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand-dark text-white shadow-md shadow-brand-dark/20'
                      : 'bg-brand-primary text-white hover:bg-brand-primary/95 shadow-md shadow-brand-primary/10 hover:translate-y-[-1px]'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-3 w-full h-12 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border-0 bg-transparent cursor-pointer text-left ${
                  isActive
                    ? 'text-brand-primary bg-brand-light font-bold'
                    : 'text-brand-textSecondary/70 hover:text-brand-primary/80 hover:bg-brand-light/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Badge */}
      <div className="space-y-4 px-2">
        {profile ? (
          <div className="bg-[#f5faf7] border border-[#e8f5ee] rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-extrabold text-xs">
                {profile.nama_lengkap.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-brand-dark truncate leading-tight">{profile.nama_lengkap}</p>
                <p className="text-[9px] text-[#2d7a4f] font-bold uppercase mt-0.5 tracking-wider">Warga Terdaftar</p>
              </div>
            </div>
            
            <div className="text-[10px] text-brand-textSecondary font-semibold truncate bg-white px-2 py-1 rounded-lg border border-brand-light">
              📍 Desa {profile.desa}
            </div>

            <button
              onClick={() => {
                const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari akun warga?");
                if (confirmLogout) logout();
              }}
              className="w-full py-2 bg-red-50 hover:bg-red-100/70 text-red-600 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-red-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        ) : isGuest ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-400 text-white flex items-center justify-center font-extrabold text-xs">
                G
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-slate-700 truncate leading-tight">Pengunjung Tamu</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Tanpa Autentikasi</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full py-2 bg-brand-primary/10 hover:bg-brand-primary/15 text-brand-primary rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-brand-primary/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Daftar / Masuk
            </button>
          </div>
        ) : regency && (
          <div className="flex items-center gap-2 bg-brand-light/60 text-brand-primary text-xs font-bold px-3 py-2.5 rounded-2xl border border-brand-primary/5">
            <Leaf className="w-4 h-4 shrink-0 stroke-[2.5px]" />
            <span className="truncate">{regency}</span>
          </div>
        )}
        <div className="text-[10px] text-brand-textMuted font-semibold tracking-wide">
          © 2026 PilahCerdas
        </div>
      </div>
    </aside>
  );
}
