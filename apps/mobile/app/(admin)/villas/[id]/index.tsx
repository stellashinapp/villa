import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { store, subscribe } from '@/lib/store';
import Icon, { type IconName } from '@/components/Icon';
import { updateVilla } from '@/lib/villas';
import { syncAdminFromSupabase } from '@/lib/sync';
import { showToast } from '@/lib/toast';
import { BANK_NAMES } from '@villatolk/shared';

const C = {
  bg: '#F5F6FA', card: '#FFFFFF', border: '#E8EBF0',
  pri: '#4263E8', priL: '#E8EEFB',
  text: '#1A1D26', sub: '#6B7280', muted: '#9CA3AF',
  ok: '#4CAF50', err: '#E74C3C', accent: '#FF6B35',
};

const TABS: Array<{ id: string; icon: IconName; label: string }> = [
  { id: 'bills', icon: 'bills', label: '관리비' },
  { id: 'residents', icon: 'residents', label: '입주민' },
  { id: 'parking', icon: 'parking', label: '주차' },
  { id: 'notices', icon: 'notice', label: '공지' },
  { id: 'messages', icon: 'message', label: '메시지' },
];

export default function VillaDetailScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();
  const [editAccount, setEditAccount] = useState(false);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [bank, setBank] = useState('');
  const [accNum, setAccNum] = useState('');
  const [accHolder, setAccHolder] = useState('');
  const [saving, setSaving] = useState(false);

  const { id } = useLocalSearchParams<{ id: string }>();
  const villa = store.villas.find(v => v.id === id);

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 14 }}>빌라를 찾을 수 없습니다</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pub = villa.billMonths.find(b => b.status === 'published');
  const unpaid = pub ? villa.units.filter(u => u.name && !pub.paid[u.ho]).length : 0;
  const unreadMsg = villa.messages.filter(m => !m.read).length;
  const registered = villa.units.filter(u => u.name).length;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backLink}>← 빌라 목록</Text>
        </TouchableOpacity>
        <Text style={s.villaName}>{villa.name}</Text>
        <Text style={s.villaAddr}>{villa.address}</Text>
      </View>

      {/* 요약 카드 */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{villa.totalUnits}</Text>
          <Text style={s.summaryLabel}>세대</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{registered}</Text>
          <Text style={s.summaryLabel}>입주민</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, unpaid > 0 && { color: C.accent }]}>{unpaid}</Text>
          <Text style={s.summaryLabel}>미납</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, unreadMsg > 0 && { color: C.accent }]}>{unreadMsg}</Text>
          <Text style={s.summaryLabel}>메시지</Text>
        </View>
      </View>

      {/* 빌라 정보 */}
      <View style={s.infoCard}>
        <View style={s.infoRow}><Text style={s.infoLabel}>플랜</Text><Text style={s.infoValue}>{villa.plan} ({villa.price.toLocaleString()}원/월)</Text></View>
        <TouchableOpacity
          style={s.infoRow}
          onPress={() => {
            const [b, n] = (villa.account || '').split(' ');
            setBank(b ?? ''); setAccNum(n ?? ''); setAccHolder('');
            setEditAccount(true);
          }}
          activeOpacity={0.6}
        >
          <Text style={s.infoLabel}>입금계좌</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.infoValue}>{villa.account || '미등록'}</Text>
            <Text style={{ fontSize: 12, color: C.pri, fontWeight: '700' }}>수정</Text>
          </View>
        </TouchableOpacity>
        <View style={s.infoRow}><Text style={s.infoLabel}>층당 세대</Text><Text style={s.infoValue}>{villa.unitsPerFloor}세대</Text></View>
      </View>

      {/* 입금계좌 수정 모달 */}
      <Modal visible={editAccount} transparent animationType="slide" onRequestClose={() => setEditAccount(false)}>
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>입금계좌 수정</Text>
            <Text style={s.modalDesc}>{villa.name} 의 입금계좌입니다. 빌라마다 다르게 설정 가능합니다.</Text>

            <Text style={s.fieldLabel}>은행</Text>
            <TouchableOpacity
              style={[s.input, { justifyContent: 'center' }]}
              onPress={() => setBankPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, color: bank ? C.text : C.muted }}>{bank || '은행 선택'}</Text>
            </TouchableOpacity>

            <Text style={s.fieldLabel}>계좌번호</Text>
            <TextInput
              style={s.input}
              placeholder="예: 123-456-789012"
              placeholderTextColor={C.muted}
              keyboardType="number-pad"
              value={accNum}
              onChangeText={setAccNum}
            />

            <Text style={s.fieldLabel}>예금주 (선택)</Text>
            <TextInput
              style={s.input}
              placeholder="예금주 이름"
              placeholderTextColor={C.muted}
              value={accHolder}
              onChangeText={setAccHolder}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setEditAccount(false)}
                disabled={saving}
              >
                <Text style={s.modalBtnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnSave, saving && { opacity: 0.5 }]}
                disabled={saving}
                onPress={async () => {
                  if (!bank.trim() || !accNum.trim()) {
                    showToast('은행과 계좌번호를 입력하세요', 'warn');
                    return;
                  }
                  setSaving(true);
                  try {
                    await updateVilla(villa.id, {
                      account_bank: bank.trim(),
                      account_number: accNum.trim(),
                      account_holder: accHolder.trim() || undefined,
                    });
                    await syncAdminFromSupabase().catch(() => {});
                    setEditAccount(false);
                    showToast('입금계좌 저장 완료', 'success');
                  } catch (err: any) {
                    Alert.alert('저장 실패', err?.message ?? String(err));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <Text style={s.modalBtnSaveText}>{saving ? '저장 중…' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 은행 선택 모달 */}
      <Modal visible={bankPickerOpen} transparent animationType="slide" onRequestClose={() => setBankPickerOpen(false)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setBankPickerOpen(false)}>
          <View style={[s.modalCard, { maxHeight: '70%' }]}>
            <Text style={s.modalTitle}>은행 선택</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {BANK_NAMES.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[s.bankItem, bank === b && { backgroundColor: '#F1F6FF' }]}
                  onPress={() => { setBank(b); setBankPickerOpen(false); }}
                >
                  <Text style={[s.bankItemText, bank === b && { color: C.pri, fontWeight: '700' }]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 5개 탭 버튼 */}
      <Text style={s.sectionTitle}>관리 메뉴</Text>
      <View style={s.tabGrid}>
        {TABS.map(tab => {
          let badge = '';
          if (tab.id === 'messages' && unreadMsg > 0) badge = String(unreadMsg);
          if (tab.id === 'bills' && unpaid > 0) badge = `미납${unpaid}`;
          if (tab.id === 'residents') badge = `${registered}/${villa.totalUnits}`;

          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/villas/${id}/${tab.id}`)}
            >
              <View style={s.tabIconWrap}>
                <Icon name={tab.icon} size={26} color={C.pri} />
              </View>
              <Text style={s.tabLabel}>{tab.label}</Text>
              {badge ? (
                <View style={[s.tabBadge, tab.id === 'bills' && unpaid > 0 ? { backgroundColor: 'rgba(231,76,60,0.08)' } : {}]}>
                  <Text style={[s.tabBadgeText, tab.id === 'bills' && unpaid > 0 ? { color: C.err } : {}]}>{badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backLink: { fontSize: 14, color: C.pri, fontWeight: '600', marginBottom: 12 },
  villaName: { fontSize: 24, fontWeight: '900', color: C.text },
  villaAddr: { fontSize: 13, color: C.sub, marginTop: 4 },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnText: { color: C.pri, fontSize: 14, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: '900', color: C.text },
  summaryLabel: { fontSize: 11, color: C.sub, marginTop: 2 },
  infoCard: {
    marginHorizontal: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: C.sub },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, paddingHorizontal: 20, marginBottom: 12 },
  tabGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  tabCard: {
    width: '47%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 20, alignItems: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tabIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: C.priL,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  tabLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  tabBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: C.priL, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: C.pri },
  // 입금계좌 수정 모달
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
  modalDesc: { fontSize: 12, color: C.sub, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.sub, marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: C.text, marginBottom: 4 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F3F4F6' },
  modalBtnCancelText: { color: C.sub, fontSize: 14, fontWeight: '700' },
  modalBtnSave: { backgroundColor: C.pri },
  modalBtnSaveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  bankItem: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10 },
  bankItemText: { fontSize: 15, color: C.text },
});
