import { View, Text, StyleSheet } from 'react-native';

export default function AddVillaStep1Screen() {
  // Step1: 비용 안내
  return (
    <View style={styles.container}>
      <Text style={styles.title}>새 빌라 추가</Text>
      <Text style={styles.subtitle}>비용 안내</Text>
      {/* TODO: 현재 구독 현황 + 새 빌라 추가 시 예상 비용 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 24, paddingTop: 60 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: '#8893A7', marginTop: 4 },
});
