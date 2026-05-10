import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildBillingHtml, issueBillingKeyOnServer } from '@/lib/payment';
import { syncAdminFromSupabase } from '@/lib/sync';

export default function BillingScreen() {
  const params = useLocalSearchParams<{ adminId?: string; customerName?: string; fromSignup?: string }>();
  const [loading, setLoading] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const adminId = params.adminId ?? '';
  const customerKey = adminId || `guest_${Date.now()}`;
  const customerName = params.customerName ?? '관리자';
  const fromSignup = params.fromSignup === '1';

  const html = buildBillingHtml({ customerKey, customerName });

  // 성공 후에만 빠져나감
  function exitFlowAfterSuccess() {
    if (fromSignup) {
      router.replace('/(admin)/home');
    } else {
      router.back();
    }
  }

  // 취소/실패 시 — fromSignup은 못 빠져나감, 일반은 뒤로
  function exitFlowOnFailure() {
    if (fromSignup) {
      // 가입 플로우에서는 카드 등록을 완료해야만 진행 가능. 화면에 머무름.
      // WebView를 다시 로드해서 카드 등록을 재시도 가능하게 함
      webviewRef.current?.reload();
    } else {
      router.back();
    }
  }

  function handleCancel() {
    if (fromSignup) {
      Alert.alert(
        '카드 등록은 필수입니다',
        '무료체험을 시작하려면 카드 등록이 필요합니다.\n등록 후 30일 이내 해지하시면 요금이 청구되지 않습니다.',
        [{ text: '계속 등록', style: 'default' }],
      );
    } else {
      router.back();
    }
  }

  async function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'fail') {
        Alert.alert(
          '카드 등록 실패',
          (msg.message ?? '취소되었습니다') + (fromSignup ? '\n다시 시도해주세요.' : ''),
        );
        exitFlowOnFailure();
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
          // store에 변경된 subscription(active + 카드) 반영
          try { await syncAdminFromSupabase(); } catch {}
          Alert.alert(
            fromSignup ? '카드 등록 완료 — 무료체험 시작!' : '카드 등록 완료',
            `${result.cardBrand ?? ''} ****${result.cardLast4 ?? ''} 카드로 매월 자동 결제됩니다`,
            [{ text: '확인', onPress: exitFlowAfterSuccess }]
          );
        } catch (err) {
          Alert.alert('등록 실패', String(err) + (fromSignup ? '\n다시 시도해주세요.' : ''));
          exitFlowOnFailure();
        } finally {
          setLoading(false);
        }
      } else if (!adminId) {
        Alert.alert('오류', '관리자 정보가 없습니다');
        exitFlowOnFailure();
      }
    } else if (url.includes('/billing-fail')) {
      const parsed = new URL(url);
      const message = parsed.searchParams.get('message') ?? '취소되었습니다';
      Alert.alert(
        '카드 등록 실패',
        message + (fromSignup ? '\n다시 시도해주세요.' : ''),
      );
      exitFlowOnFailure();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {fromSignup ? (
          <View style={styles.signupBadge}>
            <Text style={styles.signupBadgeText}>가입 마지막 단계</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
            <Text style={styles.backText}>← 취소</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{fromSignup ? '카드 등록 (무료체험 시작)' : '정기결제 카드 등록'}</Text>
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
  backText: { fontSize: 15, color: '#4263E8', fontWeight: '600' },
  signupBadge: {
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  signupBadgeText: { fontSize: 12, color: '#4263E8', fontWeight: '700' },
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
