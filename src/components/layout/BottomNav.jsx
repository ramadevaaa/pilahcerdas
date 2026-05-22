import React from 'react';
import { Home, Sliders, Plus, Users, Map } from 'lucide-react';

export function BottomNav({ activeTab, onChangeTab }) {
  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'catat', label: 'Catat', icon: Plus, isCenter: true },
    { id: 'komunitas', label: 'Komunitas', icon: Users },
    { id: 'alur', label: 'Alur Sampah', icon: Map }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center px-4 pb-6 pointer-events-none">
      {/* Floating glassmorphic nav container */}
      <nav className="flex items-center justify-between w-full max-w-md h-20 px-6 bg-white/80 backdrop-blur-xl border border-brand-primary/10 rounded-4xl shadow-premium-lg pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-6 flex items-center justify-center w-16 h-16 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-full shadow-lg shadow-brand-primary/30 transition-all duration-200 active:scale-90 hover:scale-105 active:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-primary/20 border-0 cursor-pointer"
                aria-label="Catat Sampah Baru"
              >
                <Plus className={`w-8 h-8 transition-transform duration-300 ${activeTab === 'catat' ? 'rotate-45' : ''}`} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full focus:outline-none transition-all bg-transparent border-0 p-0 cursor-pointer"
            >
              <div
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-brand-primary scale-105 font-bold'
                    : 'text-brand-textSecondary/60 hover:text-brand-primary/70'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                <span className="text-[10px] mt-1 font-semibold tracking-wide">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
