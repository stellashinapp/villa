import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEffect, useState } from 'react';

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

// Daum/Kakao Postcode embedded HTML.
// 네이티브: window.ReactNativeWebView.postMessage 로 RN 과 통신.
// 웹(iframe): window.parent.postMessage 로 부모 윈도우에 통신.
// 둘 다 지원하도록 두 채널 모두 호출.
const HTML = `<!DOCTYPE html>
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
  <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    function send(payload) {
      var json = JSON.stringify(payload);
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(json);
        }
      } catch (e) {}
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(json, '*');
        }
      } catch (e) {}
    }
    new daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: function(data) {
        var addr = data.roadAddress || data.jibunAddress || data.address || '';
        send({ type: 'selected', address: addr, zonecode: data.zonecode || '' });
      },
      onclose: function(state) {
        if (state === 'FORCE_CLOSE') {
          send({ type: 'closed' });
        }
      }
    }).embed(document.getElementById('wrap'));
  </script>
</body>
</html>`;

export default function AddressSearchModal({ visible, onClose, onSelected }: Props) {
  const [loading, setLoading] = useState(true);

  // 웹: iframe 의 postMessage 수신
  useEffect(() => {
    if (!IS_WEB || !visible) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'selected') {
          onSelected({ address: data.address || '', zonecode: data.zonecode || '' });
          onClose();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [visible, onSelected, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent={IS_WEB} onRequestClose={onClose}>
      <View style={[styles.container, IS_WEB && styles.webContainer]}>
        <View style={[styles.header, IS_WEB && { paddingTop: 16 }]}>
          <Text style={styles.title}>주소 검색</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          {IS_WEB ? (
            <iframe
              srcDoc={HTML}
              style={{ flex: 1, border: 'none', width: '100%', height: '100%' } as object}
              title="주소 검색"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: HTML, baseUrl: 'https://postcode.map.daum.net' }}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webContainer: {
    // 웹에서는 모달 안쪽 박스 형태로 — 전체화면이지만 디자인은 동일
    margin: 0,
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
});
