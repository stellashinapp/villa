import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildBillingHtml, issueBillingKeyOnServer } from '@/lib/payment';
import { syncAdminFromSupabase } from '@/lib/sync';

const IS_WEB = Platform.OS === 'web';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
      {IS_WEB ? (
        // 웹 미리보기: react-native-webview 의 web 쉼이 안정적이지 않아 iframe 직접 사용.
        // postMessage 통신은 native 환경 전용이라 웹에서는 토스 카드등록 UI 만 보여줌.
        // 디자인 검증/플로우 확인용. 실제 결제는 모바일 앱에서만 동작.
        <View style={{ flex: 1 }}>
          <iframe
            srcDoc={html}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' } as object}
            title="TossPayments billing"
          />
          {__DEV__ && (
            <View style={styles.devBypass}>
              <Text style={styles.devBypassNote}>
                ⚠️ 웹 미리보기 — 실제 카드 등록은 모바일 앱에서만 가능합니다
              </Text>
              <TouchableOpacity
                style={styles.devBypassBtn}
                onPress={() => {
                  Alert.alert(
                    '테스트 모드',
                    '카드 등록을 건너뛰고 홈으로 이동합니다. (실제 결제 미완료)',
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '건너뛰기',
                        onPress: () => {
                          if (fromSignup) router.replace('/(admin)/home');
                          else router.back();
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={styles.devBypassBtnText}>테스트: 건너뛰고 홈으로</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ html, baseUrl: 'https://villatolk.app' }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          onNavigationStateChange={handleNavChange}
          // 결제 완료/실패 redirect URL 은 WebView 가 실제 로드하지 못하도록 가로챈다
          // (villatolk.app 미등록 도메인이라 WebView 가 직접 로드하면 에러 페이지가 뜸).
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.includes('/billing-success') || req.url.includes('/billing-fail')) {
              handleNavChange({ url: req.url });
              return false;
            }
            return true;
          }}
          style={{ flex: 1 }}
        />
      )}
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
  devBypass: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(255,247,237,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    gap: 8,
  },
  devBypassNote: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
  devBypassBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  devBypassBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
