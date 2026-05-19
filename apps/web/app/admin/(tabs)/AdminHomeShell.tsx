'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Profile = { id: string; name: string | null; email: string };
type Villa = { id: string; name: string; total_units: number; address: string };
type Subscription = {
  status: string;
  card_brand: string | null;
  card_last4: string | null;
  trial_ends_at: string | null;
};

type Aggregate = {
  totalVillas: number;
  totalUnits: number;
  totalActiveResidents: number;
  pendingApplications: number;
  pendingMoveouts: number;
  unreadMessages: number;
  unpaidCurrentMonth: number; // 이번 달 미납 호실 합계 (across all villas)
  publishedThisMonth: number; // 이번 달 published 회차 수
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminHomeShell() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [agg, setAgg] = useState<Aggregate>({
    totalVillas: 0, totalUnits: 0, totalActiveResidents: 0,
    pendingApplications: 0, pendingMoveouts: 0, unreadMessages: 0,
    unpaidCurrentMonth: 0, publishedThisMonth: 0,
  });
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
      const adminId = (adminRow as { id: string }).id;

      const [{ data: villasData }, { data: subData }] = await Promise.all([
        supabase
          .from('villas')
          .select('id, name, total_units, address')
          .eq('admin_id', adminId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('subscriptions')
          .select('status, card_brand, card_last4, trial_ends_at')
          .eq('admin_id', adminId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const vs = (villasData ?? []) as Villa[];
      setVillas(vs);
      setSub(subData as Subscription | null);

      const villaIds = vs.map(v => v.id);
      const totalUnits = vs.reduce((s, v) => s + (v.total_units ?? 0), 0);

      if (villaIds.length === 0) {
        setAgg({
          totalVillas: 0, totalUnits: 0, totalActiveResidents: 0,
          pendingApplications: 0, pendingMoveouts: 0, unreadMessages: 0,
          unpaidCurrentMonth: 0, publishedThisMonth: 0,
        });
        setLoading(false);
        return;
      }

      // 병렬 통계 쿼리
      const thisYM = new Date().toISOString().slice(0, 7);
      const [
        { count: activeResCount },
        { count: pendingAppCount },
        { count: pendingMoveCount },
        { count: unreadMsgCount },
        { data: thisMonthBills },
      ] = await Promise.all([
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'active'),
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'pending'),
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'pending_moveout'),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .in('villa_id', villaIds).eq('is_read', false),
        supabase.from('bill_months').select('id, villa_id, year_month, status')
          .in('villa_id', villaIds).eq('year_month', thisYM).eq('status', 'published'),
      ]);

      // 이번 달 미납 호실 = (이번 달 published 회차들의 빌라 총 호실) - (payments.is_paid=true 갯수)
      const billsThisMonth = (thisMonthBills ?? []) as { id: string; villa_id: string }[];
      let unpaid = 0;
      if (billsThisMonth.length > 0) {
        for (const bm of billsThisMonth) {
          const villa = vs.find(v => v.id === bm.villa_id);
          const tu = villa?.total_units ?? 0;
          const { count: paidCount } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('bill_month_id', bm.id)
            .eq('is_paid', true);
          unpaid += Math.max(0, tu - (paidCount ?? 0));
        }
      }

      setAgg({
        totalVillas: vs.length,
        totalUnits,
        totalActiveResidents: activeResCount ?? 0,
        pendingApplications: pendingAppCount ?? 0,
        pendingMoveouts: pendingMoveCount ?? 0,
        unreadMessages: unreadMsgCount ?? 0,
        unpaidCurrentMonth: unpaid,
        publishedThisMonth: billsThisMonth.length,
      });
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">
        불러오는 중…
      </div>
    );
  }

  const trialDays = sub?.trial_ends_at
    ? Math.floor((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const subLabel = sub?.status === 'active' ? '활성'
    : sub?.status === 'trialing' ? `무료체험 D-${trialDays ?? '-'}`
    : sub?.status === 'past_due' ? '결제 실패'
    : sub?.status === 'canceled' ? '해지됨'
    : '구독 미가입';

  const hasAlerts = agg.pendingApplications > 0 || agg.pendingMoveouts > 0 || agg.unreadMessages > 0 || agg.unpaidCurrentMonth > 0;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <header className="mb-5">
        <p className="text-[10px] text-[#4263E8] tracking-widest font-bold mb-1">VILLATOLK ADMIN</p>
        <h1 className="text-[22px] font-black text-[#0F2242] leading-tight">{profile?.name || profile?.email}님</h1>
        <p className="text-[12px] text-[#6B7280] mt-0.5">
          빌라 {agg.totalVillas}개 · 총 {agg.totalUnits}호실 · 입주민 {agg.totalActiveResidents}명
        </p>
      </header>

      {/* 구독 카드 */}
      <div className={`rounded-2xl p-4 mb-4 ${
        sub?.status === 'past_due' ? 'bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.3)]'
        : sub?.status === 'trialing' ? 'bg-[rgba(243,156,18,0.08)] border border-[rgba(243,156,18,0.3)]'
        : sub?.status === 'active' ? 'bg-gradient-to-br from-[#4263E8] to-[#5A7DFF] text-white shadow-md'
        : 'bg-white border border-[#E8EBF0]'
      }`}>
        <p className={`text-[10px] font-bold tracking-widest ${sub?.status === 'active' ? 'opacity-80' : 'text-[#6B7280]'}`}>구독 상태</p>
        <p className={`text-[18px] font-extrabold mt-0.5 ${sub?.status === 'past_due' ? 'text-[#E74C3C]' : sub?.status === 'trialing' ? 'text-[#F39C12]' : ''}`}>{subLabel}</p>
        {sub?.card_last4 && (
          <p className={`text-[12px] mt-1 ${sub?.status === 'active' ? 'opacity-90' : 'text-[#6B7280]'}`}>
            {sub.card_brand} ····{sub.card_last4}
          </p>
        )}
        {!sub && <p className="text-[12px] text-[#6B7280] mt-1">카드 등록 시 무료 체험 시작</p>}
      </div>

      {/* 알림 카드 (오늘 처리할 일) — 있을 때만 */}
      {hasAlerts && (
        <div className="mb-5">
          <p className="text-[10px] text-[#6B7280] font-bold tracking-widest mb-2">오늘 처리 필요</p>
          <div className="space-y-2">
            {agg.pendingApplications > 0 && (
              <Link href="/admin/applications" className="block bg-[#F39C12] text-white rounded-xl px-4 py-3 active:scale-[0.99] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold opacity-80 tracking-widest">📮 가입 신청 대기</p>
                    <p className="text-[16px] font-extrabold mt-0.5">{agg.pendingApplications}건 처리 필요</p>
                  </div>
                  <span className="text-xl">›</span>
                </div>
              </Link>
            )}
            {agg.pendingMoveouts > 0 && (
              <Link href="/admin/villas" className="block bg-[#FF6B35] text-white rounded-xl px-4 py-3 active:scale-[0.99] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold opacity-80 tracking-widest">📦 이주 확정 대기</p>
                    <p className="text-[16px] font-extrabold mt-0.5">{agg.pendingMoveouts}건 확정 필요</p>
                  </div>
                  <span className="text-xl">›</span>
                </div>
              </Link>
            )}
            {agg.unreadMessages > 0 && (
              <Link href="/admin/inbox" className="block bg-[#E74C3C] text-white rounded-xl px-4 py-3 active:scale-[0.99] transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold opacity-80 tracking-widest">✉️ 미답변 메시지</p>
                    <p className="text-[16px] font-extrabold mt-0.5">{agg.unreadMessages}건 응답 필요</p>
                  </div>
                  <span className="text-xl">›</span>
                </div>
              </Link>
            )}
            {agg.unpaidCurrentMonth > 0 && (
              <div className="bg-white border border-[rgba(231,76,60,0.3)] rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-[#E74C3C] tracking-widest">💸 이번 달 미납</p>
                <p className="text-[16px] font-extrabold mt-0.5 text-[#E74C3C]">{agg.unpaidCurrentMonth}세대 미납</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">청구한 빌라 {agg.publishedThisMonth}개 합산 · 빌라별 상세는 빌라 탭</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 통계 그리드 */}
      <p className="text-[10px] text-[#6B7280] font-bold tracking-widest mb-2">한눈에 보기</p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <StatBox label="빌라" value={fmt(agg.totalVillas)} unit="개" accent="#0F2242" />
        <StatBox label="총 호실" value={fmt(agg.totalUnits)} unit="실" accent="#0F2242" />
        <StatBox label="활성 입주민" value={fmt(agg.totalActiveResidents)} unit="명" accent="#4263E8" />
        <StatBox label="이번 달 청구" value={fmt(agg.publishedThisMonth)} unit="회차" accent="#2ECC71" />
      </div>

      {/* 빌라 빠른 이동 */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-[#6B7280] font-bold tracking-widest">내 빌라</p>
        <Link href="/admin/villas/add" className="text-[12px] text-[#4263E8] font-bold">＋ 빌라 추가</Link>
      </div>
      <div className="space-y-2">
        {villas.length === 0 ? (
          <Link href="/admin/villas/add" className="block bg-white border border-dashed border-[#4263E8]/30 rounded-2xl p-6 text-center hover:bg-[#EEF1FB]">
            <div className="text-3xl mb-2">🏘️</div>
            <p className="text-[14px] font-bold text-[#0F2242]">첫 빌라를 등록해주세요</p>
            <p className="text-[11px] text-[#6B7280] mt-1">청구·입주민·공지 관리 시작</p>
          </Link>
        ) : (
          villas.map(v => (
            <Link
              key={v.id}
              href={`/admin/villas/${v.id}`}
              className="block bg-white border border-[#E8EBF0] rounded-xl px-4 py-3.5 shadow-sm active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-extrabold text-[#0F2242] truncate">{v.name}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{v.address} · {v.total_units}호실</p>
                </div>
                <span className="text-[#9CA3AF] text-lg ml-2">›</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
      <p className="text-[11px] text-[#6B7280] font-bold">{label}</p>
      <p className="mt-1">
        <span className="text-[22px] font-black" style={{ color: accent }}>{value}</span>
        <span className="text-[12px] text-[#6B7280] font-bold ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
