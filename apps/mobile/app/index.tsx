import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { residentTheme as T, common } from '@/constants/theme';

const NAVY_DARK = '#0D1A33';
const NAVY = '#1B2A4A';
const NAVY_LIGHT = '#2A3D6B';

function BuildingLogo({ size = 88 }: { size?: number }) {
  const boxSize = size;
  const inner = boxSize * 0.6;
  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: boxSize * 0.24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View style={{ width: inner, height: inner * 0.95, position: 'relative' }}>
        {/* 빌딩 본체 */}
        <View
          style={{
            position: 'absolute',
            left: inner * 0.06,
            top: inner * 0.08,
            width: inner * 0.88,
            height: inner * 0.87,
            borderRadius: inner * 0.06,
            backgroundColor: NAVY,
          }}
        />
        {/* 창문 격자 (3x4) */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <View
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                left: inner * (0.18 + col * 0.24),
                top: inner * (0.18 + row * 0.18),
                width: inner * 0.13,
                height: inner * 0.1,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
              }}
            />
          ))
        )}
        {/* 출입문 */}
        <View
          style={{
            position: 'absolute',
            left: inner * 0.4,
            top: inner * 0.74,
            width: inner * 0.2,
            height: inner * 0.21,
            borderTopLeftRadius: inner * 0.04,
            borderTopRightRadius: inner * 0.04,
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>
    </View>
  );
}

export default function EntryScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <LinearGradient colors={[NAVY_DARK, NAVY, NAVY_LIGHT]} style={s.splashContainer}>
        <BuildingLogo size={92} />
        <Text style={s.splashBrand}>빌라톡</Text>
        <ActivityIndicator color="#FFFFFF" style={{ marginTop: 28 }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[NAVY_DARK, NAVY, NAVY_LIGHT]} style={s.container}>
      <View style={s.heroSection}>
        <BuildingLogo size={104} />
        <Text style={s.brandLabel}>VILLA TALK</Text>
        <Text style={s.brandTitle}>빌라톡</Text>
        <Text style={s.description}>
          관리자와 입주민 모두를 위한{'\n'}스마트 공동 관리 서비스
        </Text>
      </View>

      <View style={s.buttonArea}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={s.btnPrimaryText}>관리자로 시작</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => router.push('/(auth)/resident-login')}
          activeOpacity={0.85}
        >
          <Text style={s.btnSecondaryText}>입주민으로 시작</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 22,
    letterSpacing: -0.5,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  brandLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    marginTop: 30,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 18,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonArea: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: T.primary,
    borderRadius: common.radius.md,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: common.radius.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
