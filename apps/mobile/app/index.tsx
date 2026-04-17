import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function EntryScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  async function checkAutoLogin() {
    try {
      // 관리자 자동 로그인 (refresh_token 기반)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(admin)/home');
        return;
      }

      // 입주민 자동 로그인 (커스텀 JWT)
      const residentToken = await AsyncStorage.getItem('resident_token');
      if (residentToken) {
        router.replace('/(resident)/bills');
        return;
      }
    } catch {
      // 자동 로그인 실패 시 진입 화면 표시
    }
    setChecking(false);
  }

  if (checking) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>VILLA MANAGER</Text>
        <Text style={styles.title}>{'빌라 관리,\n이제 앱으로'}</Text>
        <Text style={styles.subtitle}>
          {'빌라·다세대 관리자와 입주민을 위한\n스마트 공동관리 서비스'}
        </Text>

        <TouchableOpacity
          style={styles.btnAdmin}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnAdminText}>🏢 관리자로 시작</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnResident}
          onPress={() => router.push('/(auth)/resident-login')}
        >
          <Text style={styles.btnResidentText}>🏠 입주민으로 시작</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>ANDNEW · 빌라톡</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1B33',
  },
  loading: {
    color: '#fff',
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 16,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 22,
    marginBottom: 48,
  },
  btnAdmin: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnAdminText: {
    color: '#2558D6',
    fontSize: 16,
    fontWeight: '800',
  },
  btnResident: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnResidentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
});
