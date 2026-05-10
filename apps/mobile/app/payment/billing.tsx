import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildBillingHtml, issueBillingKeyOnServer } from '@/lib/payment';
import { syncAdminFromSupabase } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import { store, notify } from '@/lib/store';
import { showToast } from '@/lib/toast';

const IS_WEB = Platform.OS === 'web';

// 토스 실연동 전 임시 — Edge Function (register-dummy-card) 을 호출해서
// service_role 로 INSERT/UPDATE. RLS 와 무관하게 안정 동작.
// 함수 내부에서 JWT 의 auth.user 를 검증해 admin_id 를 직접 도출하므로
// 클라가 임의의 adminId 를 보낼 수 없음(권한 안전).
// 응답에 새 subscription 을 포함시켜 client 가 store 를 즉시 갱신 — 게이트
// 가 redirect 직후 SELECT 가 못 따라잡아 다시 billing 으로 튕기는 문제 방지.
async function registerDummyCard() {
  const { data, error } = await supabase.functions.invoke('register-dummy-card', {
    body: {},
  });
  if (error) {
    // FunctionsHttpError 는 본문(JSON.error) 을 함께 노출
    let detail = error.message;
    try {
      const ctx: any = (error as any).context;
      if (ctx?.json?.error) detail = ctx.json.error;
    } catch {}
    throw new Error(detail);
  }
  if (data && data.error) {
    throw new Error(data.error);
  }

  // 함수 응답 기반으로 store 직접 갱신 — sync 의 SELECT 가 RLS/타이밍 이슈로
  // 못 잡아도 게이트가 통과하도록 안전망.
  const sub = (data as any)?.subscription;
  if (sub) {
    store.subscription = {
      status: sub.status,
      cardBrand: sub.card_brand ?? '',
      cardLast4: sub.card_last4 ?? '',
      billingDay: sub.billing_day ?? 1,
      nextBilling: sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('ko-KR') : '',
      startDate: sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString('ko-KR') : '',
    };
    notify();
  }
}

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

  async function handleDummyRegister() {
    console.log('[handleDummyRegister] click — adminId(param)=', adminId);
    setLoading(true);
    try {
      await registerDummyCard();
      try { await syncAdminFromSupabase(); } catch (e) { console.warn('[handleDummyRegister] sync failed', e); }
      showToast('더미 카드 등록 완료 — 홈으로 이동합니다', 'success', 3000);
      // Alert.alert 의 onPress 가 웹에서 안 불리는 이슈 회피 — 직접 라우팅
      if (fromSignup) {
        router.replace('/(admin)/home');
      } else {
        router.back();
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error('[handleDummyRegister] FAILED:', msg, err);
      showToast(`등록 실패: ${msg}`, 'error', 8000);
    } finally {
      setLoading(false);
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

      {/* 임시: 토스 실연동 전 더미 카드 등록 — 큰 버튼으로 노출 */}
      <View style={styles.dummyBar}>
        <Text style={styles.dummyBarTitle}>🛠 임시 모의 카드 등록</Text>
        <Text style={styles.dummyBarSub}>
          토스페이먼츠 실연동 전입니다. 더미 카드로 가입을 완료하세요.
        </Text>
        <TouchableOpacity
          style={[styles.dummyBarBtn, loading && { opacity: 0.5 }]}
          disabled={loading}
          onPress={handleDummyRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.dummyBarBtnText}>
            {loading ? '처리 중…' : '더미 카드로 등록 완료'}
          </Text>
        </TouchableOpacity>
      </View>

      {!IS_WEB && (
        <View style={styles.tossPreviewLabel}>
          <Text style={styles.tossPreviewLabelText}>아래는 토스페이먼츠 실연동 미리보기 (참고용)</Text>
        </View>
      )}

      {IS_WEB ? (
        // 웹 미리보기: react-native-webview 가 안정적이지 않고 iframe 도 토스 페이지가
        // 모바일 폭에 맞춰져 있어 데스크탑에서는 레이아웃이 깨짐. 디자인 검증용
        // 기능이라기보단 더미 등록만 가이드.
        <View style={styles.webNoticeWrap}>
          <View style={styles.webNoticeIcon}>
            <Text style={{ fontSize: 28 }}>📱</Text>
          </View>
          <Text style={styles.webNoticeTitle}>토스페이먼츠 실연동은 모바일 앱 전용</Text>
          <Text style={styles.webNoticeBody}>
            웹 미리보기에서는 카드 등록 폼을 정상적으로 표시할 수 없습니다.{'\n'}
            테스트하려면 위의 <Text style={{ color: '#F59E0B', fontWeight: '900' }}>더미 카드로 등록 완료</Text> 버튼을 사용해주세요.{'\n\n'}
            실제 카드 등록은 EAS 빌드된 모바일 앱(iOS / Android)에서만 가능합니다.
          </Text>
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
  dummyBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    gap: 8,
  },
  dummyBarTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#92400E',
  },
  dummyBarSub: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    marginBottom: 4,
  },
  dummyBarBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dummyBarBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  tossPreviewLabel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F5F6FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  tossPreviewLabelText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  iframeWrap: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    overflow: 'hidden',
  },
  webNoticeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F5F6FA',
  },
  webNoticeIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  webNoticeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1D26',
    marginBottom: 12,
    textAlign: 'center',
  },
  webNoticeBody: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
