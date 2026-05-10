import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { buildBillingHtml, issueBillingKeyOnServer } from '@/lib/payment';
import { syncAdminFromSupabase } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

const IS_WEB = Platform.OS === 'web';

// 토스 실연동 전 임시 — subscription 에 더미 카드 정보 입력해서 바로 active 로 전환.
// nextBilling 은 trial_ends_at 또는 30일 후로 잡는다.
async function registerDummyCard(adminId: string) {
  console.log('[dummyCard] start adminId=', adminId);
  const now = Date.now();
  const periodStart = new Date(now);
  const periodEnd = new Date(now + 30 * 24 * 60 * 60 * 1000);

  // 1) 기존 trialing/active/past_due 구독 찾아 update
  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({
      card_brand: '더미카드',
      card_last4: '0000',
      billing_key: `DUMMY_${adminId}_${now}`,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('admin_id', adminId)
    .in('status', ['trialing', 'active', 'past_due'])
    .select();

  if (error) {
    console.error('[dummyCard] update error:', error);
    throw new Error(`구독 업데이트 실패: ${error.message}`);
  }
  console.log('[dummyCard] updated rows:', updated?.length ?? 0);

  // 2) update 된 row 가 0 이면 신규 INSERT — 구독이 아예 없는 케이스
  if (!updated || updated.length === 0) {
    console.log('[dummyCard] no existing subscription, inserting new');
    const { error: insErr } = await supabase.from('subscriptions').insert({
      admin_id: adminId,
      status: 'active',
      billing_day: 1,
      card_brand: '더미카드',
      card_last4: '0000',
      billing_key: `DUMMY_${adminId}_${now}`,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
    if (insErr) {
      console.error('[dummyCard] insert error:', insErr);
      throw new Error(`구독 INSERT 실패: ${insErr.message}`);
    }
  }
  console.log('[dummyCard] done');
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
    console.log('[handleDummyRegister] click — adminId=', adminId);
    if (!adminId) {
      showToast('관리자 정보가 없습니다. 다시 로그인해주세요.', 'error', 6000);
      return;
    }
    setLoading(true);
    try {
      await registerDummyCard(adminId);
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
          disabled={loading || !adminId}
          onPress={handleDummyRegister}
          activeOpacity={0.85}
        >
          <Text style={styles.dummyBarBtnText}>
            {loading ? '처리 중…' : '더미 카드로 등록 완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tossPreviewLabel}>
        <Text style={styles.tossPreviewLabelText}>아래는 토스페이먼츠 실연동 미리보기 (참고용)</Text>
      </View>

      {IS_WEB ? (
        // 웹: iframe 으로 토스 폼 보여주기. 실제 등록은 위쪽 더미 버튼으로.
        <View style={styles.iframeWrap}>
          <iframe
            srcDoc={html}
            style={{ border: 'none', width: '100%', height: '100%', display: 'block' } as object}
            title="TossPayments billing"
          />
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
});
