'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Invitation = {
  id: string;
  villa_id: string;
  unit_id: string;
  name: string;
  phone: string;
  is_owner: boolean;
  accepted_at: string | null;
  expires_at: string;
  villas: { name: string; address: string };
  units: { ho_number: string };
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [inv, setInv] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error: e } = await supabase
        .from('resident_invitations')
        .select('id, villa_id, unit_id, name, phone, is_owner, accepted_at, expires_at, villas(name, address), units(ho_number)')
        .eq('token', token)
        .maybeSingle();
      if (e) { setError(e.message); setLoading(false); return; }
      if (!data) { setError('초대 링크를 찾을 수 없습니다'); setLoading(false); return; }
      const i = data as unknown as Invitation;
      if (i.accepted_at) { setError('이미 사용된 초대 링크입니다'); setLoading(false); return; }
      if (new Date(i.expires_at) < new Date()) { setError('만료된 초대 링크입니다 — 관리자에게 새 링크 요청'); setLoading(false); return; }
      setInv(i);
      setLoading(false);
    })();
  }, [token]);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!inv) return;
    const inputDigits = phoneConfirm.replace(/\D/g, '');
    const lastFour = inv.phone.slice(-4);
    // 정확히 4자리 + 완전 일치만 통과 (endsWith 는 전체번호 입력으로도 뚫림)
    if (inputDigits.length !== 4 || inputDigits !== lastFour) {
      alert(`휴대전화 마지막 4자리를 정확히 입력해주세요 (관리자 등록 번호 ****-${lastFour})`);
      return;
    }
    setAccepting(true);

    // 1. residents 행 생성 (active)
    const { data: resRow, error: resErr } = await supabase.from('residents').insert({
      unit_id: inv.unit_id,
      name: inv.name,
      phone: inv.phone,
      status: 'active',
      is_owner: inv.is_owner,
      applied_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    }).select('id').single();

    if (resErr || !resRow) {
      setAccepting(false);
      alert('가입 실패: ' + (resErr?.message ?? 'unknown'));
      return;
    }

    // 2. invitation accepted_at 표시
    await supabase.from('resident_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id);

    // 3. 자동 로그인 — sessionStorage 에 저장
    sessionStorage.setItem('villatolk:resident', JSON.stringify({
      id: (resRow as { id: string }).id,
      name: inv.name,
      phone: inv.phone,
      ho: inv.units.ho_number,
      villaId: inv.villa_id,
      villaName: inv.villas.name,
      villaAddress: inv.villas.address,
    }));

    // resident-login 함수 호출하여 villa 데이터도 받아옴
    try {
      const { data } = await supabase.functions.invoke('resident-login', {
        body: { name: inv.name, phone: inv.phone },
      });
      if (data) {
        sessionStorage.setItem('villatolk:resident-data', JSON.stringify({
          villa: (data as { villa: unknown }).villa ?? null,
          payments: (data as { payments: unknown[] }).payments ?? [],
        }));
      }
    } catch {}

    router.replace('/resident/bills');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <p className="text-[14px] text-[#6B7280]">초대 정보 확인 중…</p>
      </div>
    );
  }

  if (error || !inv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F6FA] px-5">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-[20px] font-extrabold text-[#0F2242] mb-2">초대 링크 오류</h2>
        <p className="text-[14px] text-[#6B7280] text-center mb-6">{error}</p>
        <Link href="/" className="bg-[#2B2BEE] text-white px-6 py-3 rounded-xl font-bold">홈으로</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] px-5 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💌</div>
          <p className="text-[13px] text-[#2B2BEE] font-bold tracking-[0.16em] mb-1">VILLATOLK</p>
          <h1 className="text-[22px] font-extrabold text-[#0F2242]">{inv.name}님, 환영합니다</h1>
        </div>

        <div className="bg-white border border-[#E8EBF0] rounded-xl p-5 shadow-sm mb-4">
          <p className="text-[12px] font-bold text-[#6B7280] tracking-wider mb-3">초대 정보</p>
          <Row label="빌라" value={inv.villas.name} />
          <Divider />
          <Row label="호실" value={inv.units.ho_number} />
          <Divider />
          <Row label="이름" value={inv.name} />
          <Divider />
          <Row label="휴대전화" value={`010-****-${inv.phone.slice(-4)}`} />
          {inv.is_owner && (
            <>
              <Divider />
              <Row label="구분" value="소유주 (건물주)" />
            </>
          )}
        </div>

        <form onSubmit={accept} className="bg-white border border-[#E8EBF0] rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-[13px] font-bold text-[#0F2242]">본인 확인</p>
          <p className="text-[12px] text-[#6B7280] leading-relaxed">
            본인의 휴대전화 마지막 4자리를 입력해주세요.
          </p>
          <input
            value={phoneConfirm}
            onChange={e => setPhoneConfirm(e.target.value)}
            placeholder="마지막 4자리"
            maxLength={11}
            inputMode="tel"
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-3 text-[16px] outline-none focus:border-[#2B2BEE]"
            required
          />
          <button
            type="submit"
            disabled={accepting}
            className="w-full bg-[#2B2BEE] text-white py-3.5 rounded-xl text-[16px] font-bold disabled:opacity-50"
          >
            {accepting ? '가입 처리 중…' : '✓ 가입 완료 (자동 로그인)'}
          </button>
        </form>

        <p className="text-[11px] text-[#9CA3AF] text-center mt-6 leading-relaxed">
          가입 시 <a href="/legal/terms" target="_blank" rel="noreferrer" className="underline">이용약관</a> 및{' '}
          <a href="/legal/privacy" target="_blank" rel="noreferrer" className="underline">개인정보처리방침</a> 에 동의합니다
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[14px] text-[#6B7280]">{label}</span>
      <span className="text-[14px] font-semibold text-[#0F2242]">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#E8EBF0] my-1" />;
}
