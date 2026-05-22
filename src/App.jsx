import { useState, useEffect } from 'react';
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

const ONBOARDED_KEY = 'pilah_onboarded';

function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true');
  const [activeTab, setActiveTab] = useState('home');

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

  // Onboarding Screen
  if (!onboarded) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        saveRegency={saveRegency}
      />
    );
  }

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
        regency={regency}
      />

      {/* Main Page Layout Wrapper */}
      <div className="flex-1 md:pl-64 min-w-0">
        {/* Active Page */}
        <main key={activeTab} className="animate-fade-slide">
          {activeTab === 'home' && (
            <Home
              logs={logs}
              regency={regency}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'catat' && (
            <CatatPilah
              onAddLog={addLog}
              onBack={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'simulator' && (
            <Simulator />
          )}

          {activeTab === 'komunitas' && (
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

export default App;
