import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { residentLogin } from '@/lib/store';
import { syncResidentFromSupabase } from '@/lib/sync';

export default function ResidentLoginScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('알림', '이름과 전화번호를 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const supaResident = await syncResidentFromSupabase(phone.trim(), name.trim());
      if (supaResident) {
        router.replace('/(resident)/bills');
        return;
      }
      const result = residentLogin(name.trim(), phone.trim());
      if (!result) {
        Alert.alert('로그인 실패', '등록된 정보가 없습니다. 관리자에게 등록을 요청하세요.');
        return;
      }
      router.replace('/(resident)/bills');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>입주민 로그인</Text>
        <Text style={styles.title}>{'이름과 전화번호로\n로그인하세요'}</Text>
        <Text style={styles.subtitle}>
          관리자가 등록한 정보와 일치하면 자동으로 빌라·호실이 매칭됩니다
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.inputLabel}>이름 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 김민수"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>전화번호 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 010-1234-5678"
          placeholderTextColor="#9CA3AF"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnText}>{loading ? '확인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.btnGhostText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  hero: {
    backgroundColor: '#1B2A4A',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
  form: { paddingHorizontal: 24, paddingTop: 24 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8EBF0',
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: '#1A1D26',
    marginBottom: 14,
  },
  hintCard: {
    backgroundColor: '#E8EEFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  hintTitle: { fontSize: 12, fontWeight: '700', color: '#3454D1', marginBottom: 6 },
  hintText: { fontSize: 13, color: '#3454D1', lineHeight: 20 },
  btn: {
    backgroundColor: '#3454D1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: '#E8EBF0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnGhostText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
