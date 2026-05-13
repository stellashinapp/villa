'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Profile = { id: string; name: string | null; email: string };
type Villa = { id: string; name: string; total_units: number };
type Subscription = { status: string; card_brand: string | null; card_last4: string | null; trial_ends_at: string | null };

export default function AdminHomeShell() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }

      const { data: adminRow } = await supabase
        .from('admins')
        .select('id, name, email')
        .eq('auth_id', user.id)
        .maybeSingle();
      if (!adminRow) {
        await supabase.auth.signOut();
        router.replace('/admin/login');
        return;
      }
      setProfile(adminRow as Profile);

      const [{ data: villasData }, { data: subData }] = await Promise.all([
        supabase.from('villas').select('id, name, total_units').eq('admin_id', adminRow.id).eq('status', 'active'),
        supabase
          .from('subscriptions')
          .select('status, card_brand, card_last4, trial_ends_at')
          .eq('admin_id', adminRow.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setVillas((villasData ?? []) as Villa[]);
      setSub(subData as Subscription | null);
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-t3">불러오는 중…</div>;

  const trialDays = sub?.trial_ends_at
    ? Math.floor((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-md mx-auto px-5 py-6 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-pri tracking-widest font-bold">VILLATOLK</p>
          <h1 className="text-xl font-extrabold text-t1">{profile?.name ?? profile?.email}님</h1>
        </div>
        <button onClick={logout} className="text-xs text-t3 hover:text-t1 px-3 py-1.5 rounded-lg border border-border">
          로그아웃
        </button>
      </header>

      {/* 구독 카드 */}
      <div className={`rounded-2xl p-5 mb-5 ${sub?.status === 'active' ? 'bg-pri text-white' : 'bg-warnL border border-warn/30'}`}>
        <div className="text-[11px] font-bold opacity-80 tracking-widest mb-1">구독 상태</div>
        <div className="text-lg font-extrabold mb-1">
          {sub?.status === 'active' && '활성'}
          {sub?.status === 'trialing' && `무료체험 (D-${trialDays ?? '-'})`}
          {sub?.status === 'past_due' && '결제실패 — 카드 재등록 필요'}
          {!sub && '구독 미가입 — 카드 등록 필요'}
        </div>
        {sub?.card_brand && (
          <div className="text-xs opacity-80">{sub.card_brand} ····{sub.card_last4 ?? ''}</div>
        )}
      </div>

      {/* 빌라 목록 */}
      <h2 className="text-xs font-bold text-t3 tracking-widest mb-3">내 빌라 ({villas.length})</h2>
      <div className="space-y-2 mb-6">
        {villas.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-t3">등록된 빌라가 없습니다</p>
            <p className="text-xs text-t3 mt-1">+ 버튼으로 첫 빌라를 등록하세요</p>
          </div>
        ) : (
          villas.map(v => (
            <div key={v.id} className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-t1">{v.name}</div>
                <div className="text-xs text-t3 mt-0.5">{v.total_units}세대</div>
              </div>
              <span className="text-t3">›</span>
            </div>
          ))
        )}
      </div>

      <div className="bg-priL/40 border border-pri/15 rounded-2xl p-4 text-xs text-t2 leading-relaxed">
        🚧 PWA 베타 — 빌라 추가·청구서 발행·민원 응답 등 상세 기능은 곧 추가됩니다. 우선 가입·로그인·홈 화면 검증용입니다.
      </div>
    </div>
  );
}
