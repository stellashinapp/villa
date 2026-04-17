import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResidentLoginScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!name || !phone) {
      Alert.alert('알림', '이름과 전화번호를 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/resident-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone: phone.replace(/\D/g, '') }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        Alert.alert('로그인 실패', data.error?.message || '등록된 정보가 없습니다');
        return;
      }

      // JWT 토큰 저장
      await AsyncStorage.setItem('resident_token', data.token);
      await AsyncStorage.setItem('resident_info', JSON.stringify(data.resident));

      // 여러 빌라에 등록된 경우 선택 화면으로
      if (data.matches && data.matches.length > 1) {
        await AsyncStorage.setItem('resident_matches', JSON.stringify(data.matches));
        // TODO: 빌라 선택 화면으로 이동
      }

      router.replace('/(resident)/bills');
    } catch {
      Alert.alert('오류', '서버 연결에 실패했습니다');
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
          placeholder="예: 홍길동"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>전화번호 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 010-1234-5678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '확인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => router.back()}>
          <Text style={styles.btnGhostText}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  hero: {
    backgroundColor: '#1E3264', paddingHorizontal: 24,
    paddingTop: 60, paddingBottom: 32,
  },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
  form: { paddingHorizontal: 24, paddingTop: 24 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#7C7F87', marginBottom: 6 },
  input: {
    backgroundColor: '#FAFBFC', borderWidth: 1.5, borderColor: '#EAEBEF',
    borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 14,
  },
  btn: {
    backgroundColor: '#2558D6', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 10,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost: {
    borderWidth: 1.5, borderColor: '#EAEBEF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 10,
  },
  btnGhostText: { color: '#7C7F87', fontSize: 14, fontWeight: '600' },
});
