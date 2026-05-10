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
const CONTAINER_ID = 'andnew-postcode-container';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        width?: string;
        height?: string;
        oncomplete: (data: { roadAddress?: string; jibunAddress?: string; address?: string; zonecode?: string }) => void;
        onclose?: (state: string) => void;
      }) => { embed: (el: HTMLElement) => void; open: () => void };
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

  // 웹: 모달이 열리면 daum.Postcode 를 embed.
  // requestAnimationFrame 으로 컨테이너 div 가 실제 DOM 에 그려진 뒤 호출.
  useEffect(() => {
    if (!IS_WEB || !visible) return;
    setLoading(true);
    setWebError(null);

    let cancelled = false;
    let raf = 0;

    const tryEmbed = async () => {
      try {
        await ensurePostcodeScript();
        if (cancelled) return;

        // 다음 프레임에 DOM 확정되도록
        raf = requestAnimationFrame(() => {
          if (cancelled) return;
          const container = document.getElementById(CONTAINER_ID);
          if (!container || !window.daum) {
            setWebError('주소 검색을 불러오지 못했습니다');
            setLoading(false);
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
        });
      } catch (err) {
        if (!cancelled) {
          setWebError(err instanceof Error ? err.message : '주소 검색을 불러오지 못했습니다');
          setLoading(false);
        }
      }
    };
    tryEmbed();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [visible]);

  // 웹: react-native-web 의 Modal 은 portal 로 document.body 에 렌더 → 풀스크린 보장.
  // transparent=false (불투명 흰 배경) 로 단순 풀스크린 사용.
  if (IS_WEB) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={webStyles.fullScreen}>
          <View style={webStyles.header}>
            <Text style={webStyles.title}>주소 검색</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={webStyles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
          <View style={webStyles.body}>
            <div
              id={CONTAINER_ID}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
              } as object}
            />
            {webError && (
              <View style={webStyles.errorBox}>
                <Text style={webStyles.errorText}>{webError}</Text>
              </View>
            )}
            {loading && !webError && (
              <View style={webStyles.loading}>
                <ActivityIndicator size="large" color="#4263E8" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // 네이티브
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>주소 검색</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
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
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#4263E8" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
});

// 웹 전용 스타일 — position: fixed 로 화면 전체 덮음 (Modal 의존 X).
const webStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1D26' },
  closeText: { fontSize: 14, color: '#4263E8', fontWeight: '600' },
  body: {
    flex: 1,
    position: 'relative',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
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
