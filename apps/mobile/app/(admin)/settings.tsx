import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { store, subscribe, notify } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { syncAdminFromSupabase } from '@/lib/sync';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#3454D1',
  priL: '#E8EEFB',
  ok: '#4CAF50',
  okL: 'rgba(76,175,80,0.08)',
  warn: '#F39C12',
  warnL: 'rgba(243,156,18,0.08)',
  err: '#E74C3C',
  errL: 'rgba(231,76,60,0.08)',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
};

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function AdminSettingsScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const sub = store.subscription;
  const villas = store.villas;

  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Derive subscription items from store.villas
  const items = villas.map(v => ({
    id: v.id,
    villaName: v.name,
    units: v.totalUnits,
    plan: v.plan,
    price: v.price,
  }));

  const totalRaw = items.reduce((s, i) => s + i.price, 0);
  const villaCount = items.length;
  const discRate = villaCount >= 20 ? 0.4 : villaCount >= 10 ? 0.3 : villaCount >= 5 ? 0.2 : 0;
  const totalDisc = Math.round(totalRaw * (1 - discRate));

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    none: { label: '미가입', color: C.muted, bg: 'rgba(156,163,175,0.08)' },
    trialing: { label: '무료체험', color: C.pri, bg: C.priL },
    active: { label: '구독중', color: C.ok, bg: C.okL },
    past_due: { label: '결제실패', color: C.err, bg: C.errL },
    pending_cancel: { label: '해지예정', color: C.warn, bg: C.warnL },
    cancelled: { label: '해지됨', color: C.err, bg: C.errL },
  };
  const st = statusMap[sub.status] || statusMap.none;

  function handleDeleteItem(villaId: string) {
    const item = items.find(i => i.id === villaId);
    Alert.alert(
      '빌라 삭제',
      `정말 ${item?.villaName ?? '이 빌라'}를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('villas')
                .update({ status: 'inactive' })
                .eq('id', villaId);
              if (error) throw error;
              // local cleanup
              store.villas = store.villas.filter((v) => v.id !== villaId);
              notify();
              // resync
              await syncAdminFromSupabase();
              Alert.alert('완료', '빌라가 삭제되었습니다');
            } catch (e) {
              Alert.alert('실패', e instanceof Error ? e.message : '삭제에 실패했습니다');
            }
          },
        },
      ],
    );
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (e) {
      console.warn('[settings] signOut failed:', e);
    }
    router.replace('/');
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={s.header}>
        <Text style={s.headerLabel}>ADMIN</Text>
        <Text style={s.headerTitle}>설정</Text>
      </View>

      {/* ====== 구독 현황 ====== */}
      <Text style={s.sectionTitle}>구독 현황</Text>
      <View style={[s.card, { borderColor: 'rgba(52,84,209,0.2)' }]}>
        <View style={s.subHeader}>
          <View>
            <Text style={s.subPlan}>
              {villaCount > 0 ? `${villaCount}개 빌라 구독` : '구독 없음'}
            </Text>
            <Badge {...st} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.subTotal}>{fmt(totalDisc)}</Text>
            <Text style={s.subPerMonth}>/월</Text>
          </View>
        </View>

        {discRate > 0 && (
          <View style={[s.discBanner, { marginTop: 12 }]}>
            <Text style={s.discText}>
              볼륨 할인 {Math.round(discRate * 100)}% 적용 (정가 {fmt(totalRaw)})
            </Text>
          </View>
        )}

        <View style={s.divider} />

        {sub.cardBrand ? (
          <>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>결제 수단</Text>
              <Text style={s.infoValue}>
                {sub.cardBrand} ···· {sub.cardLast4}
              </Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>결제일</Text>
              <Text style={s.infoValue}>매월 {sub.billingDay}일</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>다음 결제</Text>
              <Text style={s.infoValue}>{sub.nextBilling}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>구독 시작일</Text>
              <Text style={s.infoValue}>{sub.startDate}</Text>
            </View>
          </>
        ) : (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>결제 수단</Text>
            <Text style={[s.infoValue, { color: C.muted }]}>미등록</Text>
          </View>
        )}
      </View>

      {/* ====== 빌라별 구독 ====== */}
      <Text style={s.sectionTitle}>빌라별 구독 내역</Text>
      {items.length === 0 ? (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 20 }]}>
          <Text style={{ color: C.sub, fontSize: 13 }}>등록된 빌라가 없습니다</Text>
        </View>
      ) : (
        items.map(item => (
          <View key={item.id} style={s.card}>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.villaName}</Text>
                <Text style={s.itemMeta}>
                  {item.units}세대 · {item.plan} 플랜
                </Text>
              </View>
              <Text style={s.itemPrice}>{fmt(item.price)}</Text>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDeleteItem(item.id)}
              >
                <Text style={s.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {discRate > 0 && (
        <View style={s.discSummary}>
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: C.ok }]}>
              볼륨 할인 ({villaCount}개 빌라 {Math.round(discRate * 100)}%)
            </Text>
            <Text style={[s.infoValue, { color: C.ok }]}>-{fmt(totalRaw - totalDisc)}</Text>
          </View>
          <View
            style={[
              s.infoRow,
              {
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingTop: 8,
                marginTop: 4,
              },
            ]}
          >
            <Text style={[s.infoLabel, { color: C.text, fontWeight: '700' }]}>월 총 결제액</Text>
            <Text style={{ color: C.pri, fontSize: 18, fontWeight: '900' }}>{fmt(totalDisc)}</Text>
          </View>
        </View>
      )}

      {/* ====== 결제 수단 변경 ====== */}
      <Text style={s.sectionTitle}>결제 수단</Text>
      <View style={s.card}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>현재 등록</Text>
          <Text style={s.infoValue}>
            {sub.cardBrand
              ? `💳 ${sub.cardBrand} ···· ${sub.cardLast4}`
              : '미등록'}
          </Text>
        </View>
        <View style={s.divider} />
        <TouchableOpacity
          style={s.tossBtn}
          onPress={async () => {
            try {
              const { supabase } = await import('@/lib/supabase');
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('로그인 필요', '다시 로그인 후 시도해주세요');
                return;
              }
              const { data: admin } = await supabase
                .from('admins')
                .select('id, name')
                .eq('auth_id', user.id)
                .maybeSingle();
              if (!admin) {
                Alert.alert('오류', '관리자 정보를 찾을 수 없습니다');
                return;
              }
              router.push({
                pathname: '/payment/billing',
                params: { adminId: admin.id, customerName: admin.name ?? '관리자' },
              });
            } catch (err) {
              Alert.alert('오류', String(err));
            }
          }}
        >
          <Text style={s.tossBtnText}>결제수단 변경하기</Text>
        </TouchableOpacity>
        <Text style={s.tossSecure}>🔒 카드/계좌 정보는 안전하게 관리됩니다</Text>
      </View>

      {/* ====== 관리비 입금 계좌 ====== */}
      <Text style={s.sectionTitle}>관리비 입금 계좌</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="은행명"
          placeholderTextColor={C.muted}
          value={accountBank}
          onChangeText={setAccountBank}
        />
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          placeholder="계좌번호"
          placeholderTextColor={C.muted}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
        />
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          placeholder="예금주"
          placeholderTextColor={C.muted}
          value={accountHolder}
          onChangeText={setAccountHolder}
        />
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 10 }]}
          onPress={() => Alert.alert('저장됨', '계좌 정보가 변경되었습니다.')}
        >
          <Text style={s.primaryBtnText}>계좌 정보 저장</Text>
        </TouchableOpacity>
      </View>

      {/* ====== 계정 정보 ====== */}
      <Text style={s.sectionTitle}>계정 정보</Text>
      <View style={s.card}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>이름</Text>
          <Text style={s.infoValue}>{store.admin.name}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>빌라 수</Text>
          <Text style={s.infoValue}>{villaCount}개</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>앱 버전</Text>
          <Text style={s.infoValue}>v1.0.0</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>고객센터</Text>
          <Text style={[s.infoValue, { color: C.pri }]}>1544-0000</Text>
        </View>
      </View>

      {/* ====== 구독 해지 ====== */}
      <View style={s.cancelSection}>
        <Text style={s.cancelTitle}>구독 해지</Text>
        <Text style={s.cancelDesc}>
          해지 시 현재 결제 기간 종료일까지 정상 이용 가능합니다.
        </Text>
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() =>
            Alert.alert('구독 해지', '정말 해지하시겠습니까?', [
              { text: '취소' },
              { text: '해지', style: 'destructive' },
            ])
          }
        >
          <Text style={s.cancelBtnText}>구독 해지 요청</Text>
        </TouchableOpacity>
      </View>

      {/* ====== 언어 설정 ====== */}
      <Text style={s.sectionTitle}>언어 / Language</Text>
      <View style={[s.card, { flexDirection: 'row', gap: 8 }]}>
        <LangButton lang="ko" label="한국어" />
        <LangButton lang="en" label="English" />
      </View>

      {/* ====== 약관 및 정책 ====== */}
      <Text style={s.sectionTitle}>약관 및 정책</Text>
      <View style={s.card}>
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => router.push('/legal/terms')}
          activeOpacity={0.7}
        >
          <Text style={s.legalLabel}>이용약관</Text>
          <Text style={s.legalChevron}>›</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => router.push('/legal/privacy')}
          activeOpacity={0.7}
        >
          <Text style={s.legalLabel}>개인정보 처리방침</Text>
          <Text style={s.legalChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ====== 로그아웃 ====== */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <Text style={s.footer}>ANDNEW · TheZoomWorks · 2026</Text>
    </ScrollView>
  );
}

function LangButton({ lang, label }: { lang: 'ko' | 'en'; label: string }) {
  const [current, setCurrent] = useState<'ko' | 'en'>('ko');
  useEffect(() => {
    import('@/lib/i18n').then((m) => setCurrent(m.getCurrentLanguage()));
  }, []);
  const active = current === lang;
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: active ? C.pri : C.inputBg,
        borderWidth: 1,
        borderColor: active ? C.pri : C.inputBorder,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
      }}
      onPress={async () => {
        const { changeLanguage } = await import('@/lib/i18n');
        await changeLanguage(lang);
        setCurrent(lang);
      }}
    >
      <Text style={{ color: active ? '#fff' : C.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerLabel: { fontSize: 11, color: C.pri, fontWeight: '700', letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.text, marginTop: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subPlan: { fontSize: 16, fontWeight: '800', color: C.text },
  subTotal: { fontSize: 22, fontWeight: '900', color: C.pri },
  subPerMonth: { fontSize: 12, color: C.sub },
  discBanner: {
    backgroundColor: C.okL,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  discText: { fontSize: 12, color: C.ok, fontWeight: '600' },
  discSummary: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 13, color: C.sub },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: C.text },
  itemMeta: { fontSize: 12, color: C.sub, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: C.text },
  deleteBtn: {
    backgroundColor: C.errL,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: { fontSize: 11, fontWeight: '700', color: C.err },
  tossBtn: {
    backgroundColor: '#0064FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  tossBtnText: { fontSize: 15, color: '#fff', fontWeight: '800', marginTop: 2 },
  tossSecure: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.text,
  },
  primaryBtn: {
    backgroundColor: C.pri,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelSection: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(231,76,60,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.12)',
  },
  cancelTitle: { fontSize: 14, fontWeight: '700', color: C.err, marginBottom: 6 },
  cancelDesc: { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 14 },
  cancelBtn: {
    backgroundColor: C.err,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(231,76,60,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.12)',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutText: { color: C.err, fontSize: 15, fontWeight: '700' },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legalLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  legalChevron: { fontSize: 20, color: C.muted, fontWeight: '400' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: C.muted },
});
