import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text as RNText, View, StyleSheet, TextProps } from 'react-native';
import {
  useFonts,
  NotoSansKR_100Thin,
  NotoSansKR_300Light,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import React, { useEffect, useState } from 'react';
import { initI18n } from '@/lib/i18n';

// 전역 Text 컴포넌트 오버라이드 - 모든 Text에 Noto Sans KR 자동 적용
const originalRender = (RNText as any).render;
if (originalRender && !(RNText as any).__patched) {
  (RNText as any).render = function(props: TextProps, ref: any) {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const fw = flatStyle.fontWeight;

    // 전체적으로 한 단계 낮은 굵기 적용
    let fontFamily = 'NotoSansKR_300Light';
    if (fw === '100' || fw === 100) fontFamily = 'NotoSansKR_100Thin';
    if (fw === '300' || fw === 300) fontFamily = 'NotoSansKR_100Thin';
    if (fw === '400' || fw === 400 || !fw) fontFamily = 'NotoSansKR_300Light';
    if (fw === '500' || fw === 500) fontFamily = 'NotoSansKR_400Regular';
    if (fw === '600' || fw === 600 || fw === 'bold') fontFamily = 'NotoSansKR_500Medium';
    if (fw === '700' || fw === 700) fontFamily = 'NotoSansKR_500Medium';
    if (fw === '800' || fw === 800) fontFamily = 'NotoSansKR_700Bold';
    if (fw === '900' || fw === 900) fontFamily = 'NotoSansKR_700Bold';

    return originalRender.call(this, { ...props, style: [{ fontFamily }, props.style] }, ref);
  };
  (RNText as any).__patched = true;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_100Thin,
    NotoSansKR_300Light,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_900Black,
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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(resident)" />
      </Stack>
    </>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { fontSize: 16, color: '#6B7280' },
});
