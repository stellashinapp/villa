import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { store, subscribe, activateSubscription } from '@/lib/store';

function formatCurrency(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

export default function AdminHomeScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [showSubPopup, setShowSubPopup] = useState(false);

  const villas = store.villas;
  const subscription = store.subscription;

  const totalUnits = villas.reduce((s, v) => s + v.totalUnits, 0);
  const newMessages = villas.reduce(
    (s, v) => s + v.messages.filter(m => !m.read).length,
    0,
  );
  const unpaidUnits = villas.reduce((s, v) => {
    const pub = v.billMonths.find(b => b.status === 'published');
    if (!pub) return s;
    const unpaid = v.units.filter(u => u.name && !pub.paid[u.ho]).length;
    return s + unpaid;
  }, 0);

  function handleAddVilla() {
    if (subscription.status === 'none') {
      setShowSubPopup(true);
      return;
    }
    router.push('/(admin)/villas/add-form');
  }

  function handleSubscribe() {
    activateSubscription();
    setShowSubPopup(false);
    Alert.alert(
      '결제수단 등록 완료',
      '첫 1개월 무료체험이 시작됩니다!\n이제 빌라를 등록하세요.',
      [{ text: '빌라 등록하기', onPress: () => router.push('/(admin)/villas/add') }],
    );
  }

  const SUMMARY = {
    villaCount: villas.length,
    totalUnits,
    unpaidUnits,
    newMessages,
  };

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
        </View>
        <Text style={styles.greeting}>홈</Text>
        <Text style={styles.greetingSub}>관리자님 로그인됨</Text>
      </View>

      {/* ── Summary Cards (3 in row) ─────────────────────────────── */}
      <View style={styles.summaryRow}>
        <SummaryCard icon="🏘️" label="관리 빌라" value={SUMMARY.villaCount} />
        <SummaryCard icon="👥" label="총 세대" value={SUMMARY.totalUnits} />
        <SummaryCard icon="✉️" label="새 메시지" value={SUMMARY.newMessages} />
      </View>

      <StatsDashboard villas={villas} />


      {/* ── 구독 필요 팝업 ────────────────────────────────────── */}
      <Modal visible={showSubPopup} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>구독 등록이 필요합니다</Text>
            <Text style={styles.modalDesc}>
              빌라를 등록하려면 먼저 결제 수단을 연결해주세요.{'\n'}첫 1개월은 무료입니다!
            </Text>

            <View style={styles.modalBanner}>
              <Text style={{ fontSize: 20 }}>🎉</Text>
              <Text style={styles.modalBannerText}>첫 1개월 완전 무료</Text>
            </View>

            {/* 결제수단 등록 */}
            <View style={styles.tossSection}>
              <View style={styles.tossInfo}>
                <Text style={styles.tossInfoTitle}>결제수단 등록 방법</Text>
                <View style={styles.tossStep}>
                  <Text style={styles.tossStepNum}>1</Text>
                  <Text style={styles.tossStepText}>아래 버튼을 누르면 결제창이 열립니다</Text>
                </View>
                <View style={styles.tossStep}>
                  <Text style={styles.tossStepNum}>2</Text>
                  <Text style={styles.tossStepText}>카드 또는 계좌를 등록합니다 (보안결제)</Text>
                </View>
                <View style={styles.tossStep}>
                  <Text style={styles.tossStepNum}>3</Text>
                  <Text style={styles.tossStepText}>등록 완료 후 무료체험이 자동 시작됩니다</Text>
                </View>
              </View>

              <View style={styles.tossMethods}>
                <View style={styles.tossMethodItem}>
                  <Text style={{ fontSize: 24 }}>💳</Text>
                  <Text style={styles.tossMethodLabel}>신용/체크카드</Text>
                </View>
                <View style={styles.tossMethodDivider} />
                <View style={styles.tossMethodItem}>
                  <Text style={{ fontSize: 24 }}>🏦</Text>
                  <Text style={styles.tossMethodLabel}>계좌이체</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.tossBtn} onPress={handleSubscribe}>
                <View style={styles.tossBtnInner}>
                  <Text style={styles.tossBtnText}>결제수단 등록하기</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.tossSecure}>
                <Text style={styles.tossSecureText}>🔒 카드/계좌 정보는 안전하게 관리됩니다</Text>
                <Text style={styles.tossSecureText}>    ANDNEW는 카드번호를 저장하지 않습니다</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSubPopup(false)}>
              <Text style={styles.modalCancelBtnText}>나중에 할게요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 내 빌라 Section ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 빌라</Text>
        {villas.length > 0 ? (
          villas.map((villa) => {
            const pub = villa.billMonths.find(b => b.status === 'published');
            const unpaid = pub
              ? villa.units.filter(u => u.name && !pub.paid[u.ho]).length
              : 0;
            return (
              <TouchableOpacity
                key={villa.id}
                style={styles.villaCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/(admin)/villas/${villa.id}`)}
              >
                <View style={styles.villaCardHeader}>
                  <View>
                    <Text style={styles.villaName}>{villa.name}</Text>
                    <Text style={styles.villaAddr}>{villa.address} · {villa.totalUnits}세대</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: '#9CA3AF' }}>›</Text>
                </View>
                {(() => {
                  const pub2 = villa.billMonths.find(b => b.status === 'published');
                  if (!pub2) return null;
                  const total2 = pub2.items.reduce((sum: number, i: any) => sum + i.amount, 0);
                  const perUnit2 = villa.totalUnits > 0 ? Math.round(total2 / villa.totalUnits) : 0;
                  const paidCount = villa.units.filter(u => u.name && pub2.paid[u.ho]).length;
                  const regCount = villa.units.filter(u => u.name).length;
                  const payRate = regCount > 0 ? Math.round(paidCount / regCount * 100) : 0;
                  return (
                    <View style={styles.billInfoBox}>
                      <View>
                        <Text style={styles.billInfoLabel}>{pub2.label}</Text>
                        <Text style={styles.billInfoAmount}>{formatCurrency(perUnit2)} <Text style={styles.billInfoMeta}>세대당 · {villa.totalUnits}세대</Text></Text>
                      </View>
                      <View style={styles.billInfoRight}>
                        <Text style={styles.billInfoRateLabel}>납부율</Text>
                        <Text style={[styles.billInfoRate, payRate < 70 && { color: C.accentOrange }]}>{payRate}%</Text>
                      </View>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: C.textSub, fontSize: 14 }}>등록된 빌라가 없어요</Text>
            <Text style={{ color: C.textSub, fontSize: 12, marginTop: 4 }}>새 빌라를 등록해주세요</Text>
          </View>
        )}

        {/* 새 빌라 등록 */}
        <TouchableOpacity style={styles.quickAction} activeOpacity={0.8} onPress={handleAddVilla}>
          <Text style={styles.quickActionText}>+ 새 빌라 등록</Text>
        </TouchableOpacity>
      </View>

      {/* ── 서비스 구독 ────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
        <View style={styles.subscriptionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.textPrimary }}>프로 플랜</Text>
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#4CAF50' }}>
                  {subscription.status === 'none' ? '미가입' : '구독중'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: C.textPrimary }}>
              {formatCurrency(villas.reduce((s, v) => s + v.price, 0))}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: C.textSub, marginTop: 6 }}>
            {subscription.cardBrand ? `${subscription.cardBrand} ····${subscription.cardLast4}` : '카드 미등록'} · 다음결제 {subscription.nextBilling || '-'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Stats Dashboard — 최근 6개월 납부율 차트 + 미납/메시지 현황
// ---------------------------------------------------------------------------
function StatsDashboard({ villas }: { villas: typeof store.villas }) {
  const now = new Date();
  const months: Array<{ label: string; yearMonth: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: `${d.getMonth() + 1}월`,
      yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }

  const chart = months.map((m) => {
    let paid = 0, total = 0;
    villas.forEach((v) => {
      const bm = v.billMonths.find((b) => b.yearMonth === m.yearMonth);
      if (bm && bm.status !== 'draft') {
        v.units.filter((u) => u.name).forEach((u) => {
          total++;
          if (bm.paid[u.ho]) paid++;
        });
      }
    });
    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { ...m, rate, paid, total };
  });

  const maxRate = Math.max(100, ...chart.map((c) => c.rate));

  const villaStats = villas.map((v) => {
    const pub = v.billMonths.find((b) => b.status === 'published');
    const regUnits = v.units.filter((u) => u.name);
    const unpaidCount = pub ? regUnits.filter((u) => !pub.paid[u.ho]).length : 0;
    const unreadMsg = v.messages.filter((m) => !m.read).length;
    const pendingMsg = v.messages.filter((m) => m.replies.length === 0).length;
    return { id: v.id, name: v.name, unpaidCount, unreadMsg, pendingMsg };
  });

  const totalRegisteredResidents = villas.reduce(
    (s, v) => s + v.units.filter((u) => u.name).length, 0
  );
  const totalResidents = villas.reduce((s, v) => s + v.totalUnits, 0);
  const occupancyRate = totalResidents > 0 ? Math.round((totalRegisteredResidents / totalResidents) * 100) : 0;

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1D26', marginBottom: 12 }}>📊 운영 통계</Text>

      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 14, padding: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>최근 6개월 납부율</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 }}>
          {chart.map((c) => {
            const h = maxRate > 0 ? (c.rate / maxRate) * 80 : 0;
            return (
              <View key={c.yearMonth} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#1A1D26', fontWeight: '700', marginBottom: 2 }}>{c.rate}%</Text>
                <View style={{ width: '100%', height: 80, justifyContent: 'flex-end' }}>
                  <View style={{ height: h, backgroundColor: c.rate >= 90 ? '#4CAF50' : c.rate >= 70 ? '#F39C12' : '#E74C3C', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{c.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>입주율</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#3454D1' }}>{occupancyRate}%</Text>
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{totalRegisteredResidents}/{totalResidents}세대</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>답변 대기</Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#F39C12' }}>{villaStats.reduce((s, v) => s + v.pendingMsg, 0)}건</Text>
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>빌라 전체</Text>
        </View>
      </View>

      {villaStats.filter((v) => v.unpaidCount > 0).length > 0 && (
        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8EBF0', borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>빌라별 미납</Text>
          {villaStats.filter((v) => v.unpaidCount > 0).map((v) => (
            <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: '#1A1D26', fontWeight: '600' }}>{v.name}</Text>
              <Text style={{ fontSize: 13, color: '#E74C3C', fontWeight: '800' }}>{v.unpaidCount}세대</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Summary Card sub-component
// ---------------------------------------------------------------------------
function SummaryCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  bgLight: '#F5F6FA',
  cardBg: '#FFFFFF',
  cardBorder: '#E8EBF0',
  primaryBlue: '#3454D1',
  primaryLight: '#E8EEFB',
  textPrimary: '#1A1D26',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  accentOrange: '#FF6B35',
  successGreen: '#4CAF50',
  warningYellow: '#F39C12',
  errorRed: '#E74C3C',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgLight,
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
    color: C.textPrimary,
  },
  greetingSub: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 2,
  },

  /* ── Summary Row (3 cards) ───────────────────────────────── */
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: C.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
    marginTop: 2,
  },

  /* ── Quick Action ───────────────────────────────────────── */
  quickAction: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#4A6CF7',
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
    color: C.textPrimary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  villaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  villaName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
  },
  villaAddr: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 3,
  },
  billInfoBox: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billInfoLabel: {
    fontSize: 12,
    color: C.textSub,
    marginBottom: 4,
  },
  billInfoAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: C.textPrimary,
  },
  billInfoMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: C.textSub,
  },
  billInfoRight: {
    alignItems: 'flex-end',
  },
  billInfoRateLabel: {
    fontSize: 11,
    color: C.textSub,
    marginBottom: 2,
  },
  billInfoRate: {
    fontSize: 20,
    fontWeight: '900',
    color: C.successGreen,
  },

  /* ── Subscription Card ──────────────────────────────────── */
  subscriptionCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    color: C.textPrimary,
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
    color: C.textPrimary,
    fontWeight: '700',
  },

  /* ── Modal (keep dark theme) ───────────────────────────── */
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#243B6A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#B0BED0',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,176,106,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30,176,106,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  modalBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2ECC71',
  },
  tossSection: {
    marginTop: 4,
  },
  tossInfo: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  tossInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tossStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tossStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3454D1',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  tossStepText: {
    flex: 1,
    fontSize: 13,
    color: '#B0BED0',
    lineHeight: 20,
  },
  tossMethods: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  tossMethodItem: {
    alignItems: 'center',
    gap: 4,
  },
  tossMethodLabel: {
    fontSize: 12,
    color: '#B0BED0',
    fontWeight: '600',
  },
  tossMethodDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2E4A7A',
  },
  tossBtn: {
    backgroundColor: '#0064FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  tossBtnInner: {
    alignItems: 'center',
    gap: 2,
  },
  tossBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  tossSecure: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  tossSecureText: {
    fontSize: 11,
    color: '#7889A5',
    lineHeight: 18,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelBtnText: {
    color: '#B0BED0',
    fontSize: 14,
  },
});
