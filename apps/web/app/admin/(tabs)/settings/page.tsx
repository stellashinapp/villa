'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/Icon';
import AdminTopBar from '@/components/AdminTopBar';

type Profile = { id: string; name: string | null; phone: string | null; email: string; role: string | null };
type Subscription = {
  status: string;
  card_brand: string | null;
  card_last4: string | null;
  trial_ends_at: string | null;
};

const ADMIN_WEB_URL = 'https://villatolk-admin.vercel.app';

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
        .from('admins').select('id, name, phone, email, role').eq('auth_id', user.id).maybeSingle();
      setProfile(adminRow as Profile | null);

      if (adminRow) {
        const { data: subData } = await supabase
          .from('subscriptions').select('status, card_brand, card_last4, trial_ends_at')
          .eq('admin_id', (adminRow as { id: string }).id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        setSub(subData as Subscription | null);

        const { count } = await supabase
          .from('villas').select('*', { count: 'exact', head: true })
          .eq('admin_id', (adminRow as { id: string }).id).eq('status', 'active');
        setVillaCount(count ?? 0);
      }
    })();
  }, []);

  async function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
    router.replace('/');
  }

  const trialDays = sub?.trial_ends_at ? Math.floor((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const subLabel = sub?.status === 'active' ? '활성' : sub?.status === 'trialing' ? `무료체험 D-${trialDays ?? '-'}` : sub?.status === 'past_due' ? '결제 실패' : sub?.status === 'canceled' ? '해지됨' : '구독 미가입';
  const isSuper = profile?.role === 'super';

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <AdminTopBar title="내정보" />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {/* 프로필 카드 */}
        <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-md mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-[24px] font-black">
              {profile?.name?.[0] ?? profile?.email?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-[18px] font-black">{profile?.name || profile?.email}</p>
              <p className="text-[12px] opacity-80 mt-0.5">
                {isSuper ? '본사 (super)' : '빌라 관리자 (admin)'} · 빌라 {villaCount}개
              </p>
            </div>
          </div>
        </div>

        {/* 본사 콘솔 — super 권한만 표시 */}
        {isSuper && (
          <Section title="본사 콘솔">
            <a href={ADMIN_WEB_URL} target="_blank" rel="noreferrer"
              className="flex items-center bg-white border border-[#F0F2F5] rounded-xl p-4 shadow-sm active:scale-[0.99] transition">
              <span className="w-12 h-12 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5]">
                <Icon name="villa" size={24} color="#FFFFFF" filled />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-extrabold text-[#0F2242]">앤뉴 본사 콘솔</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">전체 빌라·관리자·결제·구독 관리 (super 전용)</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">villatolk-admin.vercel.app</p>
              </div>
              <span className="text-[#9CA3AF] text-xl">›</span>
            </a>
          </Section>
        )}

        {/* 내 정보 */}
        <Section title="내 정보">
          <Row label="이름" value={profile?.name ?? '-'} />
          <Row label="이메일" value={profile?.email ?? '-'} />
          <Row label="전화번호" value={profile?.phone ?? '-'} />
          <Row label="등록 빌라" value={`${villaCount}개`} />
          <Row label="권한" value={isSuper ? 'super (본사)' : 'admin (관리자)'} valueClassName={isSuper ? 'text-[#2B2BEE]' : ''} />
        </Section>

        {/* 구독 */}
        <Section title="구독">
          <Row label="상태" value={subLabel} valueClassName={sub?.status === 'past_due' ? 'text-[#FF3B30]' : sub?.status === 'trialing' ? 'text-[#2B2BEE]' : ''} />
          <Row label="등록 카드" value={sub?.card_last4 ? `${sub.card_brand ?? 'CARD'} •••• ${sub.card_last4}` : '미등록'} />
          <p className="text-[12px] text-[#9CA3AF] mt-2">
            ⓘ 구독·결제 관리는 모바일 앱에서 가능합니다
          </p>
        </Section>

        {/* 약관 */}
        <Section title="약관 및 정책">
          <ExternalRow href="https://villtalk.store/legal/terms" label="이용약관" />
          <ExternalRow href="https://villtalk.store/legal/privacy" label="개인정보 처리방침" />
        </Section>

        {/* 앱 정보 */}
        <Section title="앱 정보">
          <Row label="앱 버전" value="v1.0.0" />
          <Row label="고객센터" value="villatolk@andnew.kr" valueClassName="text-[#2B2BEE]" />
        </Section>

        <button onClick={logout}
          className="w-full mt-2 bg-white border border-[#FEE8E7] rounded-xl py-4 text-[#FF3B30] text-[15px] font-bold">
          로그아웃
        </button>

        <p className="text-center mt-5 text-[11px] text-[#9CA3AF]">ANDNEW 2026</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-bold text-[#6B7280] mb-2 px-1 tracking-wider">{title}</h2>
      <div className="bg-white border border-[#F0F2F5] rounded-xl p-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#F5F6FA] last:border-b-0">
      <span className="text-[14px] text-[#6B7280]">{label}</span>
      <span className={`text-[14px] font-semibold text-[#0F2242] ${valueClassName}`}>{value}</span>
    </div>
  );
}

function ExternalRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex justify-between items-center py-2.5 border-b border-[#F5F6FA] last:border-b-0">
      <span className="text-[14px] font-semibold text-[#0F2242]">{label}</span>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </a>
  );
}
