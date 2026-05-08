/**
 * NICE 본인인증 (체크플러스) WebView 모달.
 *
 * 사용 흐름:
 *  1. 부모 화면에서 visible=true 로 설정
 *  2. 모달이 admin-web /api/nice/encrypt 호출 → encData / niceUrl 받음
 *  3. WebView 에서 NICE 인증 페이지로 자동 form submit
 *  4. 사용자 인증 완료 후 NICE 가 /api/nice/callback 으로 redirect
 *  5. callback 페이지가 postMessage 로 결과 전달 → onSuccess 콜백 호출
 *
 * NICE 키 미발급 상태에서는 encrypt API 가 500 을 반환하므로
 * 호출부에서 __DEV__ 일 때 "테스트 통과" 버튼을 별도로 제공할 것.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const NICE_API_BASE =
  process.env.EXPO_PUBLIC_NICE_API_BASE ??
  process.env.EXPO_PUBLIC_ADMIN_WEB_URL ??
  'https://admin.andnew.kr';

export type NiceAuthSuccess = {
  requestId: string;
  name: string;
  phone: string;
  birthDate: string;
  gender: 'M' | 'F' | '';
  di: string;
  ci: string;
};

export interface NiceAuthModalProps {
  visible: boolean;
  onSuccess: (result: NiceAuthSuccess) => void;
  onCancel: () => void;
  onFail?: (reason: string) => void;
}

export default function NiceAuthModal({ visible, onSuccess, onCancel, onFail }: NiceAuthModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) {
      setHtml(null);
      setLoading(true);
      setError(null);
      handled.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${NICE_API_BASE}/api/nice/encrypt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authType: 'M' }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`${res.status} ${body.slice(0, 200)}`);
        }
        const { encData, niceUrl } = (await res.json()) as { encData: string; niceUrl: string };
        if (cancelled) return;
        setHtml(buildAutoSubmitHtml(encData, niceUrl));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'NICE 본인인증 시작 실패');
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
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; payload: { ok: boolean } & NiceAuthSuccess };
      if (msg.type !== 'NICE_AUTH_RESULT') return;
      handled.current = true;
      if (msg.payload.ok) {
        onSuccess({
          requestId: msg.payload.requestId,
          name: msg.payload.name,
          phone: msg.payload.phone,
          birthDate: msg.payload.birthDate,
          gender: msg.payload.gender,
          di: msg.payload.di,
          ci: msg.payload.ci,
        });
      } else {
        onFail?.((msg.payload as unknown as { error?: string }).error ?? '본인인증 실패');
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
          <Text style={styles.loadingText}>NICE 인증 페이지를 불러오는 중…</Text>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>본인인증을 시작할 수 없습니다</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorHint}>
            관리자에게 NICE 본인인증 키 설정 여부를 확인해주세요.{'\n'}
            (NICE_SP_ID / NICE_SP_SECRET)
          </Text>
        </View>
      )}
      {!loading && !error && html && (
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: NICE_API_BASE }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          style={{ flex: 1 }}
        />
      )}
    </Modal>
  );
}

function buildAutoSubmitHtml(encData: string, niceUrl: string): string {
  const safeEnc = encData.replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body>
  <form id="checkplusForm" name="checkplusForm" method="post" action="${niceUrl}">
    <input type="hidden" name="m" value="checkplusService" />
    <input type="hidden" name="EncodeData" value="${safeEnc}" />
  </form>
  <script>document.getElementById('checkplusForm').submit();</script>
</body>
</html>`;
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
