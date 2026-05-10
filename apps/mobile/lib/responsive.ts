import { Dimensions, PixelRatio } from 'react-native';

// 기준 디자인 너비 — Figma 기본 (390 = iPhone 14 일반)
const BASELINE_WIDTH = 390;
// 작은 폰 (SE 1세대 등)에서 글자가 너무 작아지지 않도록 하한
const MIN_SCALE = 0.88;
// 폴더블/태블릿에서 너무 커지지 않도록 상한
const MAX_SCALE = 1.18;

function getRawScale() {
  const { width } = Dimensions.get('window');
  return width / BASELINE_WIDTH;
}

/**
 * 화면 너비에 맞춘 가로 스케일.
 * 패딩·여백·아이콘 크기 등에 사용.
 */
export function scale(size: number): number {
  const ratio = Math.min(MAX_SCALE, Math.max(MIN_SCALE, getRawScale()));
  return Math.round(size * ratio);
}

/**
 * 글꼴 크기 전용 스케일.
 * fontScale(접근성: 시스템 글자 크기 설정) 도 함께 반영.
 */
export function fontScale(size: number): number {
  const ratio = Math.min(MAX_SCALE, Math.max(MIN_SCALE, getRawScale()));
  const scaled = size * ratio;
  // PixelRatio.roundToNearestPixel — 안드로이드/iOS 모두에서 일관된 픽셀 정렬
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

/**
 * 작은 폰 여부 — 일부 레이아웃에서 분기용.
 */
export function isCompactWidth(): boolean {
  return Dimensions.get('window').width < 360;
}

/**
 * 폴더블·태블릿 등 큰 폰 여부.
 */
export function isWideWidth(): boolean {
  return Dimensions.get('window').width >= 600;
}
