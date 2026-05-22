import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-pilahcerdas.svg'],
      manifest: {
        name: 'PilahCerdas — Terangi Bali dengan Sampahmu',
        short_name: 'PilahCerdas',
        description: 'Aplikasi edukasi pemilahan sampah berbasis dampak energi listrik PSEL Pesanggaran di Bali.',
        theme_color: '#1a4a30',
        background_color: '#f5faf7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'logo-pilahcerdas.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'logo-pilahcerdas.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
