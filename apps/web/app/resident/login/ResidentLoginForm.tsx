'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ⚠️ TEMP — REMOVE BEFORE PRODUCTION
// 테스트 편의용 빠른 로그인. 운영 전 TEST_RESIDENTS 상수와 빠른입력 버튼 영역 모두 제거할 것.
// admin1 (admin1@villatolk.test) 가 관리하는 '빌라톡 테스트빌라' 의 입주민 3명.
// 이 입주민으로 로그인하면 admin1 ↔ resident 간 공지·메시지 흐름 테스트 가능.
const TEST_RESIDENTS: { label: string; name: string; phone: string }[] = [
  { label: '김테스트1(101)', name: '김테스트1', phone: '01099991111' },
  { label: '이테스트2(102)', name: '이테스트2', phone: '01099992222' },
  { label: '박테스트3(103)', name: '박테스트3', phone: '01099993333' },
];

type ResidentResult = {
  resident: {
    id: string;
    name: string;
    phone: string;
    unit_id: string;
    units: { ho_number: string; villa_id: string; villas: { id: string; name: string; address: string } };
  };
  villa: unknown;
  payments: unknown[];
};

export default function ResidentLoginForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillTestCredentials(idx: number) {
    const t = TEST_RESIDENTS[idx];
    setName(t.name);
    setPhone(t.phone);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('이름과 전화번호를 입력해 주세요');
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('resident-login', {
        body: { name: name.trim(), phone: phone.replace(/\D/g, '') },
      });
      if (fnErr || !data || (data as { error?: unknown }).error) {
        const ctx = (fnErr as unknown as { context?: { json?: { error?: { message?: string } } } })?.context?.json?.error?.message;
        setError(ctx ?? '등록된 입주민 정보가 없습니다. 관리자에게 등록을 요청하세요.');
        setLoading(false);
        return;
      }
      const payload = data as ResidentResult;
      // 세션 저장 — 브라우저 sessionStorage (탭 닫으면 풀림). 운영 시 localStorage + 만료 처리 권장.
      sessionStorage.setItem('villatolk:resident', JSON.stringify({
        id: payload.resident.id,
        name: payload.resident.name,
        phone: payload.resident.phone,
        ho: payload.resident.units.ho_number,
        villaId: payload.resident.units.villas.id,
        villaName: payload.resident.units.villas.name,
        villaAddress: payload.resident.units.villas.address,
      }));
      sessionStorage.setItem('villatolk:resident-data', JSON.stringify({ villa: payload.villa, payments: payload.payments }));
      router.replace('/resident/bills');
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">이름</label>
        <input
          required
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 김민수"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">전화번호</label>
        <input
          required
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="01012345678"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      {error && (
        <div className="bg-errL text-err border border-err/30 rounded-xl px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pri text-white rounded-xl py-3.5 text-base font-bold hover:bg-pri/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '확인 중…' : '로그인'}
      </button>

      {/* ⚠️ TEMP — REMOVE BEFORE PRODUCTION (테스트용 빠른입력) */}
      <div className="border-t-2 border-dashed border-amber-200 pt-3">
        <p className="text-[12px] text-amber-700 font-bold mb-1.5">🧪 테스트 빠른입력 (운영 전 삭제)</p>
        <div className="grid grid-cols-3 gap-2">
          {TEST_RESIDENTS.map((t, i) => (
            <button
              key={t.phone}
              type="button"
              onClick={() => fillTestCredentials(i)}
              className="bg-amber-50 text-amber-700 border border-amber-300 rounded-lg py-2 text-xs font-bold hover:bg-amber-100 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
