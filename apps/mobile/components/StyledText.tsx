import { Text as RNText, TextProps, StyleSheet } from 'react-native';

// 전역 Noto Sans KR 폰트 적용
// 사용법: import { Text } from '@/components/StyledText';
export function Text(props: TextProps) {
  const fontWeight = StyleSheet.flatten(props.style)?.fontWeight;

  let fontFamily = 'NotoSansKR_400Regular';
  if (fontWeight === '500' || fontWeight === 500) fontFamily = 'NotoSansKR_500Medium';
  if (fontWeight === '600' || fontWeight === 600) fontFamily = 'NotoSansKR_700Bold';
  if (fontWeight === '700' || fontWeight === 700) fontFamily = 'NotoSansKR_700Bold';
  if (fontWeight === '800' || fontWeight === 800) fontFamily = 'NotoSansKR_900Black';
  if (fontWeight === '900' || fontWeight === 900) fontFamily = 'NotoSansKR_900Black';
  if (fontWeight === 'bold') fontFamily = 'NotoSansKR_700Bold';

  return <RNText {...props} style={[{ fontFamily }, props.style]} />;
}
