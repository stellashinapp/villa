/**
 * 빌라톡 디자인 토큰 — 색·간격·radius·typography
 *
 * 모든 웹 앱(admin-web, web/PWA, landing)이 이 파일을 단일 출처로 사용.
 * 모바일(React Native)은 별도 StyleSheet 이지만 색상 값은 여기와 동일하게 유지.
 *
 * tailwind.config.ts 가 이 파일을 import 해서 theme.extend.colors 등에 spread.
 */

// ─── 색상 ─────────────────────────────────────────────────────────────
export const colors = {
  // surface
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8EBF0',
  border2: '#D1D5DB',
  divider: '#F0F2F6',

  // 텍스트 계층
  t1: '#1A1D26', // 본문
  t2: '#6B7280', // 보조
  t3: '#9CA3AF', // 약함

  // primary (모바일·웹 통일)
  pri: '#4263E8',
  priL: 'rgba(66,99,232,.08)',
  priT: '#2A43A8',

  // semantic
  ok: '#2ECC71',
  okL: 'rgba(46,204,113,.1)',
  warn: '#F39C12',
  warnL: 'rgba(243,156,18,.1)',
  err: '#E74C3C',
  errL: 'rgba(231,76,60,.1)',

  // 본사 콘솔 사이드바 (다크 네이비)
  navy: '#1B2A4A',
  sidebarBg: '#1B2A4A',
  sidebarSurface: '#213560',
  sidebarBorder: '#2E4A7A',
  sidebarText: '#B0BED0',
  sidebarTextMuted: '#7889A5',
  sidebarTextActive: '#FFFFFF',
} as const;

// ─── radius·shadow ────────────────────────────────────────────────────
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const shadows = {
  card: '0 1px 4px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)',
  elevated: '0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
  primary: '0 8px 20px rgba(66,99,232,0.20)',
} as const;

// ─── typography ───────────────────────────────────────────────────────
// tailwind 가 string[] (mutable) 을 요구해서 as const 안 함
export const fontFamily: Record<string, string[]> = {
  sans: ['var(--font-noto)', 'system-ui', '-apple-system', 'sans-serif'],
};

// ─── tailwind 용 통합 export ──────────────────────────────────────────
export const tailwindTheme = {
  colors: { ...colors },
  fontFamily,
  boxShadow: { ...shadows },
  borderRadius: {
    DEFAULT: radius.md,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    full: radius.full,
  },
};
