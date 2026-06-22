'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ResidentPageHeader from '@/components/ResidentPageHeader';
import Icon from '@/components/Icon';
import { requestPayment, registerBillingKey, isTossLive, type PaymentMethod } from '@/lib/payments';

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
  special_notes: string | null; expose_admin_contact: boolean | null;
};

type AdminContact = { admin_name: string; admin_phone: string };

type Payment = {
  id: string; bill_month_id: string; is_paid: boolean;
  paid_at: string | null; method: string | null; amount: number;
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }
function ymLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

export default function ResidentBillsShell() {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [villa, setVilla] = useState<Villa | null>(null);
  const [months, setMonths] = useState<BillMonth[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [adminContact, setAdminContact] = useState<AdminContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [autoPay, setAutoPay] = useState(false);
  const [hasBillingKey, setHasBillingKey] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('villatolk:resident');
    if (!raw) { router.replace('/resident/login'); return; }
    const s = JSON.parse(raw) as Resident;
    setResident(s);
    void load(s);
  }, [router]);

  async function load(s: Resident) {
    const { data: unitData } = await supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle();
    const uid = (unitData as { id: string } | null)?.id ?? null;
    setUnitId(uid);
    const [{ data: v }, { data: bms }, { data: ps }, { data: contact }] = await Promise.all([
      supabase.from('villas').select('name, address, total_units, account_bank, account_number, account_holder, special_notes, expose_admin_contact').eq('id', s.villaId).maybeSingle(),
      supabase.from('bill_months').select('id, year_month, label, due_date, status, billing_mode, per_unit_amounts, bill_items(id, name, amount)')
        .eq('villa_id', s.villaId).in('status', ['published', 'closed']).order('year_month', { ascending: false }),
      uid ? supabase.from('payments').select('id, bill_month_id, is_paid, paid_at, method, amount').eq('unit_id', uid) : Promise.resolve({ data: [] }),
      supabase.rpc('get_villa_admin_contact', { p_villa_id: s.villaId }),
    ]);
    setVilla(v as Villa | null);
    setMonths((bms ?? []) as unknown as BillMonth[]);
    setPayments((ps ?? []) as Payment[]);
    const c = ((contact ?? []) as AdminContact[])[0];
    setAdminContact(c ?? null);

    // 자동결제(빌링키) 등록 여부
    const { data: bk } = await supabase.from('resident_billing_keys')
      .select('id, auto_pay_enabled').eq('resident_id', s.id).eq('status', 'active').maybeSingle();
    const hasBk = !!bk;
    setHasBillingKey(hasBk);
    setAutoPay(hasBk && (bk as { auto_pay_enabled: boolean } | null)?.auto_pay_enabled === true);

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

  async function confirmPay() {
    if (!currentMonth || !unitId || !resident) return;
    setPaying(true);
    try {
      // 자동납부 선택 + 빌링키 미등록 → 카드 등록(빌링키 발급)
      if (autoPay && !hasBillingKey) {
        const bk = await registerBillingKey({ residentId: resident.id, customerName: resident.name });
        if (!bk.ok || !bk.billingKey) { alert('카드 등록 실패: ' + (bk.message ?? '')); setPaying(false); return; }
        await supabase.from('resident_billing_keys').upsert({
          resident_id: resident.id, unit_id: unitId, villa_id: resident.villaId,
          provider: 'toss', billing_key: bk.billingKey, customer_key: bk.customerKey,
          card_company: bk.cardCompany, card_last4: bk.cardLast4, card_expiry: bk.cardExpiry,
          auto_pay_enabled: true, status: 'active', updated_at: new Date().toISOString(),
        }, { onConflict: 'resident_id' });
      } else if (!autoPay && hasBillingKey) {
        // 자동납부 해제
        await supabase.from('resident_billing_keys').update({ auto_pay_enabled: false })
          .eq('resident_id', resident.id);
      }

      // 이번 달 결제 처리 (① 일회성)
      const pay = await requestPayment({
        method: payMethod,
        amount: myAmt,
        orderName: `${ymLabel(currentMonth.year_month)} 관리비 - ${resident.ho}`,
        customerName: resident.name,
      });
      if (!pay.ok) { alert('결제 실패: ' + (pay.message ?? '')); setPaying(false); return; }

      const row = {
        is_paid: true, paid_at: new Date().toISOString(),
        method: payMethod === 'card' ? 'card' : 'transfer',
        pg_provider: pay.pgProvider, pg_payment_key: pay.pgPaymentKey,
        pg_order_id: pay.pgOrderId, pg_status: 'done', auto_paid: false,
      };
      const existing = paymentFor(currentMonth.id);
      if (existing) {
        await supabase.from('payments').update(row).eq('id', existing.id);
      } else {
        await supabase.from('payments').insert({ bill_month_id: currentMonth.id, unit_id: unitId, amount: myAmt, ...row });
      }

      if (pay.stub) {
        alert('✓ 납부 완료 (테스트 모드)\n\n토스페이먼츠 운영키 발급 후 실제 카드·계좌이체 결제로 전환됩니다.');
      }
    } catch (e) {
      alert('처리 중 오류: ' + (e instanceof Error ? e.message : ''));
    }
    setPaying(false);
    setShowPayModal(false);
    if (resident) await load(resident);
  }

  if (loading || !resident) {
    return null;
  }

  const nowYm = new Date().toISOString().slice(0, 7);
  const currentMonth =
    months.find(m => m.year_month === nowYm && m.status === 'published') ??
    months.find(m => m.status === 'published') ??
    months[0];
  const pastMonths = months.filter(m => m.id !== currentMonth?.id);
  const currentPay = currentMonth ? paymentFor(currentMonth.id) : undefined;
  const myAmt = currentMonth ? myAmount(currentMonth) : 0;
  const totalItems = currentMonth?.bill_items.reduce((s, i) => s + i.amount, 0) ?? 0;
  const totalUnits = villa?.total_units ?? 1;
  const accountLine = villa?.account_bank && villa?.account_number
    ? `${villa.account_bank} ${villa.account_number}` : null;

  return (
    <>
      <ResidentPageHeader villaName={resident.villaName} title="관리비" ho={resident.ho} name={resident.name} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {/* 특이사항 — 항시 노출 */}
        {villa?.special_notes && (
          <div className="bg-[#E9E9FD] border border-[#2B2BEE]/15 rounded-xl px-4 py-3 mb-3">
            <p className="text-[12px] font-bold text-[#2B2BEE] mb-1">빌라 안내</p>
            <p className="text-[13px] text-[#0F2242] leading-relaxed whitespace-pre-wrap">{villa.special_notes}</p>
          </div>
        )}

        {/* 관리자 연락처 — 노출 설정 시 */}
        {adminContact && (
          <a href={`tel:${adminContact.admin_phone}`} className="flex items-center justify-between bg-white border border-[#F0F2F5] rounded-xl px-4 py-3 mb-3 shadow-sm">
            <div>
              <p className="text-[11px] text-[#9CA3AF]">관리자</p>
              <p className="text-[14px] font-bold text-[#0F2242]">{adminContact.admin_name}</p>
            </div>
            <span className="flex items-center gap-1 text-[13px] font-bold text-[#2B2BEE]"><Icon name="phone" size={15} color="#2B2BEE" filled />{adminContact.admin_phone}</span>
          </a>
        )}

        {currentMonth ? (
          <div className="bg-gradient-to-br from-[#2B2BEE] to-[#5454F0] rounded-xl px-5 py-6 text-white shadow-md text-center">
            <p className="text-[13px] font-bold opacity-90">{ymLabel(currentMonth.year_month)} 관리비</p>
            <p className="mt-2">
              <span className="text-[40px] font-black tracking-tight align-middle">{fmt(myAmt)}</span>
              <span className="text-[16px] font-bold opacity-90 ml-1 align-middle">원</span>
            </p>
            <p className="text-[12px] opacity-75 mt-1">총 {fmt(totalItems)}원 ÷ {totalUnits}세대</p>

            <button
              onClick={() => !currentPay?.is_paid && setShowPayModal(true)}
              disabled={!!currentPay?.is_paid}
              className={`mt-5 w-full rounded-xl py-3.5 text-[15px] font-extrabold transition ${
                currentPay?.is_paid
                  ? 'bg-transparent border border-white/40 text-white'
                  : 'bg-white text-[#2B2BEE] hover:bg-[#F5F6FA]'
              }`}
            >
              {currentPay?.is_paid ? '납부 완료' : '납부하기'}
            </button>

            {accountLine && (
              <p className="text-[12px] opacity-85 mt-3">납부 계좌: {accountLine}</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 border border-[#F0F2F5] text-center">
            <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="bills" size={26} color="#2B2BEE" filled /></div>
            <p className="text-[14px] font-bold text-[#0F2242]">이번 달 청구서가 없습니다</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">관리자가 청구서를 발행하면 여기에 표시됩니다</p>
          </div>
        )}

        {currentMonth && currentMonth.bill_items.length > 0 && (
          <>
            <h2 className="text-[15px] font-extrabold text-[#0F2242] mt-7 mb-3">항목별 내역</h2>
            <div className="space-y-2">
              {currentMonth.bill_items.map(it => {
                const perUnit = Math.round(it.amount / totalUnits);
                return (
                  <div key={it.id} className="bg-white rounded-xl px-4 py-3.5 border border-[#F0F2F5] shadow-sm flex items-center justify-between">
                    <span className="text-[14px] font-bold text-[#0F2242]">{it.name}</span>
                    <div className="text-right">
                      <p className="text-[15px] font-extrabold text-[#0F2242]">{fmt(it.amount)}원</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">세대당 {fmt(perUnit)}원</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {pastMonths.length > 0 && (
          <>
            <h2 className="text-[15px] font-extrabold text-[#0F2242] mt-7 mb-3">이전 관리비</h2>
            <div className="space-y-2">
              {pastMonths.slice(0, 6).map(m => {
                const amt = myAmount(m);
                const pay = paymentFor(m.id);
                return (
                  <div key={m.id} className="bg-white rounded-xl px-4 py-3.5 border border-[#F0F2F5] shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-extrabold text-[#0F2242]">{fmt(amt)}원</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{ymLabel(m.year_month)}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      pay?.is_paid ? 'bg-[#E9E9FD] text-[#2B2BEE]' : 'bg-[#F5F6FA] text-[#9CA3AF]'
                    }`}>
                      {pay?.is_paid ? '납부완료' : '미납'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showPayModal && currentMonth && (
        <PaymentModal
          ym={currentMonth.year_month}
          amount={myAmt}
          account={accountLine}
          loading={paying}
          method={payMethod}
          onMethod={setPayMethod}
          autoPay={autoPay}
          onAutoPay={setAutoPay}
          hasBillingKey={hasBillingKey}
          onClose={() => setShowPayModal(false)}
          onConfirm={confirmPay}
        />
      )}
    </>
  );
}

function PaymentModal({
  ym, amount, account, loading, method, onMethod, autoPay, onAutoPay, hasBillingKey, onClose, onConfirm,
}: {
  ym: string; amount: number; account: string | null; loading: boolean;
  method: PaymentMethod; onMethod: (m: PaymentMethod) => void;
  autoPay: boolean; onAutoPay: (v: boolean) => void; hasBillingKey: boolean;
  onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0F2242]/40">
      <div className="bg-white w-full max-w-screen-sm rounded-t-2xl px-5 pt-3 pb-7 animate-[slideUp_.2s_ease-out]">
        <div className="w-10 h-1 bg-[#E8EBF0] rounded-full mx-auto mb-4" />
        <h3 className="text-[18px] font-extrabold text-[#0F2242]">관리비 납부</h3>
        <p className="text-[14px] text-[#6B7280] mt-2 leading-relaxed">
          {ymLabel(ym)} 관리비 <span className="font-extrabold text-[#0F2242]">{fmt(amount)}원</span>
        </p>

        {/* 결제 수단 */}
        <p className="text-[13px] font-bold text-[#0F2242] mt-4 mb-2">결제 수단</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onMethod('card')}
            className={`rounded-xl py-3 text-[14px] font-bold border-[1.5px] transition ${method === 'card' ? 'border-[#2B2BEE] bg-[#E9E9FD] text-[#2B2BEE]' : 'border-[#E8EBF0] bg-white text-[#6B7280]'}`}>
            카드
          </button>
          <button onClick={() => onMethod('transfer')}
            className={`rounded-xl py-3 text-[14px] font-bold border-[1.5px] transition ${method === 'transfer' ? 'border-[#2B2BEE] bg-[#E9E9FD] text-[#2B2BEE]' : 'border-[#E8EBF0] bg-white text-[#6B7280]'}`}>
            실시간 계좌이체
          </button>
        </div>

        {/* 매월 자동납부 (카드 빌링) */}
        <label className="flex items-start gap-3 mt-3 bg-[#F5F6FA] rounded-xl p-3 cursor-pointer">
          <input type="checkbox" checked={autoPay} onChange={e => onAutoPay(e.target.checked)} className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[#2B2BEE]" />
          <span>
            <span className="block text-[14px] font-bold text-[#0F2242]">매월 자동납부 {hasBillingKey && <span className="text-[#2B2BEE]">· 등록됨</span>}</span>
            <span className="block text-[12px] text-[#6B7280] mt-0.5">카드를 등록하면 매월 관리비가 자동으로 결제됩니다.</span>
          </span>
        </label>

        {account && <p className="text-[12px] text-[#9CA3AF] mt-3">또는 직접 이체: {account}</p>}
        {!isTossLive && <p className="text-[12px] text-[#2B2BEE] mt-2">⚠ 현재 테스트 모드 — 운영키 셋업 후 실제 결제됩니다.</p>}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-white border border-[#E8EBF0] text-[#0F2242] rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#F9FAFB] transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-[#2B2BEE] text-white rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#1C1CC9] transition disabled:opacity-50"
          >
            {loading ? '처리 중…' : `${fmt(amount)}원 납부`}
          </button>
        </div>
      </div>
    </div>
  );
}
