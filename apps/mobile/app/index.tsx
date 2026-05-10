import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { common } from '@/constants/theme';
import { getSession, getMyAdmin } from '@/lib/auth';
import { syncAdminFromSupabase } from '@/lib/sync';
import { store } from '@/lib/store';

const BG_TOP = '#F2F5FE';
const BG_BOTTOM = '#DCE3F4';
const NAVY = '#1B2942';
const BRAND_BLUE = '#4263E8';
const INK_SUB = '#7C8AAB';

function HeroIllustration({ size = 180 }: { size?: number }) {
  // Figma aspect: 153 x 146
  return (
    <Image
      source={require('../assets/villa-talk-hero.png')}
      style={{ width: size, height: size * (146 / 153) }}
      resizeMode="contain"
    />
  );
}

export default function EntryScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'checking' | 'splash'>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (session) {
          const me = await getMyAdmin();
          if (me) {
            await syncAdminFromSupabase().catch(() => {});
            if (cancelled) return;
            // 가입 도중 카드 등록을 마치지 않고 종료한 경우 → 카드 등록 화면으로 복귀
            const sub = store.subscription;
            const needsCard = sub.status === 'trialing' && !sub.cardLast4;
            if (needsCard) {
              router.replace({
                pathname: '/payment/billing',
                params: { adminId: me.id, customerName: me.name ?? '관리자', fromSignup: '1' },
              });
            } else {
              router.replace('/(admin)/home');
            }
            return;
          }
        }
      } catch {}
      if (!cancelled) setPhase('splash');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'checking') {
    // 세션 체크 중에는 빈 화면 — 깜빡임 방지를 위해 메인 배경만 보여줌
    return <View style={{ flex: 1, backgroundColor: BG_TOP }} />;
  }

  return (
    <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={s.container}>
      <View style={s.heroSection}>
        <HeroIllustration size={144} />
        <Text style={s.brandTitle}>
          <Text style={{ color: NAVY, fontWeight: '900' }}>VILLA </Text>
          <Text style={{ color: BRAND_BLUE, fontWeight: '900' }}>TALK</Text>
        </Text>
        <Text style={s.tagline}>관리자와 입주민 모두를 위한</Text>
        <Text style={s.taglineEmphasis}>스마트 공동 관리 서비스</Text>
      </View>

      <View style={[s.buttonArea, { paddingBottom: Math.max(insets.bottom + 16, 40) }]}>
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
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 14,
    color: INK_SUB,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  taglineEmphasis: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  buttonArea: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: BRAND_BLUE,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  btnSecondary: {
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
