'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Resident = {
  id: string; name: string; phone: string; ho: string;
  villaId: string; villaName: string; villaAddress: string;
};

type BillItem = { id: string; name: string; amount: number };
type BillMonth = {
  id: string; year_month: string; label: string | null; due_date: string | null;
  status: string; billing_mode: string | null;
  per_unit_amounts: Record<string, number> | null;
  bill_items: BillItem[];
};

type Villa = {
  name: string; address: string; total_units: number;
  account_bank: string | null; account_number: string | null; account_holder: string | null;
};

type Payment = {
  id: string; bill_month_id: string; is_paid: boolean;
  paid_at: string | null; method: string | null; amount: number;
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: '계좌이체', toss: '토스결제', card: '카드', cash: '현금',
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function ResidentBillsShell() {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [villa, setVilla] = useState<Villa | null>(null);
  const [months, setMonths] = useState<BillMonth[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPast, setExpandedPast] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) { router.replace('/resident/login'); return; }
    const s = JSON.parse(raw) as Resident;
    setResident(s);
    void load(s);
  }, [router]);

  async function load(s: Resident) {
    setLoading(true);
    const { data: unitData } = await supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle();
    const uid = (unitData as { id: string } | null)?.id ?? null;
    const [{ data: v }, { data: bms }, { data: ps }] = await Promise.all([
      supabase.from('villas').select('name, address, total_units, account_bank, account_number, account_holder').eq('id', s.villaId).maybeSingle(),
      supabase.from('bill_months').select('id, year_month, label, due_date, status, billing_mode, per_unit_amounts, bill_items(id, name, amount)')
        .eq('villa_id', s.villaId).in('status', ['published', 'closed']).order('year_month', { ascending: false }),
      uid ? supabase.from('payments').select('id, bill_month_id, is_paid, paid_at, method, amount').eq('unit_id', uid) : Promise.resolve({ data: [] }),
    ]);
    setVilla(v as Villa | null);
    setMonths((bms ?? []) as unknown as BillMonth[]);
    setPayments((ps ?? []) as Payment[]);
    setLoading(false);
  }

  function myAmount(bm: BillMonth): number {
    if (bm.per_unit_amounts && resident?.ho && bm.per_unit_amounts[resident.ho]) return bm.per_unit_amounts[resident.ho];
    const total = (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0);
    return villa?.total_units ? Math.round(total / villa.total_units) : total;
  }

  function paymentFor(bmId: string): Payment | undefined {
    return payments.find(p => p.bill_month_id === bmId);
  }

  const reserveAccumulated = months.reduce((sum, m) => {
    const items = (m.bill_items ?? []).filter(i => /수선/.test(i.name));
    const itemSum = items.reduce((s, i) => s + i.amount, 0);
    return sum + (villa?.total_units ? Math.round(itemSum / villa.total_units) : 0);
  }, 0);
  const reserveMonthCount = months.filter(m => (m.bill_items ?? []).some(i => /수선/.test(i.name))).length;

  if (loading || !resident) {
    return <div className="min-h-screen flex items-center justify-center text-[14px] text-[#9CA3AF]">불러오는 중…</div>;
  }

  const currentMonth = months.find(m => m.status === 'published');
  const pastMonths = months.filter(m => m.id !== currentMonth?.id);
  const currentPay = currentMonth ? paymentFor(currentMonth.id) : undefined;
  const myAmt = currentMonth ? myAmount(currentMonth) : 0;
  const totalItems = currentMonth?.bill_items.reduce((s, i) => s + i.amount, 0) ?? 0;

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      {/* 상단 */}
      <header className="bg-white px-5 pt-4 pb-3 sticky top-0 z-30 border-b border-[#F0F2F5]">
        <p className="text-[11px] font-bold text-[#9CA3AF] tracking-[0.14em]">{resident.villaName} · {resident.ho}</p>
        <h1 className="text-[18px] font-extrabold text-[#0F2242] mt-1">관리비</h1>
      </header>

      <div className="px-5 pb-8 max-w-screen-sm mx-auto pt-4">
        {/* 이번달 청구 — 큰 히어로 카드 (아파트아이 스타일) */}
        {currentMonth ? (
          <div className="bg-gradient-to-br from-[#3766EE] to-[#5B86FF] rounded-2xl p-5 text-white shadow-md mb-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[11px] font-bold opacity-80 tracking-widest">{currentMonth.year_month}</p>
                <h2 className="text-[16px] font-extrabold mt-0.5">{currentMonth.label ?? `${currentMonth.year_month} 관리비`}</h2>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${currentPay?.is_paid ? 'bg-white text-[#2ECC71]' : 'bg-white/20 text-white border border-white/30'}`}>
                {currentPay?.is_paid ? '✓ 납부완료' : '미납'}
              </span>
            </div>
            <p className="text-[36px] font-black mt-2">₩{fmt(myAmt)}</p>
            <p className="text-[12px] opacity-80 mt-1">내 호실 분담액</p>
            {currentMonth.due_date && (
              <p className="text-[12px] opacity-90 mt-2">납부 기한: {new Date(currentMonth.due_date).toLocaleDateString('ko-KR')}</p>
            )}
            {currentPay?.is_paid && currentPay.paid_at && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                <span className="text-[12px] opacity-80">{new Date(currentPay.paid_at).toLocaleDateString('ko-KR')} 납부</span>
                <span className="text-[12px] font-semibold">{currentPay.method ? METHOD_LABEL[currentPay.method] ?? currentPay.method : '확인됨'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-[#F0F2F5] text-center mb-3">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-[14px] font-bold text-[#0F2242]">이번 달 청구서가 없습니다</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">관리자가 청구서를 발행하면 여기에 표시됩니다</p>
          </div>
        )}

        {/* 입금 계좌 — 빠른 안내 (아파트아이 자동납부 스타일) */}
        {(villa?.account_bank || villa?.account_number) && (
          <div className="bg-white rounded-2xl p-4 border border-[#F0F2F5] mb-3 shadow-sm">
            <div className="flex items-center">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] mr-3 flex-shrink-0 bg-[#EEF2FF]">💳</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#0F2242]">{villa.account_bank} {villa.account_number}</p>
                {villa.account_holder && <p className="text-[11px] text-[#9CA3AF] mt-0.5">예금주: {villa.account_holder}</p>}
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(`${villa.account_bank} ${villa.account_number}`).then(() => alert('계좌 번호 복사됨')).catch(() => {});
              }} className="bg-[#3766EE] text-white text-[12px] font-bold px-3 py-1.5 rounded-full">
                복사
              </button>
            </div>
          </div>
        )}

        {/* 항목 breakdown */}
        {currentMonth && currentMonth.bill_items.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-[#F0F2F5] mb-3 shadow-sm">
            <p className="text-[12px] font-bold text-[#6B7280] tracking-wider mb-3">항목별 (빌라 전체)</p>
            <ul className="space-y-2">
              {currentMonth.bill_items.map(it => (
                <li key={it.id} className="flex justify-between text-[14px]">
                  <span className="text-[#6B7280]">{it.name}</span>
                  <span className="text-[#0F2242] font-semibold">₩{fmt(it.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-3 mt-3 border-t border-[#F0F2F5]">
              <span className="text-[13px] text-[#6B7280] font-bold">빌라 전체</span>
              <span className="text-[14px] text-[#0F2242] font-extrabold">₩{fmt(totalItems)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[13px] text-[#3766EE] font-bold">내 호실 분담 (1/{villa?.total_units})</span>
              <span className="text-[14px] text-[#3766EE] font-extrabold">₩{fmt(myAmt)}</span>
            </div>
          </div>
        )}

        {/* 수선충당금 누적 */}
        {reserveAccumulated > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-[#F0F2F5] mb-3 shadow-sm">
            <div className="flex items-center">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] mr-3 flex-shrink-0 bg-[#FFF7E0]">💰</span>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-[#9C6F1F]">수선충당금 누적</p>
                <p className="text-[18px] font-black text-[#9C6F1F]">₩{fmt(reserveAccumulated)}</p>
                <p className="text-[11px] text-[#9C6F1F]/70 mt-0.5">내 호실 기준 · {reserveMonthCount}개월 누적</p>
              </div>
            </div>
          </div>
        )}

        {/* 지난 회차 */}
        {pastMonths.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-[#F0F2F5] mb-3 shadow-sm">
            <button onClick={() => setExpandedPast(!expandedPast)} className="w-full flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#0F2242]">지난 회차 ({pastMonths.length}건)</span>
              <span className="text-[14px] text-[#9CA3AF]">{expandedPast ? '▴' : '▾'}</span>
            </button>
            {expandedPast && (
              <div className="space-y-2 mt-3 pt-3 border-t border-[#F0F2F5]">
                {pastMonths.map(m => {
                  const amt = myAmount(m);
                  const pay = paymentFor(m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-[13px] text-[#0F2242] font-bold">{m.label ?? `${m.year_month} 관리비`}</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{m.year_month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] text-[#0F2242] font-extrabold">₩{fmt(amt)}</p>
                        <span className={`text-[10px] font-bold ${pay?.is_paid ? 'text-[#2ECC71]' : 'text-[#9CA3AF]'}`}>
                          {pay?.is_paid ? '✓ 납부완료' : m.status === 'closed' ? '마감' : '미납'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
