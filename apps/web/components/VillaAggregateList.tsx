'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';

type Kind = 'bills' | 'notices' | 'residents' | 'parking';

type VillaRow = {
  id: string;
  name: string;
  total_units: number;
  // 기능별 요약
  metricMain: string;   // 큰 값 (예: ₩146,667 / 8명 / 3건 / 5대)
  metricSub: string;    // 보조 (예: 납부율 100% / 대기 2명 / 최근: ... / -)
  highlight?: boolean;  // 주의 표시 (미납/대기 등)
};

const META: Record<Kind, { title: string; sub: string; icon: IconName; color: string; bg: string; path: string }> = {
  bills:     { title: '관리비',   sub: '빌라별 이번 달 관리비 현황', icon: 'bills',     color: '#2B2BEE', bg: '#E9E9FD', path: 'bills' },
  notices:   { title: '공지',     sub: '빌라별 공지 현황',           icon: 'notice',    color: '#2B2BEE', bg: '#E9E9FD', path: 'notices' },
  residents: { title: '입주민',   sub: '빌라별 입주민 현황',         icon: 'residents', color: '#2B2BEE', bg: '#E9E9FD', path: 'residents' },
  parking:   { title: '주차',     sub: '빌라별 등록 차량 현황',      icon: 'parking',   color: '#2B2BEE', bg: '#E9E9FD', path: 'parking' },
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function VillaAggregateList({ kind }: { kind: Kind }) {
  const router = useRouter();
  const [rows, setRows] = useState<VillaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const meta = META[kind];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }
      const { data: adminRow } = await supabase.from('admins').select('id').eq('auth_id', user.id).maybeSingle();
      if (!adminRow) { router.replace('/admin/login'); return; }
      const adminId = (adminRow as { id: string }).id;

      const { data: villasData } = await supabase.from('villas')
        .select('id, name, total_units')
        .eq('admin_id', adminId).eq('status', 'active').order('created_at', { ascending: false });
      const villas = (villasData ?? []) as { id: string; name: string; total_units: number }[];
      if (villas.length === 0) { setRows([]); setLoading(false); return; }
      const villaIds = villas.map(v => v.id);

      let built: VillaRow[] = [];

      if (kind === 'bills') {
        const thisYM = new Date().toISOString().slice(0, 7);
        const { data: bills } = await supabase.from('bill_months')
          .select('id, villa_id, label, year_month, billing_mode, per_unit_amounts, bill_items(amount)')
          .in('villa_id', villaIds).eq('year_month', thisYM).eq('status', 'published');
        const byVilla: Record<string, { label: string; total: number; bmId: string }> = {};
        ((bills ?? []) as unknown as { id: string; villa_id: string; label: string | null; year_month: string; billing_mode: string | null; per_unit_amounts: Record<string, number> | null; bill_items: { amount: number }[] }[])
          .forEach(bm => {
            const total = bm.billing_mode === 'per_unit'
              ? Object.values(bm.per_unit_amounts ?? {}).reduce((s, v) => s + (v ?? 0), 0)
              : (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0);
            byVilla[bm.villa_id] = { label: bm.label ?? `${bm.year_month} 관리비`, total, bmId: bm.id };
          });
        const bmIds = Object.values(byVilla).map(b => b.bmId);
        const paidByBm: Record<string, number> = {};
        if (bmIds.length > 0) {
          const { data: pays } = await supabase.from('payments').select('bill_month_id, is_paid').in('bill_month_id', bmIds);
          ((pays ?? []) as { bill_month_id: string; is_paid: boolean }[]).forEach(p => {
            if (p.is_paid) paidByBm[p.bill_month_id] = (paidByBm[p.bill_month_id] ?? 0) + 1;
          });
        }
        built = villas.map(v => {
          const b = byVilla[v.id];
          if (!b) return { id: v.id, name: v.name, total_units: v.total_units, metricMain: '미발행', metricSub: '이번 달 관리비 없음', highlight: true };
          const perUnit = v.total_units > 0 ? Math.round(b.total / v.total_units) : 0;
          const paid = paidByBm[b.bmId] ?? 0;
          const rate = v.total_units > 0 ? Math.round((paid / v.total_units) * 100) : 0;
          return {
            id: v.id, name: v.name, total_units: v.total_units,
            metricMain: `₩${fmt(perUnit)}`,
            metricSub: `납부율 ${rate}% · ${paid}/${v.total_units}`,
            highlight: rate < 100,
          };
        });
      } else if (kind === 'residents') {
        const { data: res } = await supabase.from('residents')
          .select('status, units!inner(villa_id)').in('units.villa_id', villaIds);
        const active: Record<string, number> = {}, pending: Record<string, number> = {};
        ((res ?? []) as unknown as { status: string; units: { villa_id: string } }[]).forEach(r => {
          const vid = r.units.villa_id;
          if (r.status === 'active') active[vid] = (active[vid] ?? 0) + 1;
          if (r.status === 'pending') pending[vid] = (pending[vid] ?? 0) + 1;
        });
        built = villas.map(v => ({
          id: v.id, name: v.name, total_units: v.total_units,
          metricMain: `${active[v.id] ?? 0}명`,
          metricSub: pending[v.id] ? `승인대기 ${pending[v.id]}명` : `호실 ${v.total_units}개`,
          highlight: !!pending[v.id],
        }));
      } else if (kind === 'notices') {
        const { data: notices } = await supabase.from('notices')
          .select('villa_id, title, created_at').in('villa_id', villaIds).order('created_at', { ascending: false });
        const cnt: Record<string, number> = {}, latest: Record<string, string> = {};
        ((notices ?? []) as { villa_id: string; title: string; created_at: string }[]).forEach(n => {
          cnt[n.villa_id] = (cnt[n.villa_id] ?? 0) + 1;
          if (!latest[n.villa_id]) latest[n.villa_id] = n.title;
        });
        built = villas.map(v => ({
          id: v.id, name: v.name, total_units: v.total_units,
          metricMain: `${cnt[v.id] ?? 0}건`,
          metricSub: latest[v.id] ? `최근: ${latest[v.id]}` : '공지 없음',
        }));
      } else { // parking
        const { data: parks } = await supabase.from('parking')
          .select('vehicle_type, units!inner(villa_id)').in('units.villa_id', villaIds);
        const cnt: Record<string, number> = {}, visitor: Record<string, number> = {};
        ((parks ?? []) as unknown as { vehicle_type: string | null; units: { villa_id: string } }[]).forEach(p => {
          const vid = p.units.villa_id;
          cnt[vid] = (cnt[vid] ?? 0) + 1;
          if (p.vehicle_type === 'visitor') visitor[vid] = (visitor[vid] ?? 0) + 1;
        });
        built = villas.map(v => ({
          id: v.id, name: v.name, total_units: v.total_units,
          metricMain: `${cnt[v.id] ?? 0}대`,
          metricSub: visitor[v.id] ? `방문 ${visitor[v.id]}대 포함` : '등록 차량',
        }));
      }

      setRows(built);
      setLoading(false);
    })();
  }, [kind, router]);

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <div className="px-5 pt-6 pb-4 max-w-screen-sm mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: meta.bg }}>
            <Icon name={meta.icon} size={22} color={meta.color} filled />
          </span>
          <div>
            <h1 className="text-[26px] font-black text-[#0F2242] leading-tight">{meta.title}</h1>
            <p className="text-[14px] text-[#6B7280]">{meta.sub}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 max-w-screen-sm mx-auto">
        {loading ? (
          <p className="text-center text-[14px] text-[#9CA3AF] mt-10">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <div className="bg-white border border-[#F0F2F5] rounded-2xl p-8 text-center">
            <p className="text-[15px] font-bold text-[#0F2242]">등록된 빌라가 없습니다</p>
            <Link href="/admin/villas/add" className="inline-block mt-3 bg-[#2B2BEE] text-white px-4 py-2 rounded-2xl text-[14px] font-bold">＋ 빌라 등록</Link>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-[#6B7280] mb-3">전체 빌라 {rows.length}개 — 탭하면 해당 빌라 {meta.title} 관리로 이동</p>
            <div className="space-y-2.5">
              {rows.map(v => (
                <Link key={v.id} href={`/admin/villas/${v.id}/${meta.path}`}
                  className="block bg-white border border-[#F0F2F5] rounded-2xl p-4 shadow-sm active:scale-[0.99] transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-extrabold text-[#0F2242] truncate">{v.name}</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">{v.metricSub}</p>
                    </div>
                    <div className="text-right ml-3 flex items-center gap-2">
                      <span className={`text-[17px] font-black ${v.highlight ? 'text-[#FF3B30]' : 'text-[#2B2BEE]'}`}>{v.metricMain}</span>
                      <span className="text-[18px] text-[#9CA3AF]">›</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
