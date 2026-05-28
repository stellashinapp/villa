'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/admin-cache';
import Icon, { type IconName } from '@/components/Icon';

type Profile = { id: string; name: string | null; email: string };
type Subscription = {
  status: string;
  card_brand: string | null;
  card_last4: string | null;
  trial_ends_at: string | null;
};

type VillaCard = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  current_month_label: string | null;
  per_unit_amount: number;
  paid_count: number;
  pay_rate: number;
};

type Aggregate = {
  totalVillas: number;
  totalUnits: number;
  totalActiveResidents: number;
  pendingApplications: number;
  pendingMoveouts: number;
  unreadMessages: number;
  unpaidCurrentMonth: number;
  publishedThisMonth: number;
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminHomeShell() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [villas, setVillas] = useState<VillaCard[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [agg, setAgg] = useState<Aggregate>({
    totalVillas: 0, totalUnits: 0, totalActiveResidents: 0,
    pendingApplications: 0, pendingMoveouts: 0, unreadMessages: 0,
    unpaidCurrentMonth: 0, publishedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const adminRow = await getCurrentAdmin();
      if (!adminRow) { await supabase.auth.signOut(); router.replace('/admin/login'); return; }
      setProfile(adminRow as Profile);
      const adminId = adminRow.id;

      const [{ data: villasData }, { data: subData }] = await Promise.all([
        supabase.from('villas').select('id, name, total_units, address')
          .eq('admin_id', adminId).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('status, card_brand, card_last4, trial_ends_at')
          .eq('admin_id', adminId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const vs = (villasData ?? []) as { id: string; name: string; total_units: number; address: string }[];
      setSub(subData as Subscription | null);

      if (vs.length === 0) { setVillas([]); setLoading(false); return; }

      const villaIds = vs.map(v => v.id);
      const totalUnits = vs.reduce((s, v) => s + (v.total_units ?? 0), 0);

      const [
        { count: activeResCount }, { count: pendingAppCount }, { count: pendingMoveCount },
        { count: unreadMsgCount }, { data: thisMonthBills },
      ] = await Promise.all([
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'active'),
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'pending'),
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
          .in('units.villa_id', villaIds).eq('status', 'pending_moveout'),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .in('villa_id', villaIds).eq('is_read', false),
        // 발행(published)된 회차 전부 — 최신 연-월 우선 (현재 달이 아닌 미래/지난 달 발행분도 홈에 표시)
        supabase.from('bill_months').select('id, villa_id, year_month, label, billing_mode, per_unit_amounts, bill_items(amount)')
          .in('villa_id', villaIds).eq('status', 'published').order('year_month', { ascending: false }),
      ]);

      const billByVilla: Record<string, { label: string; itemTotal: number; bmId: string }> = {};
      ((thisMonthBills ?? []) as unknown as { id: string; villa_id: string; label: string | null; year_month: string; billing_mode: string | null; per_unit_amounts: Record<string, number> | null; bill_items: { amount: number }[] }[])
        .forEach(bm => {
          if (billByVilla[bm.villa_id]) return; // 이미 더 최근 회차가 담김 (year_month desc 정렬)
          const itemTotal = bm.billing_mode === 'per_unit'
            ? Object.values(bm.per_unit_amounts ?? {}).reduce((s, v) => s + (v ?? 0), 0)
            : (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0);
          billByVilla[bm.villa_id] = {
            label: bm.label ?? `${bm.year_month} 관리비`,
            itemTotal,
            bmId: bm.id,
          };
        });

      const bmIds = Object.values(billByVilla).map(b => b.bmId);
      const paidByBm: Record<string, number> = {};
      if (bmIds.length > 0) {
        const { data: payData } = await supabase.from('payments').select('bill_month_id, is_paid').in('bill_month_id', bmIds);
        ((payData ?? []) as { bill_month_id: string; is_paid: boolean }[]).forEach(p => {
          if (p.is_paid) paidByBm[p.bill_month_id] = (paidByBm[p.bill_month_id] || 0) + 1;
        });
      }

      const villaCards: VillaCard[] = vs.map(v => {
        const bill = billByVilla[v.id];
        const perUnit = bill && v.total_units > 0 ? Math.round(bill.itemTotal / v.total_units) : 0;
        const paid = bill ? paidByBm[bill.bmId] ?? 0 : 0;
        return {
          id: v.id, name: v.name, address: v.address, total_units: v.total_units,
          current_month_label: bill?.label ?? null,
          per_unit_amount: perUnit, paid_count: paid,
          pay_rate: bill && v.total_units > 0 ? Math.round((paid / v.total_units) * 100) : 0,
        };
      });
      setVillas(villaCards);

      const totalUnpaid = villaCards.reduce((s, v) => s + (v.current_month_label ? v.total_units - v.paid_count : 0), 0);
      setAgg({
        totalVillas: vs.length, totalUnits, totalActiveResidents: activeResCount ?? 0,
        pendingApplications: pendingAppCount ?? 0, pendingMoveouts: pendingMoveCount ?? 0,
        unreadMessages: unreadMsgCount ?? 0,
        unpaidCurrentMonth: totalUnpaid, publishedThisMonth: villaCards.filter(v => v.current_month_label).length,
      });
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return null;
  }

  const trialDays = sub?.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const subLabel = sub?.status === 'active' ? '활성' : sub?.status === 'trialing' ? `무료체험 D-${trialDays ?? '-'}` : sub?.status === 'past_due' ? '결제 실패' : '구독 미가입';

  // 첫 빌라 (banner 용)
  const featuredVilla = villas[0];

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      {/* 상단 브랜드 헤더는 admin/(tabs)/layout.tsx 에서 항상 고정 표시 — 여기선 페이지 본문만 */}

      <div className="px-5 pb-8 max-w-screen-sm mx-auto">
        {/* Welcome — 인사 */}
        <div className="pt-4 pb-3">
          <h2 className="text-[20px] font-black text-[#0F2242]">{profile?.name || profile?.email}님</h2>
          <p className="text-[14px] text-[#6B7280] mt-0.5">
            빌라 {agg.totalVillas}개 · 입주민 {agg.totalActiveResidents}명
          </p>
        </div>

        {/* 히어로 배너 — 이번달 관리비 안내 */}
        {featuredVilla?.current_month_label ? (
          <Link
            href={`/admin/villas/${featuredVilla.id}`}
            className="block bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-md mb-5 active:scale-[0.99] transition"
          >
            <p className="text-[11px] font-bold opacity-80 tracking-wider mb-1">{featuredVilla.current_month_label}</p>
            <h3 className="text-[20px] font-black mb-1">{featuredVilla.name}</h3>
            <div className="flex items-end justify-between mt-3">
              <div>
                <p className="text-[28px] font-black">₩{fmt(featuredVilla.per_unit_amount)}</p>
                <p className="text-[12px] opacity-80 mt-0.5">세대당 · {featuredVilla.total_units}세대</p>
              </div>
              <div className="text-right">
                <p className="text-[28px] font-black">{featuredVilla.pay_rate}%</p>
                <p className="text-[12px] opacity-80 mt-0.5">납부율 {featuredVilla.paid_count}/{featuredVilla.total_units}</p>
              </div>
            </div>
          </Link>
        ) : agg.totalVillas === 0 ? (
          <Link
            href="/admin/villas/add"
            className="block bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-md mb-5 active:scale-[0.99] transition"
          >
            <p className="text-[12px] font-bold opacity-80 tracking-wider mb-1">START</p>
            <h3 className="text-[20px] font-black mb-2">첫 빌라를 등록하세요</h3>
            <p className="text-[13px] opacity-90">청구비 청구 / 입주민 / 공지 — 한 곳에서</p>
            <p className="text-[14px] font-bold mt-3 underline">＋ 빌라 등록 시작 →</p>
          </Link>
        ) : (
          <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-8 shadow-md mb-5 text-center">
            <p className="text-[16px] text-white/85 mb-5">이번 달 발행된 관리비가 없습니다</p>
            <Link href="/admin/bills" className="flex items-center justify-center w-full bg-white text-[#2B2BEE] rounded-xl py-6 text-[20px] font-extrabold hover:bg-white/90 transition">
              관리비 발행
            </Link>
          </div>
        )}

        {/* 8-그리드 빠른 액션 (아파트아이 스타일) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#F0F2F5] mb-5">
          <div className="grid grid-cols-4 gap-y-4">
            <QuickAction href="/admin/bills" disabled={agg.totalVillas === 0} bg="#E9E9FD" color="#2B2BEE" icon="bills" label="관리비" badge={agg.unpaidCurrentMonth > 0 ? '미납' : undefined} />
            <QuickAction href="/admin/notices" disabled={agg.totalVillas === 0} bg="#E9E9FD" color="#2B2BEE" icon="notice" label="공지작성" />
            <QuickAction href="/admin/residents" disabled={agg.totalVillas === 0} bg="#E9E9FD" color="#2B2BEE" icon="residents" label="입주민" badge={agg.pendingApplications > 0 ? 'NEW' : undefined} />
            <QuickAction href="/admin/inbox" bg="#E9E9FD" color="#2B2BEE" icon="message" label="민원" badge={agg.unreadMessages > 0 ? String(agg.unreadMessages) : undefined} />
            <QuickAction href="/admin/parking" disabled={agg.totalVillas === 0} bg="#E9E9FD" color="#2B2BEE" icon="parking" label="주차" />
            <QuickAction href="/admin/villas" bg="#E9E9FD" color="#2B2BEE" icon="villa" label="빌라" />
            <QuickAction href="/admin/applications" bg="#E9E9FD" color="#2B2BEE" icon="personAdd" label="가입신청" badge={agg.pendingApplications > 0 ? String(agg.pendingApplications) : undefined} />
            <QuickAction href="/admin/settings" bg="#F5F6FA" color="#6B7280" icon="settings" label="설정" />
          </div>
        </div>

        {/* 알림 카드 (아파트아이 스타일 — 컬러 박스 안의 작은 액션 카드) */}
        {(agg.pendingApplications > 0 || agg.pendingMoveouts > 0 || agg.unreadMessages > 0) && (
          <>
            <h3 className="text-[13px] font-bold text-[#0F2242] mb-2 px-1">오늘 처리 필요</h3>
            <div className="bg-white rounded-xl shadow-sm border border-[#F0F2F5] mb-5 overflow-hidden">
              {agg.pendingApplications > 0 && (
                <AlertRow href="/admin/applications" icon="residents" title="가입 신청 대기" desc="입주민 가입 신청을 확인해주세요" count={agg.pendingApplications} accent="#2B2BEE" />
              )}
              {agg.pendingMoveouts > 0 && (
                <AlertRow href="/admin/residents" icon="box" title="이주 확정 대기" desc="입주민 이사 요청을 확정해주세요" count={agg.pendingMoveouts} accent="#2B2BEE" />
              )}
              {agg.unreadMessages > 0 && (
                <AlertRow href="/admin/inbox" icon="message" title="미답변 메시지" desc="입주민 민원에 답변해주세요" count={agg.unreadMessages} accent="#FF3B30" />
              )}
            </div>
          </>
        )}

        {/* 내 빌라 (모든 빌라 카드) */}
        {villas.length > 1 && (
          <>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[13px] font-bold text-[#0F2242]">내 빌라 ({villas.length})</h3>
              <Link href="/admin/villas/add" className="text-[13px] text-[#2B2BEE] font-bold">＋ 추가</Link>
            </div>
            <div className="space-y-2.5 mb-5">
              {villas.slice(1).map(v => (
                <Link key={v.id} href={`/admin/villas/${v.id}`}
                  className="block bg-white rounded-xl p-4 border border-[#F0F2F5] shadow-sm active:scale-[0.99] transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-extrabold text-[#0F2242] truncate">{v.name}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">{v.total_units}세대</p>
                    </div>
                    {v.current_month_label && (
                      <div className="text-right">
                        <p className="text-[15px] font-extrabold text-[#0F2242]">₩{fmt(v.per_unit_amount)}</p>
                        <p className={`text-[11px] font-bold mt-0.5 ${v.pay_rate >= 80 ? 'text-[#2B2BEE]' : v.pay_rate >= 50 ? 'text-[#2B2BEE]' : 'text-[#FF3B30]'}`}>
                          납부율 {v.pay_rate}%
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* 구독 카드 — 최하단 (QA 1) */}
        <h3 className="text-[13px] font-bold text-[#0F2242] mb-2 px-1">구독</h3>
        <Link href="/admin/subscribe" className={`block rounded-xl p-4 shadow-sm mb-5 ${
          sub?.status === 'active' ? 'bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] text-white'
          : sub?.status === 'past_due' ? 'bg-[#FEE8E7] border border-[#FF3B30]/30'
          : sub?.status === 'trialing' ? 'bg-[#E9E9FD] border border-[#2B2BEE]/30'
          : 'bg-white border border-[#F0F2F5]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[11px] font-bold tracking-widest ${sub?.status === 'active' ? 'opacity-80' : 'text-[#6B7280]'}`}>구독 상태</p>
              <p className={`text-[15px] font-extrabold mt-0.5 ${sub?.status === 'past_due' ? 'text-[#FF3B30]' : sub?.status === 'trialing' ? 'text-[#2B2BEE]' : ''}`}>{subLabel}</p>
              {sub?.card_last4 && <p className={`text-[12px] mt-1 ${sub?.status === 'active' ? 'opacity-90' : 'text-[#6B7280]'}`}>{sub.card_brand} ····{sub.card_last4}</p>}
              {!sub && <p className="text-[12px] text-[#6B7280] mt-1">카드 등록 시 무료 체험 시작</p>}
            </div>
            <span className={`text-[20px] ${sub?.status === 'active' ? 'text-white/80' : 'text-[#9CA3AF]'}`}>›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function QuickAction({ href, bg, color, icon, label, badge, disabled }: {
  href: string; bg: string; color: string; icon: IconName; label: string; badge?: string; disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center opacity-40 cursor-not-allowed">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1.5" style={{ background: bg }}>
          <Icon name={icon} size={24} color={color} filled />
        </div>
        <p className="text-[11px] text-[#1A1A1A] font-semibold">{label}</p>
      </div>
    );
  }
  return (
    <Link href={href} className="flex flex-col items-center active:scale-[0.95] transition">
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-1.5" style={{ background: bg }}>
        <Icon name={icon} size={24} color={color} filled />
        {badge && (
          <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#1A1A1A] font-semibold">{label}</p>
    </Link>
  );
}

function AlertRow({ href, icon, title, desc, count, accent }: {
  href: string; icon: IconName; title: string; desc: string; count: number; accent: string;
}) {
  return (
    <Link href={href} className="flex items-center px-4 py-3.5 border-b border-[#F0F2F5] last:border-b-0 active:bg-[#FAFBFC]">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 flex-shrink-0" style={{ background: accent + '20' }}>
        <Icon name={icon} size={20} color={accent} filled />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#0F2242]">{title}</p>
        <p className="text-[12px] text-[#6B7280] mt-0.5">{desc}</p>
      </div>
      <span className="text-[14px] font-extrabold px-3 py-1.5 rounded-full text-white" style={{ background: accent }}>
        {count}건
      </span>
    </Link>
  );
}
