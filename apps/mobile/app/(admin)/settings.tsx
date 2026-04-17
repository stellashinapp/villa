import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSettingsScreen() {
  async function handleLogout() {
    await supabase.auth.signOut();
    await AsyncStorage.clear();
    router.replace('/');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>
      {/* TODO: 구독/결제, 계정 정보, 앱 정보, 고객센터, 이용약관 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  logoutBtn: {
    backgroundColor: 'rgba(229,66,58,0.1)', borderWidth: 1, borderColor: 'rgba(229,66,58,0.2)',
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  logoutText: { color: '#E5423A', fontSize: 15, fontWeight: '700' },
});
