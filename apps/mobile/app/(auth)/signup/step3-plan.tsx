import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { completeSignup } from '@/lib/signup-complete';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardBorder: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  primary: '#4263E8',
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
    name: '중형',
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
      '중형 플랜 전체',
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ totalUnits?: string }>();

  const totalUnits = params.totalUnits ? Number(params.totalUnits) : 0;

  // 세대수에 따른 자동 플랜 배정 — 사용자가 선택할 항목이 아님
  const assignedPlanId: PlanId = totalUnits > 0 ? recommendPlan(totalUnits) : 'small';
  const assignedPlan = PLANS.find((p) => p.id === assignedPlanId) ?? PLANS[0];

  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      // 어떤 단계에서 실패해도 사용자는 무조건 다음으로 진행하도록 강제.
      const result = await completeSignup({ createVillaIfPresent: true });
      if (result.adminId) {
        router.replace({
          pathname: '/payment/billing',
          params: {
            adminId: result.adminId,
            customerName: result.customerName,
            fromSignup: '1',
          },
        });
      } else if (result.ok) {
        router.replace('/(admin)/home');
      } else {
        // 가입 실패 (이메일 중복+비번 불일치 등) → 로그인으로 보내서 갇히지 않게
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      console.error('[signup] unexpected:', err);
      Alert.alert('오류', err?.message ?? '예상치 못한 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <ProgressBar step={3} />

      <Text style={styles.stepLabel}>STEP 3 / 3</Text>
      <Text style={styles.title}>플랜을 확인하세요</Text>
      <Text style={styles.subtitle}>
        세대수에 맞춰 자동으로 배정된 플랜이에요
      </Text>

      {/* 자동 플랜 배정 카드 */}
      <View style={styles.autoPlanCard}>
        <Text style={styles.autoPlanLabel}>자동 플랜 배정</Text>

        <View style={styles.autoPlanInner}>
          <View style={styles.autoPlanHeader}>
            <Text style={styles.autoPlanName}>{assignedPlan.name} 플랜</Text>
            <Text style={styles.autoPlanRange}>{assignedPlan.range}</Text>
          </View>
          <Text style={styles.autoPlanPrice}>월 {assignedPlan.priceLabel}</Text>
          {totalUnits > 0 && (
            <View style={styles.autoPlanMetaRow}>
              <Text style={styles.autoPlanMetaLabel}>세대수</Text>
              <Text style={styles.autoPlanMetaValue}>{totalUnits}세대</Text>
            </View>
          )}
        </View>

        {/* 🎉 첫 1개월 완전 무료 — 카드 안 배너 */}
        <View style={styles.trialBannerInline}>
          <Text style={styles.trialBannerInlineTitle}>🎉 첫 1개월 완전 무료</Text>
          <Text style={styles.trialBannerInlineSub}>
            카드 등록 없이 바로 시작 · 언제든 해지 가능
          </Text>
        </View>
      </View>

      <View style={styles.cardNoticeBox}>
        <Text style={styles.cardNoticeTitle}>💳 30일 무료체험 안내</Text>
        <Text style={styles.cardNoticeText}>
          무료체험 시작 전 카드 등록이 필요합니다. 30일 이내에 해지하시면 요금이 청구되지 않으며,
          30일 이후에는 등록한 카드로 자동 결제됩니다. 토스페이먼츠 보안 페이지로 안전하게 연결됩니다.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.primaryButton, loading && { opacity: 0.6 }]}
        onPress={handleStart}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? '계정 생성 중...' : '카드 등록하고 시작'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  contentContainer: { padding: 24 },

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

  // 자동 플랜 배정 카드
  autoPlanCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DCE3F4',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  autoPlanLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  autoPlanInner: {
    backgroundColor: '#F4F7FE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  autoPlanHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  autoPlanName: {
    fontSize: 17,
    fontWeight: '900',
    color: C.text,
  },
  autoPlanRange: {
    fontSize: 12,
    color: C.sub,
    fontWeight: '600',
  },
  autoPlanPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: C.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  autoPlanMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F4',
  },
  autoPlanMetaLabel: { fontSize: 13, color: C.sub, fontWeight: '600' },
  autoPlanMetaValue: { fontSize: 13, color: C.text, fontWeight: '700' },

  // 🎉 trial banner — 카드 안에 들어가는 버전
  trialBannerInline: {
    backgroundColor: '#F1F6FF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  trialBannerInlineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.primary,
    marginBottom: 3,
  },
  trialBannerInlineSub: {
    fontSize: 11,
    color: '#5B6D8F',
    fontWeight: '500',
  },

  // (구) 외부 trial banner — 더 이상 사용 안 하지만 호환을 위해 남김
  trialBanner: {
    flexDirection: 'row',
    backgroundColor: '#F1F6FF',
    borderRadius: 12,
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
    color: '#4263E8',
    marginBottom: 2,
  },
  trialSub: {
    fontSize: 12,
    color: '#5B6D8F',
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
    backgroundColor: '#EBF1FF',
  },
  planCardDisabled: {
    opacity: 0.45,
  },
  planTextDisabled: {
    color: '#9CA3AF',
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
  planRange: {
    fontSize: 13,
    color: C.sub,
  },
  planRangeSelected: {
    color: C.primary,
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
  planPriceSelected: {
    color: C.primary,
  },
  planPriceNote: {
    fontSize: 12,
    color: C.sub,
    marginLeft: 4,
  },
  planPriceNoteSelected: {
    color: C.primary,
  },
  planFeatures: {
    marginTop: 12,
    paddingLeft: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(66,99,232,0.2)',
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
  featureCheckSelected: {
    color: C.primary,
  },
  featureText: {
    fontSize: 13,
    color: C.text,
  },
  featureTextSelected: {
    color: C.primary,
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
