import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react';

interface AddressSelected {
  address: string; // 도로명 or 지번 주소
  zonecode: string; // 우편번호
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelected: (data: AddressSelected) => void;
}

// Daum/Kakao Postcode embedded HTML.
// 별도 API key 없이 동작하며, postMessage로 RN과 통신.
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
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
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
                // ignore
              }
            }}
          />
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#3454D1" />
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
  closeText: { fontSize: 14, color: '#3454D1', fontWeight: '600' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
