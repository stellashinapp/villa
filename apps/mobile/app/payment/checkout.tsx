import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildCheckoutHtml, confirmPaymentOnServer } from '@/lib/payment';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount?: string;
    orderId?: string;
    orderName?: string;
    customerName?: string;
    paymentId?: string;
  }>();
  const [loading, setLoading] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const amount = parseInt(params.amount ?? '0', 10);
  const orderId = params.orderId ?? `order_${Date.now()}`;
  const orderName = params.orderName ?? '결제';
  const customerName = params.customerName ?? '고객';
  const paymentId = params.paymentId;

  const html = buildCheckoutHtml({ amount, orderId, orderName, customerName });

  async function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'fail') {
        Alert.alert('결제 실패', msg.message ?? '결제가 취소되었습니다');
        router.back();
      }
    } catch {}
  }

  async function handleNavChange(navState: { url: string }) {
    const url = navState.url;
    if (url.includes('/success')) {
      const parsed = new URL(url);
      const paymentKey = parsed.searchParams.get('paymentKey');
      const orderIdFromUrl = parsed.searchParams.get('orderId');
      const amountFromUrl = parsed.searchParams.get('amount');
      if (paymentKey && orderIdFromUrl && amountFromUrl) {
        setLoading(true);
        try {
          await confirmPaymentOnServer({
            paymentKey,
            orderId: orderIdFromUrl,
            amount: parseInt(amountFromUrl, 10),
            paymentId,
          });
          Alert.alert('결제 완료', '정상적으로 결제되었습니다', [
            { text: '확인', onPress: () => router.back() },
          ]);
        } catch (err) {
          Alert.alert('승인 실패', String(err));
          router.back();
        } finally {
          setLoading(false);
        }
      }
    } else if (url.includes('/fail')) {
      const parsed = new URL(url);
      const message = parsed.searchParams.get('message') ?? '결제가 취소되었습니다';
      Alert.alert('결제 실패', message);
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>결제하기</Text>
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
          <ActivityIndicator size="large" color="#4263E8" />
          <Text style={styles.loaderText}>결제 승인 중...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 15, color: '#4263E8', fontWeight: '600' },
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
