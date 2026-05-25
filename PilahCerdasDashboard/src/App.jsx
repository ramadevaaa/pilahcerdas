import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/login');

  useEffect(() => {
    const handleHashChange = () => {
      // Set hash default jika kosong
      if (!window.location.hash) {
        window.location.hash = '#/login';
      }
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Trigger inisialisasi hash saat load
    if (!window.location.hash) {
      window.location.hash = '#/login';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Simple Hash Routing Logic
  const renderRoute = () => {
    switch (currentHash) {
      case '#/login':
        return <Login />;
      case '#/dashboard':
        return (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        );
      default:
        // Fallback: Arahkan ke login jika hash tidak dikenal
        window.location.hash = '#/login';
        return <Login />;
    }
  };

  return (
    <div className="min-h-screen text-brand-dark bg-brand-bg font-sans animate-fade-slide antialiased">
      {renderRoute()}
    </div>
  );
}
