import type { CapacitorConfig } from '@capacitor/cli';

// 빌라톡 — PWA(app.villtalk.store)를 감싸는 iOS/Android 네이티브 셸.
// server.url 로 라이브 PWA 를 로드하고, 푸시/스플래시 등은 네이티브 플러그인으로 처리.
const config: CapacitorConfig = {
  appId: 'store.villtalk.app',
  appName: '빌라톡',
  webDir: 'capacitor-www', // 폴백(오프라인/초기 로딩) — 실제 화면은 server.url 에서 로드
  server: {
    url: 'https://app.villtalk.store',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#F5F6FA',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F5F6FA',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
