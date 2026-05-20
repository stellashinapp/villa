'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { BILL_ITEM_PRESETS } from '@villatolk/shared';

type BillItem = { id: string; name: string; amount: number };
type Unit = { id: string; ho_number: string };
type Resident = { id: string; name: string; unit_id: string };
type Payment = { id: string; bill_month_id: string; unit_id: string; is_paid: boolean; method: string | null; paid_at: string | null };

type BillingMode = 'equal' | 'per_unit';

type BillMonth = {
  id: string;
  year_month: string;
  label: string | null;
  due_date: string | null;
  status: string;
  billing_mode: string | null;
  per_unit_amounts: Record<string, number> | null;
  created_at: string;
  bill_items: BillItem[];
};

// 디자인 시스템 단일 팔레트 (#2B2BEE)
const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-[#F5F6FA] text-[#6B7280]',
  published: 'bg-[#E9E9FD] text-[#2B2BEE]',
  closed: 'bg-[#F5F6FA] text-[#9CA3AF]',
};
const STATUS_LABEL: Record<string, string> = { draft: '작성중', published: '고지완료', closed: '마감' };

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminVillaBillsPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [months, setMonths] = useState<BillMonth[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newYM, setNewYM] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDue, setNewDue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [editingItemMonth, setEditingItemMonth] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [bulkAmount, setBulkAmount] = useState('');
  const [villaName, setVillaName] = useState('');
  // 세대별 입력 로컬 상태 (월별 → 호실별 금액 문자열)
  const [unitDraft, setUnitDraft] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => { if (villaId) load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const [{ data: bms }, { data: us }, { data: rs }, { data: villaRow }] = await Promise.all([
      supabase.from('bill_months')
        .select('id, year_month, label, due_date, status, billing_mode, per_unit_amounts, created_at, bill_items(id, name, amount)')
        .eq('villa_id', villaId).order('year_month', { ascending: false }),
      supabase.from('units').select('id, ho_number').eq('villa_id', villaId).order('ho_number'),
      supabase.from('residents').select('id, name, unit_id, units!inner(villa_id)')
        .eq('units.villa_id', villaId).eq('status', 'active'),
      supabase.from('villas').select('name').eq('id', villaId).maybeSingle(),
    ]);
    setVillaName((villaRow as { name: string } | null)?.name ?? '');
    const bmList = (bms ?? []) as unknown as BillMonth[];
    setMonths(bmList);
    setUnits((us ?? []) as Unit[]);
    setResidents(((rs ?? []) as unknown as Resident[]).map(r => ({ id: r.id, name: r.name, unit_id: r.unit_id })));

    // 세대별 입력 로컬 상태 초기화
    const draft: Record<string, Record<string, string>> = {};
    for (const m of bmList) {
      const map = m.per_unit_amounts ?? {};
      draft[m.id] = Object.fromEntries(Object.entries(map).map(([ho, v]) => [ho, v ? String(v) : '']));
    }
    setUnitDraft(draft);

    const bmIds = bmList.map(b => b.id);
    if (bmIds.length > 0) {
      const { data: ps } = await supabase.from('payments').select('*').in('bill_month_id', bmIds);
      setPayments((ps ?? []) as Payment[]);
    } else {
      setPayments([]);
    }
    setLoading(false);
  }

  function modeOf(m: BillMonth): BillingMode {
    return m.billing_mode === 'per_unit' ? 'per_unit' : 'equal';
  }

  function totalOf(m: BillMonth): number {
    if (modeOf(m) === 'per_unit') {
      return Object.values(m.per_unit_amounts ?? {}).reduce((s, v) => s + (v ?? 0), 0);
    }
    return m.bill_items.reduce((s, i) => s + i.amount, 0);
  }

  function perUnitOf(m: BillMonth): number {
    const total = totalOf(m);
    return units.length > 0 ? Math.round(total / units.length) : 0;
  }

  // 호실별 청구 금액 (per_unit 모드: 직접 / equal 모드: 균등)
  function amountForUnit(m: BillMonth, ho: string): number {
    if (modeOf(m) === 'per_unit') return (m.per_unit_amounts ?? {})[ho] ?? 0;
    return perUnitOf(m);
  }

  async function createMonth(e: React.FormEvent) {
    e.preventDefault();
    if (!newYM.match(/^\d{4}-\d{2}$/)) { alert('YYYY-MM 형식으로 입력해주세요 (예: 2026-06)'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('bill_months').insert({
      villa_id: villaId, year_month: newYM,
      label: newLabel.trim() || `${newYM.split('-')[1]}월 관리비`,
      due_date: newDue || null, status: 'draft', billing_mode: 'equal', per_unit_amounts: {},
    });
    setSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes('duplicate') || error.code === '23505') {
        alert(`${newYM} 회차가 이미 존재합니다.`);
      } else {
        alert('생성 실패: ' + error.message);
      }
      return;
    }
    setNewYM(''); setNewLabel(''); setNewDue(''); setShowNew(false);
    await load();
  }

  async function setBillingMode(monthId: string, mode: BillingMode) {
    await supabase.from('bill_months').update({ billing_mode: mode }).eq('id', monthId);
    await load();
  }

  // 세대별 금액 저장 (onBlur)
  async function persistUnitAmount(m: BillMonth, ho: string, raw: string) {
    const v = parseInt(raw.replace(/\D/g, ''), 10);
    const amt = isNaN(v) ? 0 : v;
    const next = { ...(m.per_unit_amounts ?? {}) };
    if (amt > 0) next[ho] = amt; else delete next[ho];
    await supabase.from('bill_months').update({ per_unit_amounts: next }).eq('id', m.id);
    await load();
  }

  // 전체 세대 일괄 적용
  async function applyBulk(m: BillMonth) {
    const v = parseInt(bulkAmount.replace(/\D/g, ''), 10);
    if (!v || v <= 0) { alert('일괄 적용할 금액을 입력하세요'); return; }
    const next: Record<string, number> = {};
    for (const u of units) next[u.ho_number] = v;
    await supabase.from('bill_months').update({ per_unit_amounts: next }).eq('id', m.id);
    setBulkAmount('');
    await load();
  }

  async function addItem(monthId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !itemAmount) return;
    const amt = parseInt(itemAmount, 10);
    if (!amt || amt <= 0) { alert('금액을 정확히 입력하세요'); return; }
    const { error } = await supabase.from('bill_items').insert({
      bill_month_id: monthId, name: itemName.trim(), amount: amt,
    });
    if (error) { alert('항목 추가 실패: ' + error.message); return; }
    setItemName(''); setItemAmount('');
    await load();
  }

  async function removeItem(itemId: string) {
    if (!confirm('이 항목을 삭제할까요?')) return;
    await supabase.from('bill_items').delete().eq('id', itemId);
    await load();
  }

  // 전월 항목 복사
  async function copyPrevious(m: BillMonth) {
    const idx = months.findIndex(x => x.id === m.id);
    const prev = months.slice(idx + 1).find(x => x.bill_items.length > 0);
    if (!prev) { alert('복사할 이전 회차 항목이 없습니다'); return; }
    if (!confirm(`${prev.label ?? prev.year_month} 의 항목 ${prev.bill_items.length}개를 복사할까요?`)) return;
    const rows = prev.bill_items.map(it => ({ bill_month_id: m.id, name: it.name, amount: it.amount }));
    const { error } = await supabase.from('bill_items').insert(rows);
    if (error) { alert('복사 실패: ' + error.message); return; }
    await load();
  }

  async function changeStatus(m: BillMonth, status: string) {
    const labels: Record<string, string> = { published: '고지', closed: '마감', draft: '작성중' };
    if (status === 'published') {
      const total = totalOf(m);
      if (total <= 0) { alert('금액이 0원입니다. 항목 또는 세대별 금액을 먼저 입력하세요.'); return; }
    }
    if (!confirm(`'${labels[status]}' 로 변경할까요?`)) return;
    await supabase.from('bill_months').update({ status }).eq('id', m.id);
    if (status === 'published') {
      const existing = payments.filter(p => p.bill_month_id === m.id).map(p => p.unit_id);
      const toInsert = units
        .filter(u => !existing.includes(u.id))
        .map(u => ({ bill_month_id: m.id, unit_id: u.id, amount: amountForUnit(m, u.ho_number), is_paid: false }));
      if (toInsert.length > 0) await supabase.from('payments').insert(toInsert);
    }
    await load();
  }

  async function removeMonth(monthId: string) {
    if (!confirm('이 회차 (포함 항목까지) 완전히 삭제할까요?')) return;
    await supabase.from('bill_months').delete().eq('id', monthId);
    await load();
  }

  async function togglePaid(payment: Payment, paid: boolean) {
    await supabase.from('payments').update({
      is_paid: paid,
      paid_at: paid ? new Date().toISOString() : null,
      method: paid ? 'bank_transfer' : null,
    }).eq('id', payment.id);
    await load();
  }

  function sendBillNotice(m: BillMonth) {
    alert(`📢 관리비 고지 발송 시뮬레이션\n\n${m.label ?? m.year_month}\n총 금액: ₩${fmt(totalOf(m))}\n${modeOf(m) === 'per_unit' ? '세대별 차등' : `세대당 ₩${fmt(perUnitOf(m))}`}\n대상: ${units.length}세대\n\n실 발송은 카카오 알림톡 셋업 후 자동 발송됩니다.`);
  }

  function paidForUnit(monthId: string, unitId: string): Payment | undefined {
    return payments.find(p => p.bill_month_id === monthId && p.unit_id === unitId);
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href={`/admin/villas/${villaId}`} className="hidden md:inline-block text-[15px] text-[#6B7280]">← 빌라 상세</Link>
      <div className="flex justify-between items-end mt-3 mb-5">
        <div>
          {villaName && <p className="text-[13px] font-bold text-[#2B2BEE] mb-0.5">{villaName}</p>}
          <h1 className="text-[26px] font-black text-[#0F2242]">관리비 고지</h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">일괄 고지 · 세대별 차등고지</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="bg-[#2B2BEE] text-white text-[15px] font-bold px-3.5 py-2.5 rounded-2xl hover:bg-[#1C1CC9] transition">
          {showNew ? '취소' : '＋ 새 고지'}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createMonth} className="mb-4 bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">청구 월 *</label>
            <input value={newYM} onChange={e => setNewYM(e.target.value)} placeholder="2026-06" maxLength={7}
              className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">라벨 (선택)</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="예: 6월 관리비"
                className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" />
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">납부 기한</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-2xl text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition">
            {submitting ? '생성 중…' : '고지 작성 시작'}
          </button>
        </form>
      )}

      {loading ? <p className="text-center text-[15px] text-[#9CA3AF] mt-10">불러오는 중…</p>
        : months.length === 0 ? (
          <div className="bg-white border border-[#F0F2F5] rounded-2xl p-8 text-center mt-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="bills" size={26} color="#2B2BEE" filled /></div>
            <p className="text-[16px] font-bold text-[#0F2242]">등록된 관리비 고지가 없습니다</p>
            <p className="text-[14px] text-[#9CA3AF] mt-1">＋ 새 고지로 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {months.map(m => {
              const mode = modeOf(m);
              const total = totalOf(m);
              const perUnit = perUnitOf(m);
              const monthPayments = payments.filter(p => p.bill_month_id === m.id);
              const paidCount = monthPayments.filter(p => p.is_paid).length;
              const payRate = units.length > 0 ? Math.round((paidCount / units.length) * 100) : 0;
              const isAddingItem = editingItemMonth === m.id;
              const isExpanded = expandedMonth === m.id;
              const editable = m.status === 'draft';

              return (
                <div key={m.id} className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-[18px] font-extrabold text-[#0F2242]">{m.label ?? m.year_month}</h3>
                    <span className="text-[14px] text-[#9CA3AF]">({m.year_month})</span>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status]}`}>{STATUS_LABEL[m.status] ?? m.status}</span>
                  </div>
                  {m.due_date && <p className="text-[13px] text-[#6B7280] mb-2">납부 기한: {new Date(m.due_date).toLocaleDateString('ko-KR')}</p>}

                  {/* 청구 방식 토글 — 작성중일 때만 */}
                  {editable && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => setBillingMode(m.id, 'equal')}
                        className={`text-left rounded-2xl p-3 border-[1.5px] transition ${mode === 'equal' ? 'border-[#2B2BEE] bg-[#E9E9FD]' : 'border-[#E8EBF0] bg-white'}`}
                      >
                        <p className={`text-[14px] font-extrabold ${mode === 'equal' ? 'text-[#2B2BEE]' : 'text-[#6B7280]'}`}>일괄 고지</p>
                        <p className={`text-[11px] mt-1 leading-tight ${mode === 'equal' ? 'text-[#2B2BEE]/80' : 'text-[#9CA3AF]'}`}>항목 입력 → 세대수로 균등 분배</p>
                      </button>
                      <button
                        onClick={() => setBillingMode(m.id, 'per_unit')}
                        className={`text-left rounded-2xl p-3 border-[1.5px] transition ${mode === 'per_unit' ? 'border-[#2B2BEE] bg-[#E9E9FD]' : 'border-[#E8EBF0] bg-white'}`}
                      >
                        <p className={`text-[14px] font-extrabold ${mode === 'per_unit' ? 'text-[#2B2BEE]' : 'text-[#6B7280]'}`}>세대별 차등고지</p>
                        <p className={`text-[11px] mt-1 leading-tight ${mode === 'per_unit' ? 'text-[#2B2BEE]/80' : 'text-[#9CA3AF]'}`}>호실마다 다른 금액 직접 입력</p>
                      </button>
                    </div>
                  )}

                  {/* 고지완료 요약 카드 */}
                  {m.status !== 'draft' && (
                    <div className="bg-[#E9E9FD] rounded-2xl p-3 mb-3 border border-[#2B2BEE]/15">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-[28px] font-black text-[#2B2BEE]">완납률 {payRate}%</p>
                          <p className="text-[13px] text-[#6B7280] mt-0.5">{paidCount} / {units.length}세대 납부</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[20px] font-extrabold text-[#0F2242]">₩{fmt(total)}</p>
                          <p className="text-[12px] text-[#6B7280] mt-0.5">{mode === 'per_unit' ? '세대별 차등' : `세대당 ₩${fmt(perUnit)}`}</p>
                        </div>
                      </div>
                      {m.status === 'published' && (
                        <>
                          <button onClick={() => sendBillNotice(m)} className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-2xl text-[14px] font-bold hover:bg-[#1C1CC9] transition mb-2">
                            관리비 고지 발송 ({units.length}세대)
                          </button>
                          <button onClick={() => setExpandedMonth(isExpanded ? null : m.id)} className="w-full bg-white border border-[#E8EBF0] text-[#2B2BEE] py-2.5 rounded-2xl text-[14px] font-bold">
                            {isExpanded ? '세대별 납부 닫기' : '세대별 납부 상세보기'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* 세대별 납부 현황 (published + expanded) */}
                  {m.status === 'published' && isExpanded && (
                    <div className="bg-[#F5F6FA] rounded-2xl p-3 mb-3 space-y-1.5 max-h-80 overflow-y-auto">
                      <p className="text-[13px] font-bold text-[#6B7280] mb-2">세대별 납부 현황</p>
                      {units.map(u => {
                        const res = residents.find(r => r.unit_id === u.id);
                        const pay = paidForUnit(m.id, u.id);
                        const isPaid = pay?.is_paid;
                        return (
                          <div key={u.id} className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-[#E8EBF0]">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-[#E8F8EC] text-[#2ECC71]' : 'bg-[#FEE8E7] text-[#FF3B30]'}`}>
                                {isPaid ? '납부' : '미납'}
                              </span>
                              <span className="text-[14px] font-bold text-[#0F2242]">{u.ho_number}</span>
                              {res && <span className="text-[13px] text-[#6B7280]">{res.name}</span>}
                              <span className="text-[12px] text-[#9CA3AF]">₩{fmt(amountForUnit(m, u.ho_number))}</span>
                            </div>
                            {pay && (
                              <button
                                onClick={() => togglePaid(pay, !isPaid)}
                                className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${isPaid ? 'bg-[#F5F6FA] text-[#6B7280]' : 'bg-[#2ECC71] text-white'}`}
                              >
                                {isPaid ? '미납으로' : '납부 확인'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ───────── 일괄 고지 (equal): 항목 입력 ───────── */}
                  {mode === 'equal' && (
                    <>
                      <div className="flex items-center justify-between mb-2 mt-1">
                        <p className="text-[13px] font-bold text-[#6B7280]">관리비 항목</p>
                        {editable && m.bill_items.length === 0 && (
                          <button onClick={() => copyPrevious(m)} className="text-[12px] font-bold text-[#2B2BEE] bg-[#E9E9FD] px-2.5 py-1 rounded-full">
                            ↻ 전월 항목 복사
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {m.bill_items.length === 0 ? (
                          <p className="text-[14px] text-[#9CA3AF] py-2">아직 항목이 없습니다</p>
                        ) : (
                          m.bill_items.map(it => (
                            <div key={it.id} className="flex justify-between items-center py-1.5 border-b border-[#F0F2F5]">
                              <span className="text-[15px] text-[#0F2242]">{it.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-[#0F2242]">₩{fmt(it.amount)}</span>
                                {editable && (
                                  <button onClick={() => removeItem(it.id)} className="text-[14px] text-[#FF3B30] font-bold">×</button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between pt-2 mt-1">
                          <span className="text-[14px] font-bold text-[#0F2242]">합계</span>
                          <span className="text-[18px] font-black text-[#2B2BEE]">₩{fmt(total)}</span>
                        </div>
                      </div>

                      {editable && (
                        <div className="mt-3 pt-3 border-t border-[#E8EBF0]">
                          {isAddingItem ? (
                            <form onSubmit={e => addItem(m.id, e)} className="flex gap-2">
                              <select value={itemName} onChange={e => setItemName(e.target.value)}
                                className="flex-1 bg-white border border-[#E8EBF0] rounded-2xl px-2.5 py-2 text-[15px] outline-none focus:border-[#2B2BEE]">
                                <option value="">항목 선택</option>
                                {BILL_ITEM_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <input type="number" value={itemAmount} onChange={e => setItemAmount(e.target.value)} placeholder="금액" min={1}
                                className="w-24 bg-white border border-[#E8EBF0] rounded-2xl px-2.5 py-2 text-[15px] outline-none focus:border-[#2B2BEE]" />
                              <button type="submit" className="bg-[#2B2BEE] text-white px-3 py-2 rounded-2xl text-[14px] font-bold">＋</button>
                              <button type="button" onClick={() => { setEditingItemMonth(null); setItemName(''); setItemAmount(''); }} className="px-2 text-[#6B7280] text-[14px]">취소</button>
                            </form>
                          ) : (
                            <button onClick={() => setEditingItemMonth(m.id)} className="text-[14px] text-[#2B2BEE] font-bold">＋ 항목 추가</button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ───────── 세대별 차등고지 (per_unit): 호실별 입력 ───────── */}
                  {mode === 'per_unit' && (
                    <>
                      {editable && (
                        <div className="flex gap-2 mb-3">
                          <input value={bulkAmount} onChange={e => setBulkAmount(e.target.value)} inputMode="numeric" placeholder="모든 세대 일괄 적용 (₩)"
                            className="flex-1 bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" />
                          <button onClick={() => applyBulk(m)} className="bg-[#2B2BEE] text-white px-4 rounded-2xl text-[14px] font-bold hover:bg-[#1C1CC9] transition">적용</button>
                        </div>
                      )}
                      <p className="text-[13px] font-bold text-[#6B7280] mb-2">세대별 금액</p>
                      <div className="space-y-1.5">
                        {units.map(u => {
                          const res = residents.find(r => r.unit_id === u.id);
                          const val = unitDraft[m.id]?.[u.ho_number] ?? '';
                          return (
                            <div key={u.id} className="flex items-center gap-2 bg-white rounded-2xl p-2.5 border border-[#E8EBF0]">
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-extrabold text-[#0F2242]">{u.ho_number}</p>
                                <p className="text-[11px] text-[#9CA3AF]">{res?.name ?? '미등록'}</p>
                              </div>
                              {editable ? (
                                <>
                                  <input
                                    value={val}
                                    inputMode="numeric"
                                    placeholder="0"
                                    onChange={e => setUnitDraft(d => ({ ...d, [m.id]: { ...d[m.id], [u.ho_number]: e.target.value } }))}
                                    onBlur={e => persistUnitAmount(m, u.ho_number, e.target.value)}
                                    className="w-28 text-right bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2 text-[15px] outline-none focus:border-[#2B2BEE]"
                                  />
                                  <span className="text-[13px] text-[#6B7280]">원</span>
                                </>
                              ) : (
                                <span className="text-[15px] font-bold text-[#0F2242]">₩{fmt(amountForUnit(m, u.ho_number))}</span>
                              )}
                            </div>
                          );
                        })}
                        <div className="flex justify-between pt-2 mt-1">
                          <span className="text-[14px] font-bold text-[#0F2242]">합계</span>
                          <span className="text-[18px] font-black text-[#2B2BEE]">₩{fmt(total)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 상태 전환 버튼 */}
                  {m.status === 'draft' && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => changeStatus(m, 'published')} className="flex-1 bg-[#2B2BEE] text-white py-2.5 rounded-2xl text-[14px] font-bold hover:bg-[#1C1CC9] transition">고지 발송</button>
                      <button onClick={() => removeMonth(m.id)} className="px-3 bg-white border border-[#FF3B30]/30 text-[#FF3B30] py-2.5 rounded-2xl text-[14px] font-bold">삭제</button>
                    </div>
                  )}
                  {m.status === 'published' && (
                    <button onClick={() => changeStatus(m, 'closed')} className="w-full mt-3 bg-white border border-[#E8EBF0] text-[#6B7280] py-2.5 rounded-2xl text-[14px] font-bold">마감 처리</button>
                  )}
                  {m.status === 'closed' && (
                    <p className="text-[13px] text-[#9CA3AF] mt-3 text-center">이 회차는 마감되었습니다</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
