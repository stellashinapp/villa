/**
 * 다날 본인확인 (BARO) WebView 모달.
 *
 * 사용 흐름:
 *  1. 부모 화면에서 visible=true 로 설정
 *  2. 모달이 admin-web /api/danal/start 호출 → { tid, authUrl } 받음
 *  3. WebView 가 authUrl 로 이동 → 사용자가 통신3사 PASS / SMS 인증
 *  4. 인증 완료 후 다날 → /api/danal/callback 으로 redirect
 *  5. callback 페이지가 confirm API 결과를 postMessage 로 전달 → onSuccess 콜백 호출
 *
 * 다날 키 미발급 상태에서는 start API 가 500 을 반환하므로
 * 호출부에서 __DEV__ 일 때 "테스트 통과" 버튼을 별도로 제공할 것.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const DANAL_API_BASE =
  process.env.EXPO_PUBLIC_DANAL_API_BASE ??
  process.env.EXPO_PUBLIC_ADMIN_WEB_URL ??
  'https://admin.andnew.kr';

/**
 * 본인인증 강제 통과 모드 — 다날 키 발급 전 테스트용.
 * .env 의 EXPO_PUBLIC_BYPASS_PASS_AUTH=1 일 때 true.
 * 호출부에서 이 값이 true 면 모달을 띄우지 않고 즉시 onSuccess 호출 권장.
 * 출시 직전 .env 에서 0 또는 제거해야 정상 다날 본인확인 진행.
 */
export const PASS_AUTH_BYPASSED = process.env.EXPO_PUBLIC_BYPASS_PASS_AUTH === '1';

export type DanalAuthSuccess = {
  txSeq: string;
  tid: string;
  name: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F' | '';
  di: string;
  ci: string;
};

export interface DanalAuthModalProps {
  visible: boolean;
  onSuccess: (result: DanalAuthSuccess) => void;
  onCancel: () => void;
  onFail?: (reason: string) => void;
}

export default function DanalAuthModal({ visible, onSuccess, onCancel, onFail }: DanalAuthModalProps) {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) {
      setAuthUrl(null);
      setLoading(true);
      setError(null);
      handled.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${DANAL_API_BASE}/api/danal/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`${res.status} ${body.slice(0, 200)}`);
        }
        const { authUrl: url } = (await res.json()) as { authUrl: string; tid: string; txSeq: string };
        if (cancelled) return;
        setAuthUrl(url);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '다날 본인확인 시작 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  function handleMessage(e: WebViewMessageEvent) {
    if (handled.current) return;
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; payload: { ok: boolean } & DanalAuthSuccess };
      if (msg.type !== 'DANAL_AUTH_RESULT') return;
      handled.current = true;
      if (msg.payload.ok) {
        onSuccess({
          txSeq: msg.payload.txSeq,
          tid: msg.payload.tid,
          name: msg.payload.name,
          phone: msg.payload.phone,
          birthDate: msg.payload.birthDate,
          gender: msg.payload.gender,
          di: msg.payload.di,
          ci: msg.payload.ci,
        });
      } else {
        onFail?.((msg.payload as unknown as { error?: string }).error ?? '본인확인 실패');
      }
    } catch {
      // ignore
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.header}>
        <Text style={styles.title}>본인인증</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.close}>닫기</Text>
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1f63e9" />
          <Text style={styles.loadingText}>다날 인증 페이지를 불러오는 중…</Text>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>본인확인을 시작할 수 없습니다</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorHint}>
            관리자에게 다날 본인확인 키 설정 여부를 확인해주세요.{'\n'}
            (DANAL_CPID / DANAL_CPPWD)
          </Text>
        </View>
      )}
      {!loading && !error && authUrl && (
        <WebView
          originWhitelist={['*']}
          source={{ uri: authUrl }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          style={{ flex: 1 }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#E8EBF0',
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#0F2242' },
  close: { fontSize: 14, color: '#5b6d8f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 13, color: '#5b6d8f' },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#E74C3C', marginBottom: 8 },
  errorBody: { fontSize: 13, color: '#5b6d8f', textAlign: 'center', marginBottom: 12 },
  errorHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
