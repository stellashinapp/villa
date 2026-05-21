'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BANK_NAMES, getBankCode, planFor, formatKRW } from '@villatolk/shared';

type DuplicateCandidate = {
  id: string;
  name: string;
  address: string;
  admin_name: string | null;
};

type UnitRow = { ho: string; tempId: string };

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: { address: string; roadAddress?: string }) => void; onclose?: () => void }) => { open: () => void };
    };
  }
}

export default function AdminVillaAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [existingVillaCount, setExistingVillaCount] = useState(0);
  const [prevAccount, setPrevAccount] = useState<{ bank: string; number: string; holder: string } | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [ownDuplicate, setOwnDuplicate] = useState<DuplicateCandidate | null>(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const [forceProceed, setForceProceed] = useState(false);

  // 관리자 연락처 노출 + 특이사항
  const [exposeAdminContact, setExposeAdminContact] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  // 빌라 기본 정보
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // 자동 생성 설정
  const [aboveTotal, setAboveTotal] = useState('');
  const [unitsPerFloor, setUnitsPerFloor] = useState('');
  const [startFloor, setStartFloor] = useState('1');
  const [basementCount, setBasementCount] = useState('0');
  const [rooftopCount, setRooftopCount] = useState('0');

  // 호실 리스트 (자동 생성 후 사용자가 편집 가능)
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [autoLocked, setAutoLocked] = useState(true); // false 시 직접 편집 모드
  const [customUnitName, setCustomUnitName] = useState('');

  // 입금 계좌
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) 다음 우편번호 스크립트 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.daum?.Postcode) return;
    const s = document.createElement('script');
    s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // 2) 관리자 정보 + 이전 계좌 조회
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: a } = await supabase.from('admins').select('id, name, phone').eq('auth_id', user.id).maybeSingle();
      if (!a) return;
      const ar = a as { id: string; name: string | null; phone: string | null };
      setAdminId(ar.id);
      // 이름이 비어있으면 이메일(아이디)로 표시 (?? 는 빈 문자열을 못 걸러서 || 사용)
      setAdminName(ar.name?.trim() || user.email || null);
      setAdminPhone(ar.phone);

      // 내 빌라 개수 + 계좌 정보 (있는 가장 최근 1건)
      const { data: vs, count } = await supabase
        .from('villas')
        .select('account_bank, account_number, account_holder', { count: 'exact' })
        .eq('admin_id', ar.id)
        .not('account_number', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      setExistingVillaCount(count ?? 0);
      const last = (vs ?? [])[0] as { account_bank: string; account_number: string; account_holder: string } | undefined;
      if (last) {
        setPrevAccount({ bank: last.account_bank, number: last.account_number, holder: last.account_holder });
      }
    })();
  }, []);

  // 3) 중복 후보 디바운스
  useEffect(() => {
    const n = name.trim();
    const a = address.trim();
    if (n.length < 2 || a.length < 5) {
      setDuplicates([]);
      return;
    }
    setDuplicateChecking(true);
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('villas')
        .select('id, name, address, admin_id, admins(name)')
        .or(`name.ilike.%${n.replace(/[,()%*]/g, ' ')}%,address.ilike.%${(address.trim() || n).replace(/[,()%*]/g, ' ')}%`)
        .limit(8);
      const rows = (data ?? []) as unknown as { id: string; name: string; address: string; admin_id: string; admins: { name: string | null } | null }[];
      // 본인 빌라 중복 (이미 내가 등록한 같은 이름/주소) — 실수 방지
      const mine = rows.find(v => v.admin_id === adminId && (v.name.trim() === n || v.address.includes(address.trim())));
      setOwnDuplicate(mine ? { id: mine.id, name: mine.name, address: mine.address, admin_name: mine.admins?.name ?? null } : null);
      // 타 관리자 중복 후보
      const cands: DuplicateCandidate[] = rows
        .filter(v => v.admin_id !== adminId)
        .map(v => ({ id: v.id, name: v.name, address: v.address, admin_name: v.admins?.name ?? null }));
      setDuplicates(cands);
      setDuplicateChecking(false);
    }, 600);
    return () => clearTimeout(handle);
  }, [name, address, adminId]);

  // 4) 자동 생성 → units 갱신
  function regenerate(): UnitRow[] {
    const aboveT = parseInt(aboveTotal, 10) || 0;
    const perFloor = parseInt(unitsPerFloor, 10) || aboveT || 1;
    const startF = parseInt(startFloor, 10) || 1;
    const basement = parseInt(basementCount, 10) || 0;
    const rooftop = parseInt(rooftopCount, 10) || 0;

    const list: UnitRow[] = [];

    // 지하 (B1호, B2호 ... 또는 지하1호, 지하2호 — 다음 의도는 사용자 편집 가능)
    for (let i = 1; i <= basement; i++) {
      list.push({ ho: `B${i}호`, tempId: `b${i}` });
    }

    // 지상층
    for (let i = 0; i < aboveT; i++) {
      const floor = startF + Math.floor(i / perFloor);
      const unit = (i % perFloor) + 1;
      list.push({ ho: `${floor}${String(unit).padStart(2, '0')}호`, tempId: `g${i}` });
    }

    // 옥탑
    for (let i = 1; i <= rooftop; i++) {
      list.push({ ho: rooftop === 1 ? '옥탑호' : `옥탑${i}호`, tempId: `r${i}` });
    }

    return list;
  }

  function applyAutoGenerate() {
    setUnits(regenerate());
    setAutoLocked(false);
  }

  // 미리보기 (자동 잠긴 상태) — 입력 즉시 미리보기
  const previewUnits = useMemo(() => regenerate(), [aboveTotal, unitsPerFloor, startFloor, basementCount, rooftopCount]);

  // 편집 모드에서 변경
  function renameUnit(tempId: string, newName: string) {
    setUnits(units.map(u => u.tempId === tempId ? { ...u, ho: newName } : u));
  }
  function removeUnit(tempId: string) {
    setUnits(units.filter(u => u.tempId !== tempId));
  }
  function addCustomUnit() {
    if (!customUnitName.trim()) return;
    setUnits([...units, { ho: customUnitName.trim(), tempId: `c${Date.now()}` }]);
    setCustomUnitName('');
  }

  function openPostcode() {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      alert('주소 검색 스크립트 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setAddress(data.roadAddress || data.address);
      },
    }).open();
  }

  function loadPrevAccount() {
    if (!prevAccount) return;
    setAccountBank(prevAccount.bank);
    setAccountNumber(prevAccount.number);
    setAccountHolder(prevAccount.holder);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!adminId) { setError('관리자 정보를 가져올 수 없습니다. 다시 로그인해주세요.'); return; }
    if (!name.trim()) { setError('빌라 이름을 입력해주세요'); return; }
    if (!address.trim()) { setError('주소를 입력해주세요'); return; }

    // 호실: 편집 모드면 units 사용, 자동 잠긴 모드면 미리보기 사용
    const finalUnits = autoLocked ? previewUnits : units;
    if (finalUnits.length === 0) {
      setError('최소 1개 이상의 호실이 필요합니다');
      return;
    }
    if (finalUnits.length > 300) {
      setError('호실은 최대 300개까지 가능합니다');
      return;
    }
    // 빈 이름 검증
    const empty = finalUnits.find(u => !u.ho.trim());
    if (empty) { setError('빈 호실 이름이 있습니다 — 모두 입력해주세요'); return; }
    // 중복 이름 검증
    const dupes = finalUnits.map(u => u.ho.trim()).filter((v, i, a) => a.indexOf(v) !== i);
    if (dupes.length > 0) { setError(`중복된 호실 이름이 있습니다: ${[...new Set(dupes)].join(', ')}`); return; }

    if (ownDuplicate) {
      setError(`이미 동일한 빌라 "${ownDuplicate.name}" 를 등록하셨습니다. 중복 등록을 막았습니다.`);
      return;
    }

    if (duplicates.length > 0 && !forceProceed) {
      setError('비슷한 이름·주소의 빌라가 이미 등록되어 있습니다. 아래 안내 확인 후 체크해주세요.');
      return;
    }

    setSubmitting(true);

    const fullAddress = address.trim();

    const { data: villaRow, error: villaErr } = await supabase
      .from('villas')
      .insert({
        admin_id: adminId,
        name: name.trim(),
        address: fullAddress,
        total_units: finalUnits.length,
        units_per_floor: parseInt(unitsPerFloor, 10) || null,
        account_bank: accountBank.trim() || null,
        account_bank_code: accountBank.trim() ? getBankCode(accountBank.trim()) : null,
        account_number: accountNumber.trim() || null,
        account_holder: accountHolder.trim() || null,
        expose_admin_contact: exposeAdminContact,
        special_notes: specialNotes.trim() || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (villaErr || !villaRow) {
      setError('빌라 생성 실패: ' + (villaErr?.message ?? 'unknown'));
      setSubmitting(false);
      return;
    }
    const villaId = (villaRow as { id: string }).id;

    const unitsList = finalUnits.map(u => ({ villa_id: villaId, ho_number: u.ho.trim() }));
    const { error: unitsErr } = await supabase.from('units').insert(unitsList);
    if (unitsErr) {
      setError('호실 생성 실패 (빌라는 생성됨): ' + unitsErr.message);
      setSubmitting(false);
      return;
    }

    // 구독이 있으면 이 빌라의 구독 상품 자동 추가 + 비용 증가 안내
    const { data: subRow } = await supabase.from('subscriptions')
      .select('id').eq('admin_id', adminId)
      .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const subId = (subRow as { id: string } | null)?.id ?? null;
    if (subId) {
      const p = planFor(finalUnits.length);
      await supabase.from('subscription_items').insert({ subscription_id: subId, villa_id: villaId, plan: p.plan, price: p.price });
      alert(`"${name.trim()}" 빌라가 추가되었습니다.\n\n${p.name}(${finalUnits.length}세대) 상품 ${formatKRW(p.price)}이 구독에 추가되어\n다음 결제부터 월 요금에 합산됩니다.`);
    }

    router.replace(`/admin/villas/${villaId}`);
  }

  const displayUnits = autoLocked ? previewUnits : units;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">

      {isWelcome && existingVillaCount === 0 && (
        <div className="mt-3 bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-lg">
          <p className="text-[14px] font-bold opacity-80 tracking-widest mb-1">WELCOME</p>
          <h2 className="text-[20px] font-extrabold mb-1">{adminName ?? '관리자'}님, 가입 완료!</h2>
          <p className="text-[15px] opacity-90 leading-relaxed">
            첫 단계 — 관리하는 빌라를 등록해주세요.<br />
            지하·옥탑·상가 등 자유롭게 호실 추가 가능합니다.
          </p>
        </div>
      )}

      <div className="mt-3 mb-6">
        <p className="text-[13px] text-[#2B2BEE] font-bold tracking-[0.16em] mb-1.5">
          {isWelcome ? '내 빌라 등록' : 'NEW VILLA'}
        </p>
        <h1 className="text-[24px] font-black text-[#0F2242]">빌라 추가</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* 기본 정보 */}
        <Section title="기본 정보">
          <Field label="빌라 이름" required>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 빌라톡 102동"
              maxLength={50}
              className="input"
              required
            />
          </Field>
          <Field label="주소" required>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                readOnly
                placeholder="주소 검색 버튼을 눌러 입력"
                className="input flex-1 bg-[#F5F6FA]"
              />
              <button
                type="button"
                onClick={openPostcode}
                className="bg-[#2B2BEE] text-white px-3.5 py-2.5 rounded-xl text-[15px] font-bold whitespace-nowrap"
              >
                🔍 검색
              </button>
            </div>
          </Field>
        </Section>

        {/* 호실 구성 */}
        <Section title="호실 구성">
          <p className="text-[14px] text-[#6B7280] mb-2 leading-relaxed">
            ① 아래 숫자만 채우면 호실이 자동 생성됩니다. ② 필요 시 직접 편집·추가하세요.
          </p>

          {/* 간편 입력 — 층당 호실 프리셋 칩 */}
          <div className="mb-1">
            <p className="text-[13px] font-bold text-[#6B7280] mb-1.5">층당 호실 빠른 선택</p>
            <div className="flex gap-1.5 flex-wrap">
              {['1', '2', '3', '4', '6'].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setUnitsPerFloor(n); setAutoLocked(true); }}
                  className={`px-3 py-1.5 rounded-full text-[14px] font-bold border transition ${
                    unitsPerFloor === n ? 'bg-[#2B2BEE] text-white border-[#2B2BEE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'
                  }`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="지상 총 호실">
              <input
                type="number"
                inputMode="numeric"
                value={aboveTotal}
                onChange={e => { setAboveTotal(e.target.value); setAutoLocked(true); }}
                placeholder="12"
                min={0} max={200}
                className="input"
              />
            </Field>
            <Field label="층당 호실">
              <input
                type="number"
                inputMode="numeric"
                value={unitsPerFloor}
                onChange={e => { setUnitsPerFloor(e.target.value); setAutoLocked(true); }}
                placeholder="4"
                min={1} max={20}
                className="input"
              />
            </Field>
            <Field label="시작 층">
              <input
                type="number"
                inputMode="numeric"
                value={startFloor}
                onChange={e => { setStartFloor(e.target.value); setAutoLocked(true); }}
                placeholder="1"
                min={1} max={50}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="지하 호실 수 (B1~)">
              <input
                type="number"
                inputMode="numeric"
                value={basementCount}
                onChange={e => { setBasementCount(e.target.value); setAutoLocked(true); }}
                placeholder="0"
                min={0} max={10}
                className="input"
              />
            </Field>
            <Field label="옥탑 호실 수">
              <input
                type="number"
                inputMode="numeric"
                value={rooftopCount}
                onChange={e => { setRooftopCount(e.target.value); setAutoLocked(true); }}
                placeholder="0"
                min={0} max={10}
                className="input"
              />
            </Field>
          </div>

          {/* 미리보기 / 편집 */}
          {displayUnits.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[14px] font-bold text-[#6B7280]">
                  호실 목록 ({displayUnits.length}개)
                  {autoLocked && <span className="text-[#9CA3AF] font-normal"> · 자동 생성됨</span>}
                </p>
                {autoLocked ? (
                  <button
                    type="button"
                    onClick={applyAutoGenerate}
                    className="text-[14px] text-[#2B2BEE] font-bold hover:underline"
                  >
                    ✏️ 직접 편집
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAutoLocked(true)}
                    className="text-[14px] text-[#6B7280] font-bold hover:underline"
                  >
                    ↺ 자동 생성으로
                  </button>
                )}
              </div>

              <div className="bg-[#F5F6FA] rounded-xl p-3 border border-[#E8EBF0] max-h-[280px] overflow-y-auto">
                {autoLocked ? (
                  // 미리보기 (인라인)
                  <p className="text-[14px] text-[#0F2242] leading-relaxed">
                    {displayUnits.map(u => u.ho).join(' · ')}
                  </p>
                ) : (
                  // 편집 모드 — 각 호실 input + 삭제
                  <div className="space-y-1.5">
                    {units.map(u => (
                      <div key={u.tempId} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={u.ho}
                          onChange={e => renameUnit(u.tempId, e.target.value)}
                          maxLength={20}
                          className="flex-1 bg-white border border-[#E8EBF0] rounded-xl px-3 py-1.5 text-[15px] outline-none focus:border-[#2B2BEE]"
                        />
                        <button
                          type="button"
                          onClick={() => removeUnit(u.tempId)}
                          className="text-[#FF3B30] text-[15px] font-bold px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 items-center pt-1.5 border-t border-[#E8EBF0]">
                      <input
                        type="text"
                        value={customUnitName}
                        onChange={e => setCustomUnitName(e.target.value)}
                        placeholder="예: 카페, 부동산, 상가1"
                        maxLength={20}
                        className="flex-1 bg-white border border-dashed border-[#2B2BEE]/50 rounded-xl px-3 py-1.5 text-[15px] outline-none focus:border-[#2B2BEE]"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomUnit(); }}}
                      />
                      <button
                        type="button"
                        onClick={addCustomUnit}
                        className="bg-[#2B2BEE] text-white px-3 py-1.5 rounded-xl text-[15px] font-bold"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 중복 확인 */}
          {duplicateChecking && (
            <p className="text-[13px] text-[#9CA3AF]">중복 확인 중…</p>
          )}

          {/* 본인 빌라 중복 — 강한 차단 */}
          {ownDuplicate && (
            <div className="bg-[#FEE8E7] border border-[#FF3B30]/25 rounded-xl p-3.5">
              <p className="text-[14px] font-bold text-[#FF3B30] mb-1.5">
                ⛔ 이미 등록한 빌라입니다
              </p>
              <p className="text-[14px] text-[#0F2242] bg-white rounded-xl px-2.5 py-1.5 border border-[#E8EBF0]">
                <span className="font-bold">{ownDuplicate.name}</span>
                <span className="text-[#6B7280]"> · {ownDuplicate.address}</span>
              </p>
              <p className="text-[13px] text-[#6B7280] mt-2">
                같은 빌라를 두 번 등록할 수 없습니다.{' '}
                <Link href={`/admin/villas/${ownDuplicate.id}`} className="text-[#2B2BEE] font-bold underline">기존 빌라 보기 →</Link>
              </p>
            </div>
          )}

          {/* 타 관리자 중복 후보 — 정보성 안내 */}
          {duplicates.length > 0 && (
            <div className="bg-[#E9E9FD] border border-[#2B2BEE]/20 rounded-xl p-3.5">
              <p className="text-[14px] font-bold text-[#2B2BEE] mb-2">
                비슷한 빌라가 이미 등록되어 있습니다 ({duplicates.length}건)
              </p>
              <ul className="space-y-1.5 mb-3">
                {duplicates.map(d => (
                  <li key={d.id} className="text-[14px] text-[#0F2242] bg-white rounded-xl px-2.5 py-1.5 border border-[#E8EBF0]">
                    <span className="font-bold">{d.name}</span>
                    <span className="text-[#6B7280]"> · {d.address}</span>
                    {d.admin_name && (
                      <span className="text-[#9CA3AF] block text-[13px] mt-0.5">관리자: {d.admin_name}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mb-2">
                같은 빌라라면 <strong>기존 관리자에게 위임 요청</strong> 또는{' '}
                <a href="mailto:villatolk@andnew.kr" className="text-[#2B2BEE] underline">본사 (villatolk@andnew.kr)</a> 에 권한 이전 요청을 해주세요.
              </p>
              <label className="flex items-start gap-2 text-[14px] text-[#0F2242] cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceProceed}
                  onChange={e => setForceProceed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0"
                />
                <span>위 빌라와 <strong>다른 빌라</strong>이며, 본인이 정당한 관리자임을 확인합니다.</span>
              </label>
            </div>
          )}
        </Section>

        {/* 입금 계좌 (선택) */}
        <Section title="관리비 입금 계좌 (선택)">
          {prevAccount && (
            <button
              type="button"
              onClick={loadPrevAccount}
              className="w-full bg-[#E9E9FD] border border-[#2B2BEE]/30 text-[#2B2BEE] rounded-xl py-2.5 text-[15px] font-bold hover:bg-[#DCDCFB] transition-colors"
            >
              📥 이전 빌라 계좌 불러오기 ({prevAccount.bank} {prevAccount.number.slice(0, -4)}****)
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="은행">
              <select
                value={accountBank}
                onChange={e => setAccountBank(e.target.value)}
                className="input"
              >
                <option value="">은행 선택</option>
                {BANK_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="예금주">
              <input
                type="text"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                placeholder="예: 홍길동"
                maxLength={30}
                className="input"
              />
            </Field>
          </div>
          <Field label="계좌번호">
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="- 없이 숫자만 입력"
              maxLength={30}
              className="input"
            />
          </Field>
          <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
            은행 선택 시 토스페이먼츠 표준 코드가 함께 저장됩니다. 추후 가상계좌·자동이체 연동에 사용됩니다.
          </p>
        </Section>

        {/* 입주민 공개 설정 */}
        <Section title="입주민 공개 설정">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={exposeAdminContact}
              onChange={e => setExposeAdminContact(e.target.checked)}
              className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[#2B2BEE]"
            />
            <span>
              <span className="block text-[15px] font-bold text-[#0F2242]">관리자 성함·전화번호 노출</span>
              <span className="block text-[13px] text-[#6B7280] mt-0.5 leading-relaxed">
                켜면 입주민 앱에 관리자 연락처가 표시됩니다.
                {adminName && (
                  <span className="block text-[#9CA3AF] mt-1">
                    노출될 정보: {adminName}{adminPhone ? ` · ${adminPhone}` : ' (전화번호 미등록)'}
                  </span>
                )}
              </span>
            </span>
          </label>

          <Field label="특이사항 (입주민에게 항시 표시)">
            <textarea
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              placeholder="예: 분리수거는 매주 화·금요일 / 방문차량은 관리실 사전 등록 필수"
              maxLength={300}
              rows={3}
              className="input resize-none"
            />
            <p className="text-[12px] text-[#9CA3AF] mt-1">입주민 앱 상단에 항상 노출되는 안내문입니다. ({specialNotes.length}/300)</p>
          </Field>
        </Section>

        {error && (
          <div className="bg-[#FEE8E7] text-[#FF3B30] border border-[#FF3B30]/20 rounded-xl px-3 py-2.5 text-[15px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !adminId}
          className="w-full bg-[#2B2BEE] text-white rounded-xl py-3.5 text-[17px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition-colors"
        >
          {submitting ? '빌라 생성 중…' : `빌라 + ${displayUnits.length || 0}개 호실 생성`}
        </button>

        <p className="text-[13px] text-[#9CA3AF] text-center leading-relaxed">
          생성 후 빌라 상세에서 입주민 등록·관리비 청구·공지 작성 가능합니다
        </p>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #E8EBF0;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          color: #0F2242;
          outline: none;
        }
        .input:focus {
          border-color: #2B2BEE;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-[#6B7280] mb-2.5 tracking-wider">{title}</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-xl p-4 space-y-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">
        {label} {required && <span className="text-[#FF3B30]">*</span>}
      </label>
      {children}
    </div>
  );
}
