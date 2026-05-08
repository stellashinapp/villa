import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1f63e9',
          dark: '#0f2242',
          darker: '#1e3b73',
          accent: '#3d54ff',
          light: '#f1f6ff',
          soft: '#f3f7ff',
          softer: '#f8fbff',
          tint: '#b9cbf4',
        },
        ink: {
          DEFAULT: '#0f2242',
          900: '#0f2242',
          800: '#242d3d',
          600: '#5b6d8f',
          500: '#7c7e83',
          400: '#4d5f82',
          200: '#c4cee3',
          100: '#e3e8f4',
        },
        line: '#ebebeb',
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'var(--font-noto)',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
