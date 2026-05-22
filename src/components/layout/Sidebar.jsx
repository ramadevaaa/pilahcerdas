import React from 'react';
import { Home, Sliders, Plus, Users, Map, Leaf } from 'lucide-react';

export function Sidebar({ activeTab, onChangeTab, regency }) {
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
            src="/logo-pilahcerdas.svg" 
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
        {regency && (
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
