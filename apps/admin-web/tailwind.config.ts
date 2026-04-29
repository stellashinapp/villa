import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F5F6FA',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E8EBF0',
        border2: '#D1D5DB',
        t1: '#1A1D26',
        t2: '#6B7280',
        t3: '#9CA3AF',
        pri: '#3454D1',
        priL: 'rgba(52,84,209,.08)',
        priT: '#2A43A8',
        ok: '#2ECC71',
        okL: 'rgba(46,204,113,.1)',
        warn: '#F39C12',
        warnL: 'rgba(243,156,18,.1)',
        err: '#E74C3C',
        errL: 'rgba(231,76,60,.1)',
        sidebarBg: '#1B2A4A',
        sidebarSurface: '#213560',
        sidebarBorder: '#2E4A7A',
        sidebarText: '#B0BED0',
        sidebarTextMuted: '#7889A5',
        sidebarTextActive: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
