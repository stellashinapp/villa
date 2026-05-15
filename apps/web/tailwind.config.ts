import type { Config } from 'tailwindcss';
import { tailwindTheme } from '@villatolk/shared';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: tailwindTheme,
  },
  plugins: [],
};

export default config;
