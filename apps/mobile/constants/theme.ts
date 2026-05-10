// ==============================
// Figma 디자인 기준 컬러 시스템
// ==============================

// 관리자 다크 테마
export const adminTheme = {
  // 배경
  bg: '#1B2A4A',
  bgDark: '#152238',
  surface: '#213560',
  card: '#243B6A',
  cardBorder: '#2E4A7A',

  // 텍스트
  text: '#FFFFFF',
  textSecondary: '#B0BED0',
  textMuted: '#7889A5',

  // Primary
  primary: '#4263E8',
  primaryLight: '#4A6AE5',
  primaryBg: 'rgba(52,84,209,0.12)',

  // 상태
  ok: '#2ECC71',
  okBg: 'rgba(46,204,113,0.12)',
  warn: '#F39C12',
  warnBg: 'rgba(243,156,18,0.12)',
  err: '#E74C3C',
  errBg: 'rgba(231,76,60,0.12)',
  accent: '#FF6B35',
  accentBg: 'rgba(255,107,53,0.12)',

  // 입력
  inputBg: '#1E3258',
  inputBorder: '#2E4A7A',

  // 기타
  divider: '#2E4A7A',
  shadow: 'rgba(0,0,0,0.2)',
} as const;

// 입주민 라이트 테마
export const residentTheme = {
  // 배경
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E8EBF0',

  // 텍스트
  text: '#1A1D26',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Primary
  primary: '#4263E8',
  primaryLight: '#E8EEFB',
  primaryDark: '#2A43A8',

  // 상태
  ok: '#2ECC71',
  okBg: '#E8F8F0',
  warn: '#F39C12',
  warnBg: '#FEF6E6',
  err: '#E74C3C',
  errBg: '#FDE8E8',
  accent: '#FF6B35',
  accentBg: '#FFF0EA',

  // 입력
  inputBg: '#F8F9FC',
  inputBorder: '#E8EBF0',

  // 히어로
  heroStart: '#1B2A4A',
  heroEnd: '#4263E8',

  // 기타
  divider: '#E8EBF0',
  shadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)',
} as const;

// 공통
export const common = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 100,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    hero: 28,
  },
} as const;
