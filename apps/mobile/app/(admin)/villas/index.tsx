import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function VillasListScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 빌라</Text>
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(admin)/villas/add')}>
          <Text style={styles.addBtnText}>＋ 새 빌라 등록</Text>
        </TouchableOpacity>
        {/* TODO: 빌라 목록 */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addBtn: {
    backgroundColor: '#2558D6', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
