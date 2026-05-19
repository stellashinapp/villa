'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Profile = { id: string; name: string | null; phone: string | null; email: string };
type Subscription = {
  status: string;
  card_brand: string | null;
  card_last4: string | null;
  trial_ends_at: string | null;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [villaCount, setVillaCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: adminRow } = await supabase
        .from('admins')
        .select('id, name, phone, email')
        .eq('auth_id', user.id)
        .maybeSingle();
      setProfile(adminRow as Profile | null);

      if (adminRow) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('status, card_brand, card_last4, trial_ends_at')
          .eq('admin_id', (adminRow as { id: string }).id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setSub(subData as Subscription | null);

        const { count } = await supabase
          .from('villas')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', (adminRow as { id: string }).id)
          .eq('status', 'active');
        setVillaCount(count ?? 0);
      }
    })();
  }, []);

  async function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
    router.replace('/');
  }

  const trialDays = sub?.trial_ends_at
    ? Math.floor((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const subLabel =
    sub?.status === 'active' ? '활성' :
    sub?.status === 'trialing' ? `무료체험 D-${trialDays ?? '-'}` :
    sub?.status === 'past_due' ? '결제실패 ⚠️' :
    sub?.status === 'canceled' ? '해지됨' :
    '구독 미가입';

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <p className="text-[13px] text-[#4263E8] font-bold tracking-[0.16em] mb-1.5">ADMIN</p>
      <h1 className="text-[24px] font-black text-[#0F2242]">설정</h1>

      {/* 내 정보 */}
      <h2 className="text-[15px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">내 정보</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Row label="이름" value={profile?.name ?? '-'} />
        <Divider />
        <Row label="이메일" value={profile?.email ?? '-'} />
        <Divider />
        <Row label="전화번호" value={profile?.phone ?? '-'} />
        <Divider />
        <Row label="등록 빌라" value={`${villaCount}개`} />
      </div>

      {/* 구독 */}
      <h2 className="text-[15px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">구독</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Row label="상태" value={subLabel} valueClassName={sub?.status === 'past_due' ? 'text-[#E74C3C]' : ''} />
        <Divider />
        <Row label="등록 카드" value={sub?.card_last4 ? `${sub.card_brand ?? 'CARD'} •••• ${sub.card_last4}` : '미등록'} />
        <p className="text-[13px] text-[#9CA3AF] mt-3">
          구독·결제 관리는 모바일 앱에서 가능합니다 (다음 업데이트에서 PWA 도 지원)
        </p>
      </div>

      {/* 약관 */}
      <h2 className="text-[15px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">약관 및 정책</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <ExternalRow href="https://villtalk.store/legal/terms" label="이용약관" />
        <Divider />
        <ExternalRow href="https://villtalk.store/legal/privacy" label="개인정보 처리방침" />
      </div>

      {/* 앱 정보 */}
      <h2 className="text-[15px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">앱 정보</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Row label="앱 버전" value="v1.0.0" />
        <Divider />
        <Row label="고객센터" value="villatolk@andnew.kr" valueClassName="text-[#4263E8]" />
      </div>

      {/* 로그아웃 */}
      <button
        onClick={logout}
        className="w-full mt-6 bg-[rgba(231,76,60,0.06)] border border-[rgba(231,76,60,0.12)] rounded-2xl py-4 text-[#E74C3C] text-[17px] font-bold"
      >
        로그아웃
      </button>

      <p className="text-center mt-5 text-[13px] text-[#9CA3AF]">ANDNEW 2026</p>
    </div>
  );
}

function Row({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[15px] text-[#6B7280]">{label}</span>
      <span className={`text-[15px] font-semibold text-[#0F2242] ${valueClassName}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#E8EBF0] my-1.5" />;
}

function ExternalRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex justify-between items-center py-2.5">
      <span className="text-sm font-semibold text-[#0F2242]">{label}</span>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </a>
  );
}
