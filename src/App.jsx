import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLog } from './hooks/useLog';
import { useCommunity } from './hooks/useCommunity';
import { BottomNav } from './components/layout/BottomNav';
import { Sidebar } from './components/layout/Sidebar';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { CatatPilah } from './pages/CatatPilah';
import { Simulator } from './pages/Simulator';
import { Komunitas } from './pages/Komunitas';
import { AlurSampah } from './pages/AlurSampah';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const ONBOARDED_KEY = 'pilah_onboarded';

function AppContent() {
  const { user, profile, isGuest, loading: authLoading, logout } = useAuth();
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');
  const [activeTab, setActiveTab] = useState('home');
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'

  const { logs, loading, syncing, regency, saveRegency, addLog, deleteLog } = useLog();
  const { stats, regencyStats, loading: communityLoading } = useCommunity();

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
  };

  // Scroll ke atas saat ganti tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // 1. Loading State Autentikasi
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5faf7] flex flex-col justify-center items-center font-nunito">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#e8f5ee] border-t-[#2d7a4f] rounded-full animate-spin" />
          <div className="absolute text-[#2d7a4f] font-bold text-xs uppercase tracking-wider animate-pulse">Pilah</div>
        </div>
        <p className="text-gray-500 text-sm mt-4 font-semibold">Memeriksa Sesi Warga...</p>
      </div>
    );
  }

  // 2. Jika belum login dan bukan tamu, tampilkan layar masuk/daftar
  if (!user && !isGuest) {
    if (authScreen === 'register') {
      return <Register onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return <Login onNavigateToRegister={() => setAuthScreen('register')} />;
  }

  // 3. Onboarding Screen (hanya untuk tamu/guest yang belum onboard)
  // Warga terdaftar (profile !== null) langsung dilewatkan karena kabupaten sudah tercatat di database profil.
  if (!onboarded && !profile) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        saveRegency={saveRegency}
      />
    );
  }

  // 4. Guest Mode Block Tab (Overlay Gate)
  const isTabBlocked = isGuest && (activeTab === 'catat' || activeTab === 'komunitas');

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sync Indicator */}
      {syncing && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
          <div className="h-full bg-brand-primary animate-pulse rounded-b-full" />
        </div>
      )}

      {/* Sidebar Navigation (Visible on Tablet/Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        regency={profile ? profile.kabupaten : (regency || 'Belum Memilih')}
      />

      {/* Main Page Layout Wrapper */}
      <div className="flex-1 md:pl-64 min-w-0 pb-20 md:pb-0">
        
        {/* Main Content Area */}
        <main key={activeTab} className="animate-fade-slide relative min-h-screen">
          
          {/* Guest Block Overlay */}
          {isTabBlocked && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-40 flex items-center justify-center p-6 font-nunito">
              <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-green-100 shadow-2xl text-center animate-fade-slide">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 text-[#e05c2a] rounded-2xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1a4a30] mb-3">Fitur Warga Terdaftar 🔒</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Pencatatan sampah harian dan kontribusi ke Dashboard Komunitas dibatasi hanya untuk <strong>Warga Terdaftar</strong>.<br/><br/>
                  Hal ini dilakukan demi menjaga keaslian data pemilahan sampah di Bali agar valid dan kredibel.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={logout}
                    className="w-full py-3.5 bg-[#2d7a4f] hover:bg-[#1a4a30] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-green-900/5 active:scale-[0.98]"
                  >
                    Daftar Akun Sekarang
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-full py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-500 font-bold rounded-2xl transition-all cursor-pointer bg-transparent"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab Pages */}
          {activeTab === 'home' && (
            <Home
              logs={isGuest ? [] : logs} // Tamu tidak bisa melihat riwayat log karena kosong/tidak ada
              regency={profile ? profile.kabupaten : regency}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'catat' && !isGuest && (
            <CatatPilah
              onAddLog={addLog}
              onBack={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'simulator' && (
            <Simulator />
          )}

          {activeTab === 'komunitas' && !isGuest && (
            <Komunitas
              stats={stats}
              regencyStats={regencyStats}
              loading={communityLoading}
            />
          )}

          {activeTab === 'alur' && (
            <AlurSampah />
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation (Visible on Mobile) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />
    </div>
  );
}

// Wrapper to export with global AuthProvider context access
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
