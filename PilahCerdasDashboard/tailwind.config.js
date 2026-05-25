/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2d7a4f',    /* Hijau Utama */
          dark: '#1a4a30',       /* Hijau Gelap */
          light: '#e8f5ee',      /* Hijau Muda */
          bg: '#f5faf7',         /* Background Halaman */
          yellow: '#f5a623',     /* Kuning Aksi */
          orange: '#e05c2a',     /* Oranye Alert */
          textPrimary: '#1a4a30',
          textSecondary: '#666666',
          textMuted: '#aaaaaa',
        },
        sampah: {
          organik: '#4CAF50',
          organikLight: '#E8F5E9',
          anorganik: '#2196F3',
          anorganikLight: '#E3F2FD',
          residu: '#9E9E9E',
          residuLight: '#F5F5F5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'premium': '0 10px 40px rgba(45, 122, 79, 0.04)',
        'premium-lg': '0 20px 50px rgba(45, 122, 79, 0.08)',
      }
    },
  },
  plugins: [],
};
