import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addVilla, store } from '@/lib/store';
import { getMyAdmin } from '@/lib/auth';
import { createVilla } from '@/lib/villas';
import { syncAdminFromSupabase } from '@/lib/sync';
import { BANK_NAMES, planFor, formatKRW } from '@villatolk/shared';
import { showToast } from '@/lib/toast';
import AddressSearchModal from '@/components/AddressSearchModal';

const C = {
  bg: '#F5F6FA', card: '#FFFFFF', border: '#E8EBF0',
  inputBg: '#F0F2F6', inputBorder: '#E5E7EB',
  pri: '#4263E8', priL: '#E8EEFB',
  text: '#1A1D26', sub: '#6B7280', muted: '#9CA3AF',
  ok: '#4CAF50', err: '#E74C3C',
};

interface UnitData { name: string; }
interface FloorData { label: string; displayLabel: string; units: UnitData[]; }

function makeUnits(floorLabel: string, count: number): UnitData[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `${floorLabel}${String(i + 1).padStart(2, '0')}호`,
  }));
}

export default function AddVillaFormScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null);

  const [floors, setFloors] = useState<FloorData[]>([
    { label: '1', displayLabel: '1층', units: makeUnits('1', 2) },
    { label: '2', displayLabel: '2층', units: makeUnits('2', 2) },
    { label: '3', displayLabel: '3층', units: makeUnits('3', 2) },
    { label: '4', displayLabel: '4층', units: makeUnits('4', 2) },
  ]);

  const [newFloorLabel, setNewFloorLabel] = useState('');
  const totalUnits = floors.reduce((sum, f) => sum + f.units.length, 0);

  // 단일 진실원: shared 패키지의 planFor — 가격표 변경 시 한 곳만 고치면 됨.
  const plan = planFor(totalUnits || 0);

  // 층 추가
  function addFloor(label: string, displayLabel: string) {
    if (floors.find(f => f.label === label)) {
      Alert.alert('알림', '이미 추가된 층입니다');
      return;
    }
    const newFloor: FloorData = { label, displayLabel, units: makeUnits(label, 2) };

    // 지하층은 맨 앞, 일반층은 정렬
    const updated = [...floors, newFloor].sort((a, b) => {
      const aNum = a.label.startsWith('B') ? -parseInt(a.label.slice(1)) : parseInt(a.label) || 999;
      const bNum = b.label.startsWith('B') ? -parseInt(b.label.slice(1)) : parseInt(b.label) || 999;
      return aNum - bNum;
    });
    setFloors(updated);
  }

  function addCustomFloor() {
    const label = newFloorLabel.trim();
    if (!label) { Alert.alert('알림', '층 이름을 입력하세요'); return; }
    const displayLabel = label.startsWith('B') ? `지하${label.slice(1)}층` : `${label}층`;
    addFloor(label, displayLabel);
    setNewFloorLabel('');
  }

  // 층 삭제 — 웹의 Alert.alert 다중버튼 콜백이 안정적이지 않아 Platform 분기.
  function removeFloor(idx: number) {
    const target = floors[idx];
    const msg = `${target.displayLabel}을 삭제하시겠습니까?`;
    const doDelete = () => setFloors((prev) => prev.filter((_, i) => i !== idx));
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        doDelete();
      }
    } else {
      Alert.alert('층 삭제', msg, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  // 세대 추가
  function addUnit(floorIdx: number) {
    const updated = [...floors];
    const floor = updated[floorIdx];
    const num = floor.units.length + 1;
    floor.units.push({ name: `${floor.label}${String(num).padStart(2, '0')}호` });
    setFloors(updated);
  }

  // 세대 삭제
  function removeUnit(floorIdx: number, unitIdx: number) {
    const updated = [...floors];
    updated[floorIdx].units.splice(unitIdx, 1);
    setFloors(updated);
  }

  // 호실 이름 변경
  function renameUnit(floorIdx: number, unitIdx: number, newName: string) {
    const updated = [...floors];
    updated[floorIdx].units[unitIdx].name = newName;
    setFloors(updated);
  }

  const [submitted, setSubmitted] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [showCostPopup, setShowCostPopup] = useState(false);
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // 볼륨 할인율 — 현재 보유 빌라 수 + 새 빌라 1개 기준
  const villaCount = store.villas.length + 1;
  const discRate = villaCount >= 20 ? 0.4 : villaCount >= 10 ? 0.3 : villaCount >= 5 ? 0.2 : 0;

  async function doRegister() {
    setShowCostPopup(false);
    setSubmitted(true);

    const accountStr = bank.trim() && accountNumber.trim() ? `${bank.trim()} ${accountNumber.trim()}` : '';
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const upf = Math.max(1, Math.round(totalUnits / Math.max(1, floors.length)));

    try {
      const me = await getMyAdmin();
      if (!me) {
        setSubmitted(false);
        Alert.alert('로그인 필요', '관리자로 로그인 후 시도해주세요');
        return;
      }

      // 1) Supabase 영속화
      await createVilla({
        name: trimmedName,
        address: trimmedAddress,
        totalUnits,
        unitsPerFloor: upf,
        accountBank: bank.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        accountHolder: me.name ?? undefined,
      });

      // 2) 로컬 store 갱신 (즉시 반영) + 서버 sync
      addVilla({
        name: trimmedName,
        address: trimmedAddress,
        totalUnits,
        unitsPerFloor: upf,
        account: accountStr,
      });
      await syncAdminFromSupabase().catch(() => {});

      // 다중버튼 Alert 가 웹에서 막히는 이슈 → 토스트로 알리고 즉시 홈 이동.
      showToast(`${trimmedName} (${totalUnits}세대) 등록 완료`, 'success', 4000);
      router.replace('/(admin)/home');
    } catch (e) {
      setSubmitted(false);
      Alert.alert('등록 실패', e instanceof Error ? e.message : '다시 시도해주세요');
    }
  }

  function handleSubmit() {
    if (submitted) return;

    // 필드별 에러 체크
    const errs: string[] = [];
    if (!name.trim()) errs.push('name');
    if (!address.trim()) errs.push('address');
    if (totalUnits === 0) errs.push('units');

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);

    setShowCostPopup(true);
  }

  // 다음 층 번호 계산
  const maxFloor = Math.max(0, ...floors.filter(f => !f.label.startsWith('B') && !isNaN(parseInt(f.label))).map(f => parseInt(f.label)));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← 돌아가기</Text>
        </TouchableOpacity>
        <Text style={s.title}>빌라 등록</Text>
      </View>

      {/* 기본 정보 */}
      <View style={s.section}>
        <Text style={s.label}>빌라 이름 *</Text>
        <TextInput style={[s.input, errors.includes('name') && s.inputError]} placeholder="예: 해피빌라" placeholderTextColor={C.muted} value={name} onChangeText={(t) => { setName(t); setErrors(e => e.filter(x => x !== 'name')); }} />
        {errors.includes('name') && <Text style={s.errorText}>빌라 이름을 입력해주세요</Text>}

        <Text style={s.label}>주소 *</Text>
        <TouchableOpacity
          style={[s.input, { justifyContent: 'center' }, errors.includes('address') && s.inputError]}
          onPress={() => setAddressModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, color: address ? C.text : C.muted }}>
            {address || '주소 검색하기'}
          </Text>
        </TouchableOpacity>
        {errors.includes('address') && <Text style={s.errorText}>주소를 입력해주세요</Text>}

        <Text style={s.label}>관리비 입금 은행</Text>
        <TouchableOpacity
          style={[s.input, { justifyContent: 'center' }]}
          onPress={() => setBankPickerOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 15, color: bank ? C.text : C.muted }}>
            {bank || '은행 선택'}
          </Text>
        </TouchableOpacity>

        <Text style={s.label}>계좌번호</Text>
        <TextInput style={s.input} placeholder="예: 123-456-789012" placeholderTextColor={C.muted} value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
      </View>

      {/* 층별 세대 관리 */}
      <View style={s.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={s.sectionTitle}>층별 세대 설정</Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.pri }}>총 {totalUnits}세대</Text>
        </View>
        <Text style={s.hint}>각 층을 눌러서 호실 이름을 직접 수정할 수 있습니다</Text>
        {errors.includes('units') && <Text style={s.errorText}>세대를 1개 이상 추가해주세요</Text>}

        {floors.map((floor, fIdx) => (
          <View key={fIdx} style={s.floorCard}>
            {/* 층 헤더 */}
            <TouchableOpacity
              style={s.floorHeader}
              onPress={() => setExpandedFloor(expandedFloor === fIdx ? null : fIdx)}
              activeOpacity={0.7}
            >
              <View style={s.floorLabelBox}>
                <Text style={s.floorLabelText}>{floor.displayLabel}</Text>
              </View>
              <Text style={s.floorUnitCount}>{floor.units.length}세대</Text>

              <View style={s.unitControl}>
                <TouchableOpacity style={s.unitBtn} onPress={() => { if (floor.units.length > 0) removeUnit(fIdx, floor.units.length - 1); }}>
                  <Text style={s.unitBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.unitBtn} onPress={() => addUnit(fIdx)}>
                  <Text style={s.unitBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => removeFloor(fIdx)}>
                <Text style={{ fontSize: 16, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* 확장: 호실 이름 편집 */}
            {expandedFloor === fIdx && (
              <View style={s.unitsEditor}>
                <Text style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>호실 이름을 탭하여 수정하세요</Text>
                <View style={s.unitChips}>
                  {floor.units.map((unit, uIdx) => (
                    <View key={uIdx} style={s.unitEditRow}>
                      <TextInput
                        style={s.unitEditInput}
                        value={unit.name}
                        onChangeText={(t) => renameUnit(fIdx, uIdx, t)}
                        selectTextOnFocus
                      />
                      <TouchableOpacity onPress={() => removeUnit(fIdx, uIdx)}>
                        <Text style={{ fontSize: 14, color: C.err }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addUnitBtn} onPress={() => addUnit(fIdx)}>
                    <Text style={s.addUnitBtnText}>+ 호실 추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* 층 추가 영역 */}
        <View style={s.addFloorSection}>
          <View style={s.quickBtns}>
            {!floors.find(f => f.label === 'B1') && (
              <TouchableOpacity style={s.quickBtn} onPress={() => addFloor('B1', '지하1층')}>
                <Text style={s.quickBtnText}>+ 지하1층</Text>
              </TouchableOpacity>
            )}
            {!floors.find(f => f.label === 'B2') && floors.find(f => f.label === 'B1') && (
              <TouchableOpacity style={s.quickBtn} onPress={() => addFloor('B2', '지하2층')}>
                <Text style={s.quickBtnText}>+ 지하2층</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.quickBtn} onPress={() => addFloor(String(maxFloor + 1), `${maxFloor + 1}층`)}>
              <Text style={s.quickBtnText}>+ {maxFloor + 1}층</Text>
            </TouchableOpacity>
          </View>

          <View style={s.addFloorRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="직접 입력 (예: B3, 옥탑, 상가)"
              placeholderTextColor={C.muted}
              value={newFloorLabel}
              onChangeText={setNewFloorLabel}
            />
            <TouchableOpacity style={s.addFloorBtn} onPress={addCustomFloor}>
              <Text style={s.addFloorBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 플랜 + 전체 호실 미리보기 */}
      {totalUnits > 0 && (
        <View style={s.section}>
          <View style={s.planCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={s.planName}>{plan.name} 플랜</Text>
                <Text style={s.planRange}>{plan.range}</Text>
              </View>
              <Text style={s.planPrice}>월 {plan.price.toLocaleString()}원</Text>
            </View>
            <View style={s.trialBanner}>
              <Text style={s.trialText}>🎉 첫 1개월 무료</Text>
            </View>
          </View>

          <Text style={[s.sectionTitle, { marginTop: 16 }]}>전체 호실 미리보기 ({totalUnits}개)</Text>
          <Text style={{ fontSize: 12, color: C.sub, marginBottom: 8, paddingHorizontal: 0 }}>호실 이름을 탭하여 수정할 수 있습니다</Text>
          <View style={s.previewGrid}>
            {floors.map((floor, fIdx) => (
              <View key={fIdx} style={s.previewFloor}>
                <Text style={s.previewFloorLabel}>{floor.displayLabel}</Text>
                <View style={s.previewUnits}>
                  {floor.units.map((unit, uIdx) => (
                    <View key={uIdx} style={s.previewChipEdit}>
                      <TextInput
                        style={s.previewChipInput}
                        value={unit.name}
                        onChangeText={(t) => renameUnit(fIdx, uIdx, t)}
                        selectTextOnFocus
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 은행 선택 모달 */}
      <Modal
        visible={bankPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBankPickerOpen(false)}
      >
        <TouchableOpacity
          style={s.bankModalBg}
          activeOpacity={1}
          onPress={() => setBankPickerOpen(false)}
        >
          <View style={s.bankModalCard}>
            <Text style={s.bankModalTitle}>은행 선택</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {BANK_NAMES.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[
                    s.bankItem,
                    bank === b && { backgroundColor: '#F1F6FF' },
                  ]}
                  onPress={() => {
                    setBank(b);
                    setBankPickerOpen(false);
                  }}
                >
                  <Text style={[
                    s.bankItemText,
                    bank === b && { color: C.pri, fontWeight: '700' },
                  ]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 등록 확인 팝업 */}
      <Modal visible={showCostPopup} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>등록 정보 확인</Text>

            <View style={s.costSection}>
              <View style={s.costRow}>
                <Text style={s.costName}>{name.trim() || '새 빌라'}</Text>
                <Text style={s.costPrice}>{totalUnits}세대 · {plan.name} 플랜</Text>
              </View>
              <View style={[s.costRow, { marginTop: 10 }]}>
                <Text style={s.priceLabel}>월 이용료</Text>
                <Text style={s.priceValue}>{formatKRW(plan.price)}</Text>
              </View>
              {discRate > 0 && (
                <View style={[s.costRow, { marginTop: 6 }]}>
                  <Text style={s.discLabel}>볼륨 할인 적용 시</Text>
                  <Text style={s.discValue}>
                    {formatKRW(Math.round(plan.price * (1 - discRate)))} ({Math.round(discRate * 100)}%)
                  </Text>
                </View>
              )}
            </View>

            <View style={s.costDivider} />

            <View style={{ backgroundColor: 'rgba(52,84,209,0.13)', borderRadius: 10, padding: 12, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                <View style={{
                  width: 18, height: 18, borderRadius: 9,
                  backgroundColor: C.pri,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', lineHeight: 14 }}>!</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.pri }}>비용 안내</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.text, lineHeight: 18 }}>
                등록하시는 빌라의 세대수에 따라 플랜이 자동 결정되며 그에 따라 월 이용료가 달라집니다.
                {discRate > 0 && `\n현재 빌라 보유 수 기준 볼륨 할인 ${Math.round(discRate * 100)}%가 적용됩니다.`}
              </Text>
            </View>

            <View style={{ gap: 8, marginTop: 20 }}>
              <TouchableOpacity style={s.submitBtn} onPress={doRegister}>
                <Text style={s.submitBtnText}>확인, 등록하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCostPopup(false)}>
                <Text style={s.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 주소 검색 (다음/카카오 우편번호) */}
      <AddressSearchModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSelected={({ address: picked }) => {
          setAddress(picked);
          setErrors((prev) => prev.filter((x) => x !== 'address'));
        }}
      />

      {/* 등록 버튼 */}
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <TouchableOpacity style={[s.submitBtn, submitted && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitted}>
          <Text style={s.submitBtnText}>등록하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  backText: { fontSize: 14, color: C.pri, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: C.text },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  hint: { fontSize: 12, color: C.sub, marginBottom: 14, lineHeight: 18 },

  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 12, padding: 14, fontSize: 15, color: C.text, marginBottom: 4,
  },
  inputError: {
    borderColor: C.err, borderWidth: 1.5, backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12, color: C.err, fontWeight: '600', marginBottom: 8, marginLeft: 4,
  },

  // 은행 선택 모달
  bankModalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  bankModalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20,
  },
  bankModalTitle: {
    fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12, paddingHorizontal: 4,
  },
  bankItem: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10 },
  bankItemText: { fontSize: 15, color: C.text },

  // 층 카드
  floorCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  floorHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
  },
  floorLabelBox: {
    backgroundColor: C.priL, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 65, alignItems: 'center',
  },
  floorLabelText: { fontSize: 13, fontWeight: '700', color: C.pri },
  floorUnitCount: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },

  unitControl: { flexDirection: 'row', gap: 6 },
  unitBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.inputBg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.inputBorder,
  },
  unitBtnText: { fontSize: 16, fontWeight: '700', color: C.text },

  // 호실 편집 (확장)
  unitsEditor: {
    padding: 12, paddingTop: 0, borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: '#FAFBFD',
  },
  unitChips: { gap: 6 },
  unitEditRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  unitEditInput: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: 8, padding: 10, fontSize: 14, color: C.text,
  },
  addUnitBtn: {
    backgroundColor: C.priL, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4,
  },
  addUnitBtnText: { fontSize: 13, fontWeight: '700', color: C.pri },

  // 층 추가
  addFloorSection: { marginTop: 12 },
  quickBtns: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  quickBtn: { backgroundColor: C.priL, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  quickBtnText: { fontSize: 12, fontWeight: '700', color: C.pri },
  addFloorRow: { flexDirection: 'row', gap: 8 },
  addFloorBtn: { backgroundColor: C.pri, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addFloorBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // 플랜 카드
  planCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  planName: { fontSize: 16, fontWeight: '800', color: C.text },
  planRange: { fontSize: 12, color: C.sub, marginTop: 2 },
  planPrice: { fontSize: 18, fontWeight: '900', color: C.pri },
  trialBanner: { backgroundColor: 'rgba(66,99,232,0.10)', borderRadius: 8, padding: 10, marginTop: 12, alignItems: 'center' },
  trialText: { fontSize: 13, fontWeight: '700', color: C.pri },

  // 호실 미리보기
  previewGrid: { marginTop: 10, gap: 8 },
  previewFloor: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12,
  },
  previewFloorLabel: { fontSize: 12, fontWeight: '700', color: C.pri, marginBottom: 6 },
  previewUnits: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewChip: { backgroundColor: C.inputBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  previewChipText: { fontSize: 12, fontWeight: '600', color: C.text },
  previewChipEdit: { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.inputBorder },
  previewChipInput: { fontSize: 13, fontWeight: '600', color: C.text, paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, textAlign: 'center' },

  // 버튼
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.text, marginBottom: 16 },
  costSection: { marginBottom: 4 },
  costLabel: { fontSize: 12, fontWeight: '700', color: C.sub, marginBottom: 8 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  costName: { fontSize: 14, color: C.text },
  costPrice: { fontSize: 14, fontWeight: '700', color: C.text },
  priceLabel: { fontSize: 13, color: C.sub, fontWeight: '600' },
  priceValue: { fontSize: 20, fontWeight: '900', color: C.pri },
  discLabel: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  discValue: { fontSize: 13, color: '#4CAF50', fontWeight: '800' },
  costEmpty: { fontSize: 13, color: C.muted },
  costDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  costTotalLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  costTotalPrice: { fontSize: 20, fontWeight: '900', color: C.pri },

  submitBtn: { backgroundColor: C.pri, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: C.sub, fontSize: 14, fontWeight: '600' },
});
