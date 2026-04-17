import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getMyAdmin } from '@/lib/auth';

function formatCurrency(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

export default function AdminHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [villas, setVillas] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const myAdmin = await getMyAdmin();
      setAdmin(myAdmin);
      if (!myAdmin) return;

      // 빌라 목록
      const { data: villasData } = await supabase
        .from('villas')
        .select('id, name, address, total_units, units(id), messages(id, is_read)')
        .eq('admin_id', myAdmin.id)
        .eq('status', 'active');
      setVillas(villasData || []);

      // 구독 정보
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, subscription_items(*, villas(name))')
        .eq('admin_id', myAdmin.id)
        .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
        .single();
      setSubscription(subData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const totalUnits = villas.reduce((s, v) => s + (v.units?.length || 0), 0);
  const newMessages = villas.reduce((s, v) => s + (v.messages?.filter((m: any) => !m.is_read)?.length || 0), 0);

  const SUMMARY = {
    villaCount: villas.length,
    totalUnits,
    unpaidUnits: 0, // TODO: payments 조인 후 계산
    newMessages,
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primaryBlue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.adminLabel}>ADMIN</Text>
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>{'좋은 아침이에요 👋\n관리자님'}</Text>
      </View>

      {/* ── Summary Cards (2×2) ─────────────────────────────────── */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <SummaryCard label="관리 빌라" value={SUMMARY.villaCount} />
          <SummaryCard label="총 세대" value={SUMMARY.totalUnits} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard
            label="미납 세대"
            value={SUMMARY.unpaidUnits}
            valueColor={SUMMARY.unpaidUnits > 0 ? C.accentOrange : undefined}
          />
          <SummaryCard label="새 메시지" value={SUMMARY.newMessages} />
        </View>
      </View>

      {/* ── Quick Action ────────────────────────────────────────── */}
      <TouchableOpacity style={styles.quickAction} activeOpacity={0.8}>
        <Text style={styles.quickActionText}>+ 새 빌라 등록</Text>
      </TouchableOpacity>

      {/* ── 내 빌라 Section ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 빌라</Text>
        {VILLAS.map((villa) => (
          <TouchableOpacity
            key={villa.id}
            style={styles.villaCard}
            activeOpacity={0.7}
          >
            <View style={styles.villaCardHeader}>
              <Text style={styles.villaName}>{villa.name}</Text>
              {villa.unpaidCount > 0 && (
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidBadgeText}>
                    미납 {villa.unpaidCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.villaDetails}>
              <View style={styles.villaDetail}>
                <Text style={styles.villaDetailLabel}>관리비/세대</Text>
                <Text style={styles.villaDetailValue}>
                  {formatCurrency(villa.monthlyCost)}
                </Text>
              </View>
              <View style={styles.villaDetailDivider} />
              <View style={styles.villaDetail}>
                <Text style={styles.villaDetailLabel}>세대 수</Text>
                <Text style={styles.villaDetailValue}>
                  {villa.unitCount}세대
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 서비스 구독 Section ─────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>서비스 구독</Text>
        <View style={styles.subscriptionCard}>
          {/* Plan + Status row */}
          <View style={styles.subRow}>
            <View style={styles.subPlanWrap}>
              <Text style={styles.subPlanName}>
                {SUBSCRIPTION.plan} 플랜
              </Text>
              <View style={styles.subStatusBadge}>
                <View style={styles.subStatusDot} />
                <Text style={styles.subStatusText}>
                  {SUBSCRIPTION.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.subDivider} />

          {/* Details */}
          <View style={styles.subDetailsGrid}>
            <View style={styles.subDetailItem}>
              <Text style={styles.subDetailLabel}>결제 수단</Text>
              <Text style={styles.subDetailValue}>
                {SUBSCRIPTION.cardBrand} •••• {SUBSCRIPTION.cardLast4}
              </Text>
            </View>
            <View style={styles.subDetailItem}>
              <Text style={styles.subDetailLabel}>다음 결제일</Text>
              <Text style={styles.subDetailValue}>
                {SUBSCRIPTION.nextBillingDate}
              </Text>
            </View>
            <View style={styles.subDetailItem}>
              <Text style={styles.subDetailLabel}>월 결제 금액</Text>
              <Text style={[styles.subDetailValue, styles.subAmount]}>
                {formatCurrency(SUBSCRIPTION.monthlyAmount)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Summary Card sub-component
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          valueColor ? { color: valueColor } : undefined,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  bgDark: '#0F1B33',
  cardBg: '#182744',
  cardBorder: '#243555',
  primaryBlue: '#3B5BDB',
  textWhite: '#E0E4EA',
  textSub: '#8893A7',
  accentOrange: '#FF6434',
  successGreen: '#1EB06A',
  warningYellow: '#F0A722',
  errorRed: '#E5423A',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgDark,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  /* ── Header ─────────────────────────────────────────────── */
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminLabel: {
    fontSize: 11,
    color: C.primaryBlue,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  logoutText: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '900',
    color: C.textWhite,
    lineHeight: 34,
  },

  /* ── Summary Grid ───────────────────────────────────────── */
  summaryGrid: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: C.textWhite,
  },

  /* ── Quick Action ───────────────────────────────────────── */
  quickAction: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: C.primaryBlue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Section ────────────────────────────────────────────── */
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textWhite,
    marginBottom: 14,
  },

  /* ── Villa Card ─────────────────────────────────────────── */
  villaCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 18,
    marginBottom: 12,
  },
  villaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  villaName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textWhite,
  },
  unpaidBadge: {
    backgroundColor: 'rgba(255,100,52,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unpaidBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accentOrange,
  },
  villaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  villaDetail: {
    flex: 1,
  },
  villaDetailLabel: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '500',
    marginBottom: 4,
  },
  villaDetailValue: {
    fontSize: 15,
    color: C.textWhite,
    fontWeight: '700',
  },
  villaDetailDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.cardBorder,
    marginHorizontal: 16,
  },

  /* ── Subscription Card ──────────────────────────────────── */
  subscriptionCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subPlanWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subPlanName: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textWhite,
  },
  subStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,176,106,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  subStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.successGreen,
  },
  subStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.successGreen,
  },
  subDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 16,
  },
  subDetailsGrid: {
    gap: 14,
  },
  subDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subDetailLabel: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: '500',
  },
  subDetailValue: {
    fontSize: 14,
    color: C.textWhite,
    fontWeight: '700',
  },
  subAmount: {
    fontSize: 16,
    color: C.primaryBlue,
    fontWeight: '900',
  },
});
