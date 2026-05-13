import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F6FA',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E8EBF0',
        t1: '#1A1D26',
        t2: '#6B7280',
        t3: '#9CA3AF',
        pri: '#4263E8',
        priL: 'rgba(66,99,232,.08)',
        priT: '#2A43A8',
        ok: '#2ECC71',
        okL: 'rgba(46,204,113,.1)',
        warn: '#F39C12',
        warnL: 'rgba(243,156,18,.1)',
        err: '#E74C3C',
        errL: 'rgba(231,76,60,.1)',
        navy: '#1B2A4A',
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
