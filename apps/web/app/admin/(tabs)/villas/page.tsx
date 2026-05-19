'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type VillaRow = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  account_bank: string | null;
  account_number: string | null;
  status: string;
};

type Card = VillaRow & {
  current_month_label: string | null;
  per_unit_amount: number;
  paid_count: number;
  pay_rate: number;
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminVillasPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: adminRow } = await supabase.from('admins').select('id').eq('auth_id', user.id).maybeSingle();
    if (!adminRow) return;
    const adminId = (adminRow as { id: string }).id;

    const { data: vs, error: vErr } = await supabase
      .from('villas')
      .select('id, name, address, total_units, account_bank, account_number, status')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false });
    if (vErr) { setError(vErr.message); setLoading(false); return; }
    const villas = (vs ?? []) as VillaRow[];

    if (villas.length === 0) {
      setCards([]); setLoading(false); return;
    }

    const villaIds = villas.map(v => v.id);
    const thisYM = new Date().toISOString().slice(0, 7);

    const { data: thisMonthBills } = await supabase
      .from('bill_months')
      .select('id, villa_id, year_month, label, bill_items(amount)')
      .in('villa_id', villaIds)
      .eq('year_month', thisYM)
      .eq('status', 'published');

    const billByVilla: Record<string, { label: string; itemTotal: number; bmId: string }> = {};
    ((thisMonthBills ?? []) as unknown as { id: string; villa_id: string; label: string | null; year_month: string; bill_items: { amount: number }[] }[])
      .forEach(bm => {
        billByVilla[bm.villa_id] = {
          label: bm.label ?? `${bm.year_month} 관리비`,
          itemTotal: (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0),
          bmId: bm.id,
        };
      });

    const bmIds = Object.values(billByVilla).map(b => b.bmId);
    const paidByBm: Record<string, number> = {};
    if (bmIds.length > 0) {
      const { data: payData } = await supabase
        .from('payments').select('bill_month_id, is_paid')
        .in('bill_month_id', bmIds).eq('is_paid', true);
      ((payData ?? []) as { bill_month_id: string }[]).forEach(p => {
        paidByBm[p.bill_month_id] = (paidByBm[p.bill_month_id] || 0) + 1;
      });
    }

    setCards(villas.map(v => {
      const bill = billByVilla[v.id];
      const perUnit = bill && v.total_units > 0 ? Math.round(bill.itemTotal / v.total_units) : 0;
      const paid = bill ? paidByBm[bill.bmId] ?? 0 : 0;
      return {
        ...v,
        current_month_label: bill?.label ?? null,
        per_unit_amount: perUnit,
        paid_count: paid,
        pay_rate: bill && v.total_units > 0 ? Math.round((paid / v.total_units) * 100) : 0,
      };
    }));
    setLoading(false);
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[14px] text-[#3766EE] font-bold tracking-[0.16em] mb-1.5">VILLAS</p>
          <h1 className="text-[26px] font-black text-[#0F2242]">내 빌라</h1>
          <p className="text-[16px] text-[#6B7280] mt-0.5">총 {cards.length}개 등록</p>
        </div>
        <Link href="/admin/villas/add" className="bg-[#3766EE] text-white text-[16px] font-bold px-3.5 py-2.5 rounded-xl shadow-sm">
          ＋ 빌라 추가
        </Link>
      </div>

      {loading ? <p className="text-center text-[16px] text-[#9CA3AF] mt-20">불러오는 중…</p>
        : error ? <p className="text-center text-[16px] text-[#E74C3C] mt-20">오류: {error}</p>
        : cards.length === 0 ? (
          <Link href="/admin/villas/add" className="block bg-white border border-dashed border-[#3766EE]/30 rounded-2xl p-8 text-center mt-10 hover:bg-[#EEF1FB]">
            <div className="text-4xl mb-3">🏘️</div>
            <p className="text-[18px] font-bold text-[#0F2242]">첫 빌라를 등록해주세요</p>
            <p className="text-[15px] text-[#6B7280] mt-1">+ 빌라 추가 버튼으로 시작</p>
          </Link>
        ) : (
          <div className="mt-5 space-y-3">
            {cards.map(v => (
              <Link
                key={v.id}
                href={`/admin/villas/${v.id}`}
                className="block bg-white rounded-2xl p-4 border border-[#E8EBF0] shadow-sm active:scale-[0.99] transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[19px] font-extrabold text-[#0F2242]">{v.name}</h3>
                      <span className={`text-[13px] font-bold px-2 py-0.5 rounded ${
                        v.status === 'active' ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]' : 'bg-[#F5F6FA] text-[#6B7280]'
                      }`}>
                        {v.status === 'active' ? '운영중' : v.status}
                      </span>
                    </div>
                    <p className="text-[15px] text-[#6B7280] mt-0.5">{v.address} · {v.total_units}세대</p>
                  </div>
                  <span className="text-[#9CA3AF] text-xl ml-2">›</span>
                </div>

                {/* 이번달 관리비 + 납부율 */}
                {v.current_month_label ? (
                  <div className="bg-[#EEF1FB] border border-[#3766EE]/15 rounded-xl p-3.5 mt-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[14px] text-[#6B7280] font-bold">{v.current_month_label}</p>
                        <p className="text-[22px] font-extrabold text-[#0F2242] mt-0.5">
                          ₩{fmt(v.per_unit_amount)}
                        </p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">세대당 · 총 {v.total_units}세대</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] text-[#6B7280] font-bold">납부율</p>
                        <p className={`text-[26px] font-black ${v.pay_rate >= 80 ? 'text-[#2ECC71]' : v.pay_rate >= 50 ? 'text-[#F39C12]' : 'text-[#E74C3C]'}`}>
                          {v.pay_rate}%
                        </p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">{v.paid_count}/{v.total_units}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F5F6FA] border border-dashed border-[#E8EBF0] rounded-xl p-3 mt-2 text-center">
                    <p className="text-[14px] text-[#9CA3AF]">이번 달 관리비 미발행</p>
                  </div>
                )}

                {(v.account_bank || v.account_number) && (
                  <p className="text-[13px] text-[#9CA3AF] mt-2">💳 {v.account_bank} {v.account_number}</p>
                )}
              </Link>
            ))}
          </div>
        )
      }
    </div>
  );
}
