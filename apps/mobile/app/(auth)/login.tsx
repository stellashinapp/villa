import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력하세요');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('로그인 실패', error.message);
      return;
    }
    router.replace('/(admin)/home');
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.icon}>🏢</Text>
        <Text style={styles.title}>관리자 로그인</Text>
        <Text style={styles.subtitle}>빌라 관리자 계정으로 로그인하세요</Text>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일을 입력하세요"
          placeholderTextColor="#5A6A82"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력하세요"
          placeholderTextColor="#5A6A82"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnPrimaryText}>{loading ? '로그인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push('/(auth)/signup/step1-account')}
        >
          <Text style={styles.btnSecondaryText}>회원가입 (관리자 전용)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', justifyContent: 'center' },
  inner: { paddingHorizontal: 28 },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8893A7', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 12, fontWeight: '700', color: '#8893A7', marginBottom: 6 },
  input: {
    backgroundColor: '#1A2D4D', borderWidth: 1.5, borderColor: '#243555',
    borderRadius: 12, padding: 13, fontSize: 14, color: '#E0E4EA', marginBottom: 14,
  },
  btnPrimary: {
    backgroundColor: '#2558D6', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 10,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(37,88,214,0.4)',
    borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10,
  },
  btnSecondaryText: { color: '#2558D6', fontSize: 15, fontWeight: '700' },
  backText: { color: '#8893A7', textAlign: 'center', marginTop: 16, fontSize: 13 },
});
