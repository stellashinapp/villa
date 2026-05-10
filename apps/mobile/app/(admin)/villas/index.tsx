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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { store, subscribe, activateSubscription } from '@/lib/store';
import { syncAdminFromSupabase } from '@/lib/sync';
import Icon, { type IconName } from '@/components/Icon';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  pri: '#4263E8',
  priL: '#E8EEFB',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  ok: '#4CAF50',
  okL: 'rgba(76,175,80,0.08)',
  warn: '#F39C12',
  warnL: 'rgba(243,156,18,0.08)',
  err: '#E74C3C',
  errL: 'rgba(231,76,60,0.08)',
  orange: '#FF6B35',
};

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

function QuickMenuBtn({ icon, label, badge, onPress }: { icon: IconName; label: string; badge?: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.qmBtn} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.qmIconWrap}>
        <Icon name={icon} size={20} color={C.pri} />
        {badge ? (
          <View style={styles.qmBadge}>
            <Text style={styles.qmBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.qmLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function VillasListScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  // 마운트 시 한번 sync — 홈 거치지 않고 직접 들어왔을 때도 빌라 보이게
  useEffect(() => {
    syncAdminFromSupabase().catch(() => {});
  }, []);

  const [showSubPopup, setShowSubPopup] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const villas = store.villas;
  const subscription = store.subscription;

  function handleAddVilla() {
    if (subscription.status === 'none') {
      setShowSubPopup(true);
      return;
    }
    router.push('/(admin)/villas/add');
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerLabel}>ADMIN</Text>
        <Text style={styles.title}>내 빌라</Text>
        <Text style={styles.subtitle}>
          {villas.length}개 빌라 관리 중
        </Text>
      </View>

      {/* Add button */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddVilla}>
          <Text style={styles.addBtnText}>+ 새 빌라 등록</Text>
        </TouchableOpacity>
      </View>

      {/* Villa list */}
      {villas.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>등록된 빌라가 없어요</Text>
          <Text style={[styles.placeholderText, { fontSize: 12, marginTop: 4 }]}>
            새 빌라를 등록해주세요
          </Text>
          <TouchableOpacity
            style={styles.resyncBtn}
            disabled={syncing}
            onPress={async () => {
              setSyncing(true);
              const ok = await syncAdminFromSupabase().catch(() => false);
              setSyncing(false);
              const cnt = store.villas.length;
              const adminId = store.admin?.id ?? '(없음)';
              Alert.alert(
                '동기화 결과',
                `결과: ${ok ? '성공' : '실패'}\n조회된 빌라: ${cnt}개\n관리자 ID: ${adminId}\n\n` +
                  (cnt === 0
                    ? '실제로 DB 에 빌라가 없는 상태입니다. 새 빌라를 등록해주세요.'
                    : '동기화 후 빌라가 보입니다. 화면 새로고침해주세요.'),
              );
            }}
          >
            <Text style={styles.resyncBtnText}>
              {syncing ? '동기화 중…' : '이미 등록했는데 안 보여요? 다시 동기화'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        villas.map(villa => {
          const pub = villa.billMonths.find(b => b.status === 'published');
          const registeredUnits = villa.units.filter(u => u.name).length;
          const unpaid = pub
            ? villa.units.filter(u => u.name && !pub.paid[u.ho]).length
            : 0;
          const unreadMsg = villa.messages.filter(m => !m.read).length;

          // 카드 클릭 시 바로 상세 페이지로 — expand 단계 제거.
          // 상세 페이지에 5개 탭 (관리비/입주민/주차/공지/메시지) 모두 접근 가능.
          return (
            <TouchableOpacity
              key={villa.id}
              style={styles.villaCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/villas/${villa.id}`)}
            >
              {/* Header */}
              <View style={styles.villaHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.villaName}>{villa.name}</Text>
                  <Text style={styles.villaAddress}>{villa.address}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.badge, { backgroundColor: C.okL }]}>
                    <Text style={[styles.badgeText, { color: C.ok }]}>
                      {villa.plan}
                    </Text>
                  </View>
                  <Text style={styles.villaPrice}>{fmt(villa.price)}/월</Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>총 세대</Text>
                  <Text style={styles.statValue}>{villa.totalUnits}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>입주민</Text>
                  <Text style={styles.statValue}>{registeredUnits}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>미납</Text>
                  <Text style={[styles.statValue, unpaid > 0 && { color: C.orange }]}>
                    {unpaid}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>새 메시지</Text>
                  <Text style={[styles.statValue, unreadMsg > 0 && { color: C.orange }]}>
                    {unreadMsg}
                  </Text>
                </View>
              </View>

              {/* 빠른 진입 — 5개 메뉴 */}
              <View style={styles.quickMenu}>
                <QuickMenuBtn icon="bills" label="관리비" onPress={() => router.push(`/(admin)/villas/${villa.id}/bills`)} />
                <QuickMenuBtn icon="residents" label="입주민" onPress={() => router.push(`/(admin)/villas/${villa.id}/residents`)} />
                <QuickMenuBtn icon="parking" label="주차" onPress={() => router.push(`/(admin)/villas/${villa.id}/parking`)} />
                <QuickMenuBtn icon="notice" label="공지" onPress={() => router.push(`/(admin)/villas/${villa.id}/notices`)} />
                <QuickMenuBtn icon="message" label="메시지" onPress={() => router.push(`/(admin)/villas/${villa.id}/messages`)} badge={unreadMsg > 0 ? unreadMsg : undefined} />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Subscription popup - keep dark */}
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
            <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
              <Text style={styles.subscribeBtnText}>결제수단 등록하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowSubPopup(false)}
            >
              <Text style={styles.cancelBtnText}>나중에 할게요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerLabel: {
    fontSize: 11,
    color: C.pri,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 13, color: C.sub, marginTop: 4 },

  addBtn: {
    backgroundColor: C.pri,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  placeholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: C.sub, fontSize: 14 },
  resyncBtn: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  resyncBtnText: { color: C.sub, fontSize: 13, fontWeight: '600' },

  // 빠른 진입 메뉴 (5개) — 빌라 카드 안 하단
  quickMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 4,
  },
  qmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  qmIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.priL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  qmIcon: { fontSize: 18 },
  qmBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: C.err,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qmBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  qmLabel: { fontSize: 11, color: C.text, fontWeight: '700' },

  villaCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  villaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  villaName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  villaAddress: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  villaPrice: {
    fontSize: 12,
    color: C.sub,
    fontWeight: '600',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: C.border,
  },

  expandedSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: C.sub,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  detailBtn: {
    backgroundColor: C.pri,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  /* Modal - keep dark */
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
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(30,176,106,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  modalBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2ECC71',
  },
  subscribeBtn: {
    backgroundColor: '#0064FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#B0BED0',
    fontSize: 14,
  },
});
