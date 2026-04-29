import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { getSignupData, clearSignupData } from '@/lib/signup-store';
import { signUpAdmin } from '@/lib/auth';
import { createVilla } from '@/lib/villas';
import { supabase } from '@/lib/supabase';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardBorder: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  primary: '#3454D1',
  success: '#4CAF50',
  text: '#1A1D26',
  sub: '#6B7280',
  error: '#E74C3C',
  white: '#FFFFFF',
};

type PlanId = 'small' | 'medium' | 'large';

interface Plan {
  id: PlanId;
  name: string;
  range: string;
  price: number;
  priceLabel: string;
  features: string[];
  popular?: boolean;
  minUnits: number;
  maxUnits: number;
}

const PLANS: Plan[] = [
  {
    id: 'small',
    name: '소형',
    range: '6~8세대',
    price: 30000,
    priceLabel: '30,000원',
    features: ['기본 관리비 관리', '입주민 공지', '민원 접수'],
    minUnits: 1,
    maxUnits: 8,
  },
  {
    id: 'medium',
    name: '인기',
    range: '9~15세대',
    price: 50000,
    priceLabel: '50,000원',
    features: ['소형 플랜 전체', '자동 고지서', '수납 현황 대시보드', '문자 발송'],
    popular: true,
    minUnits: 9,
    maxUnits: 15,
  },
  {
    id: 'large',
    name: '대형',
    range: '16~30세대',
    price: 70000,
    priceLabel: '70,000원',
    features: [
      '인기 플랜 전체',
      '다중 빌라 관리',
      '정산 리포트',
      '우선 지원',
    ],
    minUnits: 16,
    maxUnits: 30,
  },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressRow}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            s <= step ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function recommendPlan(units: number): PlanId {
  if (units <= 8) return 'small';
  if (units <= 15) return 'medium';
  return 'large';
}

export default function SignupStep3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ totalUnits?: string }>();

  const totalUnits = params.totalUnits ? Number(params.totalUnits) : 0;

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('medium');

  useEffect(() => {
    if (totalUnits > 0) {
      setSelectedPlan(recommendPlan(totalUnits));
    }
  }, [totalUnits]);

  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const signupData = await getSignupData();

      if (signupData?.email && signupData?.password) {
        // Supabase Auth 회원가입
        try {
          await signUpAdmin({
            email: signupData.email,
            password: signupData.password,
            name: signupData.name,
            phone: signupData.phone,
          });

          // 빌라 등록
          if (signupData.villaName && signupData.totalUnits) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: admin } = await supabase
                .from('admins')
                .select('id')
                .eq('auth_id', user.id)
                .single();

              if (admin) {
                await supabase.from('subscriptions').insert({
                  admin_id: admin.id,
                  status: 'trialing',
                  billing_day: 1,
                  trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                });

                await createVilla({
                  name: signupData.villaName,
                  address: signupData.villaAddress || '',
                  totalUnits: signupData.totalUnits,
                  unitsPerFloor: signupData.unitsPerFloor || 2,
                });
              }
            }
          }
        } catch (authErr: any) {
          console.warn('Supabase signup error (continuing to home):', authErr.message);
        }
      }

      await clearSignupData();
      router.replace('/(admin)/home');
    } catch (err: any) {
      console.error('Signup failed:', err);
      // 에러가 나도 홈으로 이동 (데모 모드)
      await clearSignupData();
      router.replace('/(admin)/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await clearSignupData();
    router.replace('/(admin)/home');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <ProgressBar step={3} />

      <Text style={styles.stepLabel}>STEP 3 / 3</Text>
      <Text style={styles.title}>플랜을 선택하세요</Text>
      <Text style={styles.subtitle}>
        첫 1개월 무료! 부담 없이 시작하세요
      </Text>

      {/* Free trial banner */}
      <View style={styles.trialBanner}>
        <Text style={styles.trialEmoji}>🎉</Text>
        <View style={styles.trialTextWrap}>
          <Text style={styles.trialTitle}>첫 1개월 완전 무료</Text>
          <Text style={styles.trialSub}>
            카드 등록 없이도 모든 기능을 사용할 수 있어요
          </Text>
        </View>
      </View>

      {/* Plan cards */}
      {PLANS.map((plan) => {
        const isSelected = selectedPlan === plan.id;
        const isRecommended =
          totalUnits > 0 && recommendPlan(totalUnits) === plan.id;

        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              isSelected && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.7}
          >
            <View style={styles.planHeader}>
              <View style={styles.planTitleRow}>
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.planName,
                    isSelected && styles.planNameSelected,
                  ]}
                >
                  {plan.name}
                </Text>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>인기</Text>
                  </View>
                )}
                {isRecommended && (
                  <View style={styles.recommendBadge}>
                    <Text style={styles.recommendText}>추천</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planRange}>{plan.range}</Text>
            </View>

            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>월 {plan.priceLabel}</Text>
              <Text style={styles.planPriceNote}>/월 (VAT 별도)</Text>
            </View>

            {isSelected && (
              <View style={styles.planFeatures}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={styles.cardNoticeBox}>
        <Text style={styles.cardNoticeTitle}>💳 카드 등록은 나중에</Text>
        <Text style={styles.cardNoticeText}>
          30일 무료체험 종료 7일 전, 설정 &gt; 구독관리에서 카드를 등록해 주세요.
          토스페이먼츠 보안 페이지로 안전하게 연결됩니다.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>🎉 무료 체험 시작!</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>나중에 결정할게요</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  contentContainer: { padding: 24, paddingTop: 56 },

  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: { backgroundColor: C.primary },
  progressDotInactive: { backgroundColor: '#E5E7EB' },

  stepLabel: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 20,
    marginBottom: 20,
  },

  // Trial banner
  trialBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76,175,80,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.2)',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  trialEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  trialTextWrap: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.success,
    marginBottom: 2,
  },
  trialSub: {
    fontSize: 12,
    color: C.sub,
    lineHeight: 18,
  },

  // Plan cards
  planCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardSelected: {
    borderColor: C.primary,
    backgroundColor: 'rgba(52,84,209,0.04)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioSelected: {
    borderColor: C.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  planNameSelected: {
    color: C.primary,
  },
  popularBadge: {
    backgroundColor: '#FF6B2C',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  popularText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  recommendBadge: {
    backgroundColor: C.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  planRange: {
    fontSize: 13,
    color: C.sub,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    paddingLeft: 30,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  planPriceNote: {
    fontSize: 12,
    color: C.sub,
    marginLeft: 4,
  },
  planFeatures: {
    marginTop: 12,
    paddingLeft: 30,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureCheck: {
    color: C.success,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: C.text,
  },

  cardNoticeBox: {
    backgroundColor: 'rgba(52,84,209,0.06)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  cardNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.primary,
    marginBottom: 4,
  },
  cardNoticeText: {
    fontSize: 12,
    color: C.sub,
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },

  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: C.sub,
    fontSize: 14,
  },
});
