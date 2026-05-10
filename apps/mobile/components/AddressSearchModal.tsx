import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEffect, useRef, useState } from 'react';

interface AddressSelected {
  address: string; // 도로명 or 지번 주소
  zonecode: string; // 우편번호
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelected: (data: AddressSelected) => void;
}

const IS_WEB = Platform.OS === 'web';
const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        width?: string;
        height?: string;
        popupKey?: string;
        oncomplete: (data: { roadAddress?: string; jibunAddress?: string; address?: string; zonecode?: string }) => void;
        onclose?: (state: string) => void;
      }) => { embed: (el: HTMLElement) => void; open: (options?: { popupKey?: string }) => void };
    };
  }
}

// 네이티브용 HTML — WebView 안에서 embed.
const NATIVE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>주소 검색</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #ffffff; }
    #wrap { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="wrap"></div>
  <script src="${POSTCODE_SCRIPT_SRC}"></script>
  <script>
    new daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: function(data) {
        var addr = data.roadAddress || data.jibunAddress || data.address || '';
        var payload = JSON.stringify({ type: 'selected', address: addr, zonecode: data.zonecode || '' });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(payload);
        }
      }
    }).embed(document.getElementById('wrap'));
  </script>
</body>
</html>`;

// 부모 페이지에 daum.Postcode 스크립트 주입 (웹 전용).
let scriptPromise: Promise<void> | null = null;
function ensurePostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('postcode.v2.js 로드 실패'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function AddressSearchModal({ visible, onClose, onSelected }: Props) {
  const [loading, setLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);
  const onSelectedRef = useRef(onSelected);
  const onCloseRef = useRef(onClose);
  onSelectedRef.current = onSelected;
  onCloseRef.current = onClose;

  // 웹: 모달이 열리면 daum.Postcode 를 본 페이지에 embed.
  // postMessage 우회 — oncomplete 가 같은 윈도우 컨텍스트에서 직접 호출됨.
  useEffect(() => {
    if (!IS_WEB || !visible) return;

    let cancelled = false;
    const containerId = 'andnew-postcode-container';

    (async () => {
      try {
        await ensurePostcodeScript();
        if (cancelled) return;

        const container = document.getElementById(containerId);
        if (!container || !window.daum) {
          setWebError('주소 검색을 불러오지 못했습니다');
          return;
        }
        container.innerHTML = '';
        new window.daum.Postcode({
          width: '100%',
          height: '100%',
          oncomplete: (data) => {
            const addr = data.roadAddress || data.jibunAddress || data.address || '';
            onSelectedRef.current({ address: addr, zonecode: data.zonecode || '' });
            onCloseRef.current();
          },
        }).embed(container);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setWebError(err instanceof Error ? err.message : '주소 검색을 불러오지 못했습니다');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={IS_WEB} onRequestClose={onClose}>
      <View style={[styles.container, IS_WEB && styles.webOverlay]}>
        <View style={[styles.card, IS_WEB && styles.webCard]}>
          <View style={[styles.header, IS_WEB && { paddingTop: 16 }]}>
            <Text style={styles.title}>주소 검색</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, position: 'relative' }}>
            {IS_WEB ? (
              <>
                <div
                  id="andnew-postcode-container"
                  style={{ width: '100%', height: '100%' } as object}
                />
                {webError && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{webError}</Text>
                  </View>
                )}
              </>
            ) : (
              <WebView
                originWhitelist={['*']}
                source={{ html: NATIVE_HTML, baseUrl: 'https://postcode.map.daum.net' }}
                javaScriptEnabled
                domStorageEnabled
                onLoadEnd={() => setLoading(false)}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data?.type === 'selected') {
                      onSelected({ address: data.address || '', zonecode: data.zonecode || '' });
                      onClose();
                    }
                  } catch {
                    /* ignore */
                  }
                }}
              />
            )}
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4263E8" />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: { flex: 1, backgroundColor: '#FFFFFF' },
  webCard: {
    width: '100%',
    maxWidth: 520,
    height: '90%',
    maxHeight: 720,
    borderRadius: 16,
    overflow: 'hidden',
    flex: 0,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1D26' },
  closeText: { fontSize: 14, color: '#4263E8', fontWeight: '600' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  errorBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: { fontSize: 14, color: '#E74C3C', textAlign: 'center' },
});
