import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function EntryScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <LinearGradient colors={['#FFFFFF', '#B8CADD']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#4A6CF7', fontSize: 18, fontWeight: '700' }}>로딩 중...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#E0E8F4', '#C6D4E8', '#B3C4DC']} locations={[0, 0.35, 0.7, 1]} style={s.container}>
      {/* 상단 영역 */}
      <View style={s.heroSection}>
        <View style={s.illustrationArea}>
          <Text style={s.illustrationEmoji}>🏢</Text>
          <View style={s.chatBubble}>
            <Text style={s.chatBubbleText}>💬</Text>
          </View>
        </View>

        <Text style={s.brandLabel}>VILLA TALK</Text>
        <Text style={s.brandTitle}>빌라톡</Text>

        <Text style={s.description}>
          관리자와 입주민 모두를 위한{'\n'}스마트 공동 관리 서비스
        </Text>
      </View>

      {/* 하단 버튼 영역 */}
      <View style={s.buttonArea}>
        <TouchableOpacity
          style={s.btnAdmin}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={s.btnAdminText}>관리자로 시작</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnResident}
          onPress={() => router.push('/(auth)/resident-login')}
          activeOpacity={0.8}
        >
          <Text style={s.btnResidentText}>입주민으로 시작</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  illustrationArea: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  illustrationEmoji: {
    fontSize: 100,
  },
  chatBubble: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A9EF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubbleText: {
    fontSize: 18,
  },
  brandLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8896AB',
    letterSpacing: 3,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1D26',
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonArea: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 12,
  },
  btnAdmin: {
    backgroundColor: '#4A6CF7',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnAdminText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  btnResident: {
    backgroundColor: '#1E2B43',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnResidentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
});
