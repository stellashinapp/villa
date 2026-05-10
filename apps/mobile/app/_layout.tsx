import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text as RNText, View, StyleSheet, TextProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import { initI18n } from '@/lib/i18n';
import ToastHost from '@/components/ToastHost';

// 전역 Text 컴포넌트 오버라이드 - 모든 Text에 Pretendard 자동 적용
const originalRender = (RNText as any).render;
if (originalRender && !(RNText as any).__patched) {
  (RNText as any).render = function(props: TextProps, ref: any) {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const fw = flatStyle.fontWeight;

    // fontWeight 1:1 매핑 (Pretendard 9 weights)
    let fontFamily = 'Pretendard-Regular';
    if (fw === '100' || fw === 100) fontFamily = 'Pretendard-Thin';
    if (fw === '200' || fw === 200) fontFamily = 'Pretendard-ExtraLight';
    if (fw === '300' || fw === 300) fontFamily = 'Pretendard-Light';
    if (fw === '400' || fw === 400 || !fw) fontFamily = 'Pretendard-Regular';
    if (fw === '500' || fw === 500) fontFamily = 'Pretendard-Medium';
    if (fw === '600' || fw === 600) fontFamily = 'Pretendard-SemiBold';
    if (fw === '700' || fw === 700 || fw === 'bold') fontFamily = 'Pretendard-Bold';
    if (fw === '800' || fw === 800) fontFamily = 'Pretendard-ExtraBold';
    if (fw === '900' || fw === 900) fontFamily = 'Pretendard-Black';

    return originalRender.call(this, { ...props, style: [{ fontFamily }, props.style] }, ref);
  };
  (RNText as any).__patched = true;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Thin': require('pretendard/dist/public/static/Pretendard-Thin.otf'),
    'Pretendard-ExtraLight': require('pretendard/dist/public/static/Pretendard-ExtraLight.otf'),
    'Pretendard-Light': require('pretendard/dist/public/static/Pretendard-Light.otf'),
    'Pretendard-Regular': require('pretendard/dist/public/static/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('pretendard/dist/public/static/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('pretendard/dist/public/static/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('pretendard/dist/public/static/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('pretendard/dist/public/static/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('pretendard/dist/public/static/Pretendard-Black.otf'),
  });

  const [i18nReady, setI18nReady] = useState(false);
  useEffect(() => { initI18n().then(() => setI18nReady(true)); }, []);

  if (!fontsLoaded || !i18nReady) {
    return (
      <View style={s.loading}>
        <RNText style={s.loadingText}>로딩 중...</RNText>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(resident)" />
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { fontSize: 16, color: '#6B7280' },
});
