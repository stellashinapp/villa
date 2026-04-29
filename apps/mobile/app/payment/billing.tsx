import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildBillingHtml, issueBillingKeyOnServer } from '@/lib/payment';

export default function BillingScreen() {
  const params = useLocalSearchParams<{ adminId?: string; customerName?: string }>();
  const [loading, setLoading] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const adminId = params.adminId ?? '';
  const customerKey = adminId || `guest_${Date.now()}`;
  const customerName = params.customerName ?? '관리자';

  const html = buildBillingHtml({ customerKey, customerName });

  async function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'fail') {
        Alert.alert('카드 등록 실패', msg.message ?? '취소되었습니다');
        router.back();
      }
    } catch {}
  }

  async function handleNavChange(navState: { url: string }) {
    const url = navState.url;
    if (url.includes('/billing-success')) {
      const parsed = new URL(url);
      const authKey = parsed.searchParams.get('authKey');
      const customerKeyFromUrl = parsed.searchParams.get('customerKey');
      if (authKey && customerKeyFromUrl && adminId) {
        setLoading(true);
        try {
          const result = await issueBillingKeyOnServer({
            authKey,
            customerKey: customerKeyFromUrl,
            adminId,
          });
          Alert.alert(
            '카드 등록 완료',
            `${result.cardBrand ?? ''} ****${result.cardLast4 ?? ''} 카드로 매월 자동 결제됩니다`,
            [{ text: '확인', onPress: () => router.back() }]
          );
        } catch (err) {
          Alert.alert('등록 실패', String(err));
          router.back();
        } finally {
          setLoading(false);
        }
      } else if (!adminId) {
        Alert.alert('오류', '관리자 정보가 없습니다');
        router.back();
      }
    } else if (url.includes('/billing-fail')) {
      const parsed = new URL(url);
      const message = parsed.searchParams.get('message') ?? '취소되었습니다';
      Alert.alert('카드 등록 실패', message);
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>정기결제 카드 등록</Text>
      </View>
      <WebView
        ref={webviewRef}
        source={{ html, baseUrl: 'https://villatolk.app' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onNavigationStateChange={handleNavChange}
        style={{ flex: 1 }}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3454D1" />
          <Text style={styles.loaderText}>카드 등록 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 15, color: '#3454D1', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1D26' },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#1A1D26' },
});
