'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Resident = {
  id: string;
  name: string;
  phone: string;
  ho: string;
  villaId: string;
  villaName: string;
  villaAddress: string;
};

type BillItem = { id: string; name: string; amount: number };
type BillMonth = {
  id: string;
  year_month: string;
  label: string | null;
  due_date: string | null;
  status: string;
  billing_mode: string | null;
  per_unit_amounts: Record<string, number> | null;
  bill_items: BillItem[];
};

type Villa = {
  name: string;
  address: string;
  total_units: number;
  account_bank: string | null;
  account_number: string | null;
  account_holder: string | null;
};

type Payment = {
  id: string;
  bill_month_id: string;
  is_paid: boolean;
  paid_at: string | null;
  method: string | null;
  amount: number;
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: '계좌이체',
  toss: '토스결제',
  card: '카드',
  cash: '현금',
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function ResidentBillsShell() {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [villa, setVilla] = useState<Villa | null>(null);
  const [months, setMonths] = useState<BillMonth[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [myUnitId, setMyUnitId] = useState<string | null>(null);
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

    // unit_id 조회
    const { data: unitData } = await supabase
      .from('units')
      .select('id')
      .eq('villa_id', s.villaId)
      .eq('ho_number', s.ho)
      .maybeSingle();
    const uid = (unitData as { id: string } | null)?.id ?? null;
    setMyUnitId(uid);

    // 빌라 + 회차 + 항목 + 내 호실 결제
    const [{ data: v }, { data: bms }, { data: ps }] = await Promise.all([
      supabase.from('villas').select('name, address, total_units, account_bank, account_number, account_holder').eq('id', s.villaId).maybeSingle(),
      supabase
        .from('bill_months')
        .select('id, year_month, label, due_date, status, billing_mode, per_unit_amounts, bill_items(id, name, amount)')
        .eq('villa_id', s.villaId)
        .in('status', ['published', 'closed'])
        .order('year_month', { ascending: false }),
      uid ? supabase.from('payments').select('id, bill_month_id, is_paid, paid_at, method, amount').eq('unit_id', uid) : Promise.resolve({ data: [] }),
    ]);

    setVilla(v as Villa | null);
    setMonths((bms ?? []) as unknown as BillMonth[]);
    setPayments((ps ?? []) as Payment[]);
    setLoading(false);
  }

  function myAmount(bm: BillMonth): number {
    if (bm.per_unit_amounts && resident?.ho && bm.per_unit_amounts[resident.ho]) {
      return bm.per_unit_amounts[resident.ho];
    }
    const total = (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0);
    return villa?.total_units ? Math.round(total / villa.total_units) : total;
  }

  function paymentFor(bmId: string): Payment | undefined {
    return payments.find(p => p.bill_month_id === bmId);
  }

  // 수선충당금 누적
  const reserveAccumulated = months.reduce((sum, m) => {
    const items = (m.bill_items ?? []).filter(i => /수선/.test(i.name));
    const itemSum = items.reduce((s, i) => s + i.amount, 0);
    return sum + (villa?.total_units ? Math.round(itemSum / villa.total_units) : 0);
  }, 0);
  const reserveMonthCount = months.filter(m => (m.bill_items ?? []).some(i => /수선/.test(i.name))).length;

  if (loading || !resident) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">
        불러오는 중…
      </div>
    );
  }

  const currentMonth = months.find(m => m.status === 'published');
  const pastMonths = months.filter(m => m.id !== currentMonth?.id);

  return (
    <div>
      {/* Header */}
      <header className="bg-[#0F2242] text-white px-5 pt-10 pb-6">
        <p className="text-[13px] text-white/40 tracking-widest font-bold">VILLATOLK</p>
        <h1 className="text-[20px] font-extrabold mt-1">{resident.villaName}</h1>
        <p className="text-[14px] text-white/60 mt-0.5">{resident.ho} · {resident.name}</p>
      </header>

      <div className="px-5 pt-5 max-w-screen-sm mx-auto">
        {/* 이번 달 청구 — 큰 카드 */}
        {currentMonth ? (
          <div className="bg-white rounded-2xl p-5 border border-[#E8EBF0] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[14px] text-[#6B7280] font-bold">{currentMonth.year_month}</p>
                <h2 className="text-[18px] font-extrabold text-[#0F2242] mt-0.5">
                  {currentMonth.label ?? `${currentMonth.year_month} 관리비`}
                </h2>
              </div>
              {(() => {
                const pay = paymentFor(currentMonth.id);
                if (pay?.is_paid) {
                  return <span className="bg-[rgba(46,204,113,0.12)] text-[#2ECC71] text-[13px] font-bold px-2.5 py-1 rounded-full">납부완료</span>;
                }
                return <span className="bg-[rgba(231,76,60,0.12)] text-[#E74C3C] text-[13px] font-bold px-2.5 py-1 rounded-full">미납</span>;
              })()}
            </div>
            <p className="text-[34px] font-black text-[#4263E8]">₩{fmt(myAmount(currentMonth))}</p>
            {currentMonth.due_date && (
              <p className="text-[14px] text-[#6B7280] mt-1">
                납부 기한: {new Date(currentMonth.due_date).toLocaleDateString('ko-KR')}
              </p>
            )}

            {/* 결제 정보 */}
            {(() => {
              const pay = paymentFor(currentMonth.id);
              if (pay?.is_paid && pay.paid_at) {
                return (
                  <div className="mt-3 pt-3 border-t border-[#E8EBF0] flex items-center justify-between">
                    <span className="text-[14px] text-[#6B7280]">
                      {new Date(pay.paid_at).toLocaleDateString('ko-KR')} 납부
                    </span>
                    <span className="text-[14px] text-[#0F2242] font-semibold">
                      {pay.method ? METHOD_LABEL[pay.method] ?? pay.method : '확인됨'}
                    </span>
                  </div>
                );
              }
              return null;
            })()}

            {/* 항목 breakdown */}
            {currentMonth.bill_items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E8EBF0]">
                <p className="text-[13px] text-[#6B7280] font-bold mb-2">전체 항목</p>
                <ul className="space-y-1.5">
                  {currentMonth.bill_items.map(it => (
                    <li key={it.id} className="flex justify-between text-[15px]">
                      <span className="text-[#6B7280]">{it.name}</span>
                      <span className="text-[#0F2242] font-semibold">₩{fmt(it.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between pt-2 mt-2 border-t border-[#E8EBF0]">
                  <span className="text-[14px] text-[#6B7280] font-bold">빌라 전체 합계</span>
                  <span className="text-[15px] text-[#0F2242] font-extrabold">
                    ₩{fmt(currentMonth.bill_items.reduce((s, i) => s + i.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[14px] text-[#4263E8] font-bold">내 호실 분담</span>
                  <span className="text-[15px] text-[#4263E8] font-extrabold">
                    ₩{fmt(myAmount(currentMonth))}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-[#E8EBF0] text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-[16px] font-bold text-[#0F2242]">이번 달 발행된 청구서가 없습니다</p>
            <p className="text-[14px] text-[#9CA3AF] mt-1">관리자가 청구서를 발행하면 여기에 표시됩니다</p>
          </div>
        )}

        {/* 수선충당금 누적 */}
        {reserveAccumulated > 0 && (
          <div className="mt-3 bg-gradient-to-br from-[#FFF8EE] to-[#FFEFD8] border border-[rgba(243,156,18,0.3)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[16px]">💰</span>
              <span className="text-[14px] font-bold text-[#9C6F1F]">수선충당금 누적</span>
            </div>
            <p className="text-[22px] font-black text-[#9C6F1F]">₩{fmt(reserveAccumulated)}</p>
            <p className="text-[13px] text-[#9C6F1F]/70 mt-1">
              내 호실 기준 · {reserveMonthCount}개월 누적
            </p>
          </div>
        )}

        {/* 입금 계좌 */}
        {(villa?.account_bank || villa?.account_number) && (
          <div className="mt-3 bg-[#EEF1FB] border border-[#4263E8]/15 rounded-2xl p-4">
            <p className="text-[13px] font-bold text-[#4263E8] mb-1">💳 관리비 입금 계좌</p>
            <p className="text-[16px] font-bold text-[#0F2242]">
              {villa.account_bank} {villa.account_number}
            </p>
            {villa.account_holder && (
              <p className="text-[13px] text-[#6B7280] mt-0.5">예금주: {villa.account_holder}</p>
            )}
          </div>
        )}

        {/* 지난 회차 */}
        {pastMonths.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setExpandedPast(!expandedPast)}
              className="w-full flex items-center justify-between text-[15px] text-[#6B7280] font-bold mb-2.5"
            >
              <span>지난 회차 ({pastMonths.length}건)</span>
              <span>{expandedPast ? '▴' : '▾'}</span>
            </button>
            {expandedPast && (
              <div className="space-y-2">
                {pastMonths.map(m => {
                  const amt = myAmount(m);
                  const pay = paymentFor(m.id);
                  return (
                    <div key={m.id} className="bg-white border border-[#E8EBF0] rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[14px] text-[#6B7280] font-bold">{m.year_month}</p>
                        <p className="text-[15px] text-[#0F2242] font-bold mt-0.5">{m.label ?? `${m.year_month} 관리비`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] text-[#0F2242] font-extrabold">₩{fmt(amt)}</p>
                        <span className={`text-[12px] font-bold ${pay?.is_paid ? 'text-[#2ECC71]' : 'text-[#9CA3AF]'}`}>
                          {pay?.is_paid ? '납부완료' : m.status === 'closed' ? '마감' : '미납'}
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
