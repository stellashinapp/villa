'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Resident = {
  id: string;
  name: string;
  phone: string;
  ho: string;
  villaId: string;
  villaName: string;
};

export default function MoveoutShell() {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [moveOutDate, setMoveOutDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const r = sessionStorage.getItem('villatolk:resident');
    if (!r) { router.replace('/resident/login'); return; }
    setResident(JSON.parse(r));
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resident) return;
    setError(null);
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('submit-moveout-application', {
        body: { residentId: resident.id, name: resident.name, phone: resident.phone, moveOutDate: moveOutDate || null, reason: reason || null },
      });
      const errBody = (data as { error?: { message?: string } })?.error
        ?? (fnErr as unknown as { context?: { json?: { error?: { message?: string } } } })?.context?.json?.error;
      if (errBody) {
        setError(errBody.message ?? '이주 신청 실패');
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  if (!resident) return <div className="min-h-screen flex items-center justify-center text-t3">불러오는 중…</div>;

  if (submitted) {
    return (
      <div className="min-h-screen px-5 py-12 flex flex-col items-center justify-center">
        <div className="text-6xl mb-5">📦</div>
        <h2 className="text-xl font-extrabold mb-3">이주 신청 완료</h2>
        <p className="text-sm text-t2 text-center leading-relaxed mb-8">
          {resident.villaName} 관리자에게 신청이 전송됐어요.<br/>
          관리자 확정 후 이주 처리됩니다.
        </p>
        <Link href="/resident/bills" className="bg-pri text-white rounded-xl px-8 py-3 font-bold">청구서로</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-navy text-white px-5 pt-12 pb-8">
        <Link href="/resident/bills" className="text-xs text-white/60">← 청구서</Link>
        <h1 className="text-xl font-extrabold mt-6">이주 신청</h1>
        <p className="text-xs text-white/60 mt-2">
          {resident.villaName} {resident.ho}호 {resident.name}님
        </p>
      </div>

      <div className="flex-1 px-5 pt-6 pb-12">
        <div className="w-full max-w-sm mx-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-t3 mb-1.5">이사 예정일 (선택)</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={e => setMoveOutDate(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-t3 mb-1.5">사유 (선택)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="간단한 메모"
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri resize-none"
              />
            </div>
            {error && (
              <div className="bg-errL text-err border border-err/30 rounded-xl px-3 py-2 text-sm">{error}</div>
            )}
            <div className="bg-warnL border border-warn/30 rounded-xl px-3 py-3 text-xs text-warn leading-relaxed">
              ⚠ 이주 신청을 보내면 관리자가 확정 후 이주 처리됩니다.<br/>
              이후 청구서·민원 작성이 불가능해지므로 신중히 결정해 주세요.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-warn text-white rounded-xl py-3.5 text-base font-bold disabled:opacity-50"
            >
              {loading ? '신청 중…' : '이주 신청 보내기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
