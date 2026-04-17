import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AdminInboxScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>메시지 수신함</Text>
      </View>
      {/* TODO: 전체 빌라 통합 메시지, 인라인 답변 */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>✉️ 메시지가 없습니다</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  placeholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: '#8893A7', fontSize: 14 },
});
