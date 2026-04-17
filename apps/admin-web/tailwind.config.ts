import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        surface: '#12161F',
        card: '#181D2A',
        border: '#1E2433',
        border2: '#2A3144',
        t1: '#F0F2F5',
        t2: '#9CA3B4',
        t3: '#5C6478',
        pri: '#6C5CE7',
        priL: 'rgba(108,92,231,.12)',
        priT: '#B8B0F0',
        ok: '#00D68F',
        okL: 'rgba(0,214,143,.1)',
        warn: '#FFAA00',
        warnL: 'rgba(255,170,0,.1)',
        err: '#FF6B6B',
        errL: 'rgba(255,107,107,.1)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
