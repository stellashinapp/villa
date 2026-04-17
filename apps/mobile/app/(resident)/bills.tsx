import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const BILL_ITEMS = [
  { label: '공용전기', amount: 189000, color: '#3B5BDB' },
  { label: '상하수도', amount: 234000, color: '#1EB06A' },
  { label: '건물보험', amount: 124000, color: '#F0A722' },
  { label: '청소용역', amount: 200000, color: '#EC4899' },
  { label: '소독/방역', amount: 80000, color: '#E5423A' },
  { label: '수선충당금', amount: 50000, color: '#7C7F87' },
];

const TOTAL = BILL_ITEMS.reduce((s, i) => s + i.amount, 0);

const PREV_MONTHS = [
  { month: '2026년 2월', amount: 105200, paid: true },
  { month: '2026년 1월', amount: 112300, paid: true },
  { month: '2025년 12월', amount: 98700, paid: true },
];

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

export default function BillsScreen() {
  const [paid, setPaid] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>관리비</Text>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroGradient}>
          <Text style={styles.heroLabel}>2026년 3월 관리비</Text>
          <Text style={styles.heroAmount}>109,625원</Text>
          <Text style={styles.heroSub}>총 {fmt(TOTAL)}원 ÷ 8세대</Text>
          <View style={[styles.badge, paid ? styles.badgePaid : styles.badgeUnpaid]}>
            <Text style={[styles.badgeText, paid ? styles.badgePaidText : styles.badgeUnpaidText]}>
              {paid ? '납부완료' : '미납'}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Button / Account */}
      {!paid ? (
        <TouchableOpacity style={styles.payButton} onPress={() => setPaid(true)} activeOpacity={0.8}>
          <Text style={styles.payButtonText}>💳 납부하기</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.accountCard}>
        <Text style={styles.accountLabel}>납부 계좌</Text>
        <Text style={styles.accountNumber}>국민 123-456-789012</Text>
      </View>

      {/* Bill Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>항목별 내역</Text>
        {BILL_ITEMS.map((item) => {
          const pct = (item.amount / TOTAL) * 100;
          return (
            <View key={item.label} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemAmount}>{fmt(item.amount)}원</Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[styles.progressBar, { width: `${pct}%`, backgroundColor: item.color }]}
                />
              </View>
              <Text style={styles.itemPct}>{pct.toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Previous Months */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>이전 관리비</Text>
        {PREV_MONTHS.map((m) => (
          <View key={m.month} style={styles.prevCard}>
            <View>
              <Text style={styles.prevMonth}>{m.month}</Text>
              <Text style={styles.prevAmount}>{fmt(m.amount)}원</Text>
            </View>
            <View style={[styles.badge, styles.badgePaid]}>
              <Text style={[styles.badgeText, styles.badgePaidText]}>납부완료</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#181A20' },

  heroCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  heroGradient: {
    backgroundColor: '#1B2845',
    padding: 24,
    alignItems: 'center',
  },
  heroLabel: { color: '#ffffffcc', fontSize: 14, marginBottom: 4 },
  heroAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginBottom: 4 },
  heroSub: { color: '#ffffff99', fontSize: 13, marginBottom: 12 },

  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgePaid: { backgroundColor: '#1EB06A22' },
  badgeUnpaid: { backgroundColor: '#E5423A22' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  badgePaidText: { color: '#1EB06A' },
  badgeUnpaidText: { color: '#E5423A' },

  payButton: {
    marginHorizontal: 16,
    backgroundColor: '#3B5BDB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  accountCard: {
    marginHorizontal: 16,
    backgroundColor: '#E8EEFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  accountLabel: { color: '#3B5BDB', fontSize: 13, fontWeight: '700' },
  accountNumber: { color: '#181A20', fontSize: 15, fontWeight: '800' },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181A20', marginBottom: 12 },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#181A20' },
  itemAmount: { fontSize: 14, fontWeight: '800', color: '#181A20' },
  progressBg: {
    height: 8,
    backgroundColor: '#F3F4F8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: { height: 8, borderRadius: 4 },
  itemPct: { fontSize: 11, color: '#7C7F87', textAlign: 'right' },

  prevCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  prevMonth: { fontSize: 14, fontWeight: '600', color: '#181A20', marginBottom: 2 },
  prevAmount: { fontSize: 13, color: '#7C7F87' },
});
