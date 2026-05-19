'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminVillaAddPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);

  // 빌라 기본 정보
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [unitsPerFloor, setUnitsPerFloor] = useState('');
  const [startFloor, setStartFloor] = useState('1');

  // 입금 계좌
  const [accountBank, setAccountBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('admins').select('id').eq('auth_id', user.id).maybeSingle();
      if (data) setAdminId((data as { id: string }).id);
    })();
  }, []);

  // 미리보기 — 자동 생성될 호실 번호
  function previewUnits(): string[] {
    const total = parseInt(totalUnits, 10);
    const perFloor = parseInt(unitsPerFloor, 10) || 1;
    const startF = parseInt(startFloor, 10) || 1;
    if (!total || total <= 0 || total > 200) return [];
    const list: string[] = [];
    for (let i = 0; i < total; i++) {
      const floor = startF + Math.floor(i / perFloor);
      const unit = (i % perFloor) + 1;
      list.push(`${floor}${String(unit).padStart(2, '0')}호`);
    }
    return list;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!adminId) {
      setError('관리자 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
      return;
    }
    if (!name.trim()) {
      setError('빌라 이름을 입력해주세요');
      return;
    }
    if (!address.trim()) {
      setError('주소를 입력해주세요');
      return;
    }
    const total = parseInt(totalUnits, 10);
    if (!total || total <= 0 || total > 200) {
      setError('총 호실 수는 1~200 사이로 입력해주세요');
      return;
    }
    const perFloor = parseInt(unitsPerFloor, 10) || total;
    const startF = parseInt(startFloor, 10) || 1;

    setSubmitting(true);

    // 1. villa insert
    const { data: villaRow, error: villaErr } = await supabase
      .from('villas')
      .insert({
        admin_id: adminId,
        name: name.trim(),
        address: address.trim(),
        total_units: total,
        units_per_floor: perFloor,
        account_bank: accountBank.trim() || null,
        account_number: accountNumber.trim() || null,
        account_holder: accountHolder.trim() || null,
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

    // 2. units 자동 생성
    const unitsList: { villa_id: string; ho_number: string }[] = [];
    for (let i = 0; i < total; i++) {
      const floor = startF + Math.floor(i / perFloor);
      const unit = (i % perFloor) + 1;
      unitsList.push({
        villa_id: villaId,
        ho_number: `${floor}${String(unit).padStart(2, '0')}호`,
      });
    }

    const { error: unitsErr } = await supabase.from('units').insert(unitsList);
    if (unitsErr) {
      setError('호실 생성 실패 (빌라는 생성됨): ' + unitsErr.message);
      setSubmitting(false);
      return;
    }

    // 3. 새 빌라 상세로 이동
    router.replace(`/admin/villas/${villaId}`);
  }

  const units = previewUnits();

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href="/admin/villas" className="text-[12px] text-[#6B7280] hover:text-[#0F2242]">← 빌라 목록</Link>

      <div className="mt-3 mb-6">
        <p className="text-[11px] text-[#4263E8] font-bold tracking-[0.16em] mb-1.5">NEW VILLA</p>
        <h1 className="text-[22px] font-black text-[#0F2242]">빌라 추가</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">기본 정보 입력 후 호실은 자동 생성됩니다</p>
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
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="예: 서울특별시 강남구 테헤란로 123"
              maxLength={200}
              className="input"
              required
            />
          </Field>
          <div className="grid grid-cols-3 gap-2.5">
            <Field label="총 호실 수" required>
              <input
                type="number"
                inputMode="numeric"
                value={totalUnits}
                onChange={e => setTotalUnits(e.target.value)}
                placeholder="12"
                min={1}
                max={200}
                className="input"
                required
              />
            </Field>
            <Field label="층당 호실">
              <input
                type="number"
                inputMode="numeric"
                value={unitsPerFloor}
                onChange={e => setUnitsPerFloor(e.target.value)}
                placeholder="4"
                min={1}
                max={20}
                className="input"
              />
            </Field>
            <Field label="시작 층">
              <input
                type="number"
                inputMode="numeric"
                value={startFloor}
                onChange={e => setStartFloor(e.target.value)}
                placeholder="1"
                min={1}
                max={20}
                className="input"
              />
            </Field>
          </div>

          {/* 호실 미리보기 */}
          {units.length > 0 && (
            <div className="bg-[#F5F6FA] rounded-xl p-3 border border-[#E8EBF0]">
              <p className="text-[11px] text-[#6B7280] font-bold mb-1.5">자동 생성될 호실 ({units.length}개)</p>
              <p className="text-[12px] text-[#0F2242] leading-relaxed">
                {units.slice(0, 12).join(' · ')}
                {units.length > 12 && <span className="text-[#9CA3AF]"> ... 외 {units.length - 12}개</span>}
              </p>
            </div>
          )}
        </Section>

        {/* 입금 계좌 (선택) */}
        <Section title="관리비 입금 계좌 (선택)">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="은행">
              <input
                type="text"
                value={accountBank}
                onChange={e => setAccountBank(e.target.value)}
                placeholder="예: 신한"
                maxLength={20}
                className="input"
              />
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
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="예: 110-123-456789"
              maxLength={30}
              className="input"
            />
          </Field>
        </Section>

        {error && (
          <div className="bg-[rgba(231,76,60,0.08)] text-[#E74C3C] border border-[rgba(231,76,60,0.2)] rounded-xl px-3 py-2.5 text-[13px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !adminId}
          className="w-full bg-[#4263E8] text-white rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#3651c4] disabled:opacity-50 transition-colors"
        >
          {submitting ? '빌라 생성 중…' : `빌라 + ${units.length || 0}개 호실 생성`}
        </button>

        <p className="text-[11px] text-[#9CA3AF] text-center leading-relaxed">
          생성 후 빌라 상세에서 입주민 등록·관리비 청구·공지 작성 가능합니다
        </p>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #E8EBF0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #0F2242;
          outline: none;
        }
        .input:focus {
          border-color: #4263E8;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[13px] font-bold text-[#6B7280] mb-2.5 tracking-wider">{title}</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 space-y-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">
        {label} {required && <span className="text-[#E74C3C]">*</span>}
      </label>
      {children}
    </div>
  );
}
