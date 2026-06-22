'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
      localStorage.setItem('villatolk:resident', JSON.stringify({
        id: payload.resident.id,
        name: payload.resident.name,
        phone: payload.resident.phone,
        ho: payload.resident.units.ho_number,
        villaId: payload.resident.units.villas.id,
        villaName: payload.resident.units.villas.name,
        villaAddress: payload.resident.units.villas.address,
      }));
      localStorage.setItem('villatolk:resident-data', JSON.stringify({ villa: payload.villa, payments: payload.payments }));
      router.replace('/resident/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">이름</label>
        <input
          required
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 김민수"
          className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3.5 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition"
        />
      </div>
      <div>
        <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">전화번호</label>
        <input
          required
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="01012345678"
          className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3.5 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition"
        />
      </div>
      {error && (
        <div className="bg-[#FEE8E7] text-[#FF3B30] border border-[#FF3B30]/20 rounded-xl px-3 py-2.5 text-[13px]">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2B2BEE] text-white rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition-colors"
      >
        {loading ? '확인 중…' : '로그인'}
      </button>
    </form>
  );
}
