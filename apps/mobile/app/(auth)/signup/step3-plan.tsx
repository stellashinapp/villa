import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
  bg: '#0F1B33',
  card: '#182744',
  cardBorder: '#243555',
  inputBg: '#1A2D4D',
  inputBorder: '#243555',
  primary: '#3B5BDB',
  success: '#1EB06A',
  text: '#E0E4EA',
  sub: '#8893A7',
  error: '#E5423A',
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
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

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
      if (!signupData) throw new Error('가입 정보가 없습니다');

      // 1) Supabase Auth 회원가입 + admins 프로필 생성
      await signUpAdmin({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        phone: signupData.phone,
      });

      // 2) 빌라 등록 (Step2에서 입력한 경우)
      if (signupData.villaName && signupData.totalUnits) {
        // 먼저 구독 생성
        const { data: { user } } = await supabase.auth.getUser();
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('auth_id', user!.id)
          .single();

        if (admin) {
          // 구독 생성 (무료체험)
          await supabase.from('subscriptions').insert({
            admin_id: admin.id,
            status: 'trialing',
            billing_day: 1,
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

          // 빌라 등록
          await createVilla({
            name: signupData.villaName,
            address: signupData.villaAddress || '',
            totalUnits: signupData.totalUnits,
            unitsPerFloor: signupData.unitsPerFloor || 2,
          });
        }
      }

      await clearSignupData();
      router.replace('/(admin)/home');
    } catch (err: any) {
      Alert.alert('가입 실패', err.message || '다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // 빌라 없이 계정만 생성
    setLoading(true);
    try {
      const signupData = await getSignupData();
      if (!signupData) throw new Error('가입 정보가 없습니다');

      await signUpAdmin({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        phone: signupData.phone,
      });

      await clearSignupData();
      router.replace('/(admin)/home');
    } catch (err: any) {
      Alert.alert('가입 실패', err.message || '다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
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

      {/* Card registration (optional) */}
      <TouchableOpacity
        style={styles.cardToggle}
        onPress={() => setShowCardForm(!showCardForm)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardToggleText}>
          {showCardForm ? '▾ 카드 등록 접기' : '▸ 카드 등록 (선택사항)'}
        </Text>
        <Text style={styles.cardToggleSub}>
          등록하면 무료 체험 후 자동 결제됩니다
        </Text>
      </TouchableOpacity>

      {showCardForm && (
        <View style={styles.cardForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>카드 번호</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={C.sub}
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>
          <View style={styles.cardRow}>
            <View style={styles.cardHalf}>
              <Text style={styles.label}>유효기간</Text>
              <TextInput
                style={styles.input}
                value={cardExpiry}
                onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                placeholder="MM/YY"
                placeholderTextColor={C.sub}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={styles.cardHalf}>
              <Text style={styles.label}>CVC</Text>
              <TextInput
                style={styles.input}
                value={cardCvc}
                onChangeText={(t) => setCardCvc(t.replace(/\D/g, '').slice(0, 3))}
                placeholder="000"
                placeholderTextColor={C.sub}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      )}

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
  progressDotInactive: { backgroundColor: C.cardBorder },

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
    color: C.white,
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
    backgroundColor: '#1A3324',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#254D35',
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
    color: '#7EC9A0',
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
  },
  planCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#1B2E54',
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
    borderColor: C.cardBorder,
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
    color: C.white,
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

  // Card toggle
  cardToggle: {
    paddingVertical: 14,
    marginBottom: 4,
  },
  cardToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.sub,
  },
  cardToggleSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
    opacity: 0.7,
  },

  // Card form
  cardForm: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 18,
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
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
