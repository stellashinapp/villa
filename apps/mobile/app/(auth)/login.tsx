import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { signInAdmin, getMyAdmin } from '@/lib/auth';
import { store } from '@/lib/store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      // 가입 도중 카드 등록을 마치지 않은 상태면 결제 화면으로 복귀
      const sub = store.subscription;
      if (sub.status === 'trialing' && !sub.cardLast4) {
        const me = await getMyAdmin();
        router.replace({
          pathname: '/payment/billing',
          params: {
            adminId: me?.id ?? '',
            customerName: me?.name ?? '관리자',
            fromSignup: '1',
          },
        });
      } else {
        router.replace('/(admin)/home');
      }
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      {/* 뒤로가기 */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backBtnText}>← 돌아가기</Text>
      </TouchableOpacity>

      {/* 타이틀 */}
      <View style={s.titleArea}>
        <Text style={s.title}>관리자 로그인</Text>
        <Text style={s.subtitle}>빌라 관리자 계정으로 로그인하세요</Text>
      </View>

      {/* 입력 폼 */}
      <View style={s.form}>
        <Text style={s.label}>이메일</Text>
        <TextInput
          style={s.input}
          placeholder="admin@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Text style={s.label}>비밀번호</Text>
        <TextInput
          style={s.input}
          placeholder="••••••"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity style={[s.loginBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <Text style={s.loginBtnText}>{loading ? '로그인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.signupBtn}
          onPress={() => router.push('/(auth)/signup/step1-account')}
          disabled={loading}
        >
          <Text style={s.signupBtnText}>회원가입 (관리자 전용)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/find-account')}
          style={{ marginTop: 16, alignItems: 'center' }}
          disabled={loading}
        >
          <Text style={{ fontSize: 13, color: '#6B7280' }}>아이디 / 비밀번호 찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/resident-login')}
          style={{ marginTop: 12, alignItems: 'center' }}
          disabled={loading}
        >
          <Text style={{ fontSize: 13, color: '#4263E8', fontWeight: '600' }}>입주민 로그인</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>ANDNEW 2026</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  backBtn: {
    paddingTop: 56,
    paddingBottom: 8,
  },
  backBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  titleArea: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1D26',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1D26',
  },
  loginBtn: {
    backgroundColor: '#4263E8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  signupBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signupBtnText: {
    color: '#4263E8',
    fontSize: 15,
    fontWeight: '700',
  },
  demoCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4263E8',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 11,
    color: '#9CA3AF',
  },
});
