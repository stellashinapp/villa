'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type BillItem = { id: string; name: string; amount: number };
type Unit = { id: string; ho_number: string };
type Resident = { id: string; name: string; unit_id: string };
type Payment = { id: string; bill_month_id: string; unit_id: string; is_paid: boolean; method: string | null; paid_at: string | null };

type BillMonth = {
  id: string;
  year_month: string;
  label: string | null;
  due_date: string | null;
  status: string;
  billing_mode: string | null;
  created_at: string;
  bill_items: BillItem[];
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-[#F5F6FA] text-[#6B7280]',
  published: 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]',
  closed: 'bg-[rgba(155,89,182,0.12)] text-[#8E44AD]',
};
const STATUS_LABEL: Record<string, string> = { draft: '작성중', published: '청구중', closed: '마감' };

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
  const [editingItemMonth, setEditingItemMonth] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => { if (villaId) load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const [{ data: bms }, { data: us }, { data: rs }] = await Promise.all([
      supabase.from('bill_months')
        .select('id, year_month, label, due_date, status, billing_mode, created_at, bill_items(id, name, amount)')
        .eq('villa_id', villaId).order('year_month', { ascending: false }),
      supabase.from('units').select('id, ho_number').eq('villa_id', villaId).order('ho_number'),
      supabase.from('residents').select('id, name, unit_id, units!inner(villa_id)')
        .eq('units.villa_id', villaId).eq('status', 'active'),
    ]);
    setMonths((bms ?? []) as unknown as BillMonth[]);
    setUnits((us ?? []) as Unit[]);
    setResidents(((rs ?? []) as unknown as Resident[]).map(r => ({ id: r.id, name: r.name, unit_id: r.unit_id })));

    const bmIds = ((bms ?? []) as { id: string }[]).map(b => b.id);
    if (bmIds.length > 0) {
      const { data: ps } = await supabase.from('payments').select('*').in('bill_month_id', bmIds);
      setPayments((ps ?? []) as Payment[]);
    } else {
      setPayments([]);
    }
    setLoading(false);
  }

  async function createMonth(e: React.FormEvent) {
    e.preventDefault();
    if (!newYM.match(/^\d{4}-\d{2}$/)) { alert('YYYY-MM 형식으로 입력해주세요 (예: 2026-05)'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('bill_months').insert({
      villa_id: villaId, year_month: newYM,
      label: newLabel.trim() || `${newYM.split('-')[1]}월 관리비`,
      due_date: newDue || null, status: 'draft', billing_mode: 'equal',
    });
    setSubmitting(false);
    if (error) {
      if (error.message.toLowerCase().includes('duplicate') || error.code === '23505') {
        alert(`${newYM} 회차가 이미 존재합니다.\n\n같은 월을 두 번 만들 수 없습니다. 기존 회차에 항목을 추가하거나, 기존 회차를 삭제 후 다시 만드세요.`);
      } else {
        alert('생성 실패: ' + error.message);
      }
      return;
    }
    setNewYM(''); setNewLabel(''); setNewDue(''); setShowNew(false);
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

  async function changeStatus(monthId: string, status: string) {
    const labels: Record<string, string> = { published: '청구', closed: '마감', draft: '작성중' };
    if (!confirm(`상태를 '${labels[status]}' 로 변경할까요?`)) return;
    await supabase.from('bill_months').update({ status }).eq('id', monthId);
    if (status === 'published') {
      // 청구 시작 시 모든 호실에 payments 빈 record 생성 (없으면)
      const month = months.find(m => m.id === monthId);
      if (month) {
        const total = month.bill_items.reduce((s, i) => s + i.amount, 0);
        const perUnit = units.length > 0 ? Math.round(total / units.length) : 0;
        const existing = payments.filter(p => p.bill_month_id === monthId).map(p => p.unit_id);
        const toInsert = units.filter(u => !existing.includes(u.id)).map(u => ({
          bill_month_id: monthId, unit_id: u.id, amount: perUnit, is_paid: false,
        }));
        if (toInsert.length > 0) {
          await supabase.from('payments').insert(toInsert);
        }
      }
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

  function sendBillNotice(monthId: string) {
    const month = months.find(m => m.id === monthId);
    if (!month) return;
    const total = month.bill_items.reduce((s, i) => s + i.amount, 0);
    const perUnit = units.length > 0 ? Math.round(total / units.length) : 0;
    alert(`📢 관리비 고지 발송 시뮬레이션\n\n${month.label ?? month.year_month}\n총 금액: ₩${fmt(total)}\n세대당: ₩${fmt(perUnit)}\n대상: ${units.length}세대\n\n실 발송은 카카오 알림톡 셋업 후 자동 발송됩니다.\n(다음 업데이트)`);
  }

  function paidForUnit(monthId: string, unitId: string): Payment | undefined {
    return payments.find(p => p.bill_month_id === monthId && p.unit_id === unitId);
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href={`/admin/villas/${villaId}`} className="text-[15px] text-[#6B7280]">← 빌라 상세</Link>
      <div className="flex justify-between items-end mt-3 mb-5">
        <div>
          <h1 className="text-[26px] font-black text-[#0F2242]">관리비</h1>
          <p className="text-[16px] text-[#6B7280] mt-0.5">총 {months.length}회차</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="bg-[#4263E8] text-white text-[16px] font-bold px-3.5 py-2.5 rounded-lg">
          {showNew ? '취소' : '＋ 회차 추가'}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createMonth} className="mb-4 bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">청구 월 *</label>
            <input value={newYM} onChange={e => setNewYM(e.target.value)} placeholder="2026-06" maxLength={7}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-[16px] outline-none focus:border-[#4263E8]" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">라벨 (선택)</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="예: 6월 관리비"
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-[16px] outline-none focus:border-[#4263E8]" />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">납부 기한</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-[16px] outline-none focus:border-[#4263E8]" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#4263E8] text-white py-2.5 rounded-lg text-[16px] font-bold disabled:opacity-50">
            {submitting ? '생성 중…' : '회차 생성 (작성중)'}
          </button>
        </form>
      )}

      {loading ? <p className="text-center text-[16px] text-[#9CA3AF] mt-10">불러오는 중…</p>
        : months.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[18px] font-bold text-[#0F2242]">등록된 회차가 없습니다</p>
            <p className="text-[15px] text-[#9CA3AF] mt-1">+ 회차 추가로 시작</p>
          </div>
        ) : (
          <div className="space-y-3">
            {months.map(m => {
              const total = m.bill_items.reduce((s, i) => s + i.amount, 0);
              const perUnit = units.length > 0 ? Math.round(total / units.length) : 0;
              const monthPayments = payments.filter(p => p.bill_month_id === m.id);
              const paidCount = monthPayments.filter(p => p.is_paid).length;
              const payRate = units.length > 0 ? Math.round((paidCount / units.length) * 100) : 0;
              const isAddingItem = editingItemMonth === m.id;
              const isExpanded = expandedMonth === m.id;

              return (
                <div key={m.id} className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-[19px] font-extrabold text-[#0F2242]">{m.label ?? m.year_month}</h3>
                    <span className="text-[15px] text-[#6B7280]">({m.year_month})</span>
                    <span className={`text-[13px] font-bold px-2 py-0.5 rounded ${STATUS_BADGE[m.status]}`}>{STATUS_LABEL[m.status] ?? m.status}</span>
                  </div>
                  {m.due_date && <p className="text-[15px] text-[#6B7280] mb-2">납부 기한: {new Date(m.due_date).toLocaleDateString('ko-KR')}</p>}

                  {/* published 상태 — 큰 카드 + 납부 현황 + 고지 발송 */}
                  {m.status === 'published' && (
                    <div className="bg-gradient-to-br from-[#EEF1FB] to-[#F8FAFF] rounded-xl p-3 mb-3 border border-[#4263E8]/15">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className={`text-[30px] font-black ${payRate >= 80 ? 'text-[#2ECC71]' : payRate >= 50 ? 'text-[#F39C12]' : 'text-[#E74C3C]'}`}>
                            완납률 {payRate}%
                          </p>
                          <p className="text-[14px] text-[#6B7280] mt-0.5">{paidCount} / {units.length}세대 납부</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[22px] font-extrabold text-[#0F2242]">₩{fmt(total)}</p>
                          <p className="text-[13px] text-[#6B7280] mt-0.5">세대당 ₩{fmt(perUnit)}</p>
                        </div>
                      </div>
                      <button onClick={() => sendBillNotice(m.id)} className="w-full bg-[#4263E8] text-white py-2.5 rounded-lg text-[15px] font-bold mb-2">
                        📢 관리비 고지 발송 ({units.length}세대)
                      </button>
                      <button onClick={() => setExpandedMonth(isExpanded ? null : m.id)} className="w-full bg-white border border-[#E8EBF0] text-[#4263E8] py-2.5 rounded-lg text-[15px] font-bold">
                        {isExpanded ? '세대별 납부 닫기' : '세대별 납부 상세보기'}
                      </button>
                    </div>
                  )}

                  {/* 세대별 납부 현황 — published 상태에서 expanded 시 */}
                  {m.status === 'published' && isExpanded && (
                    <div className="bg-[#F5F6FA] rounded-xl p-3 mb-3 space-y-1.5 max-h-80 overflow-y-auto">
                      <p className="text-[14px] font-bold text-[#6B7280] mb-2">세대별 납부 현황</p>
                      {units.map(u => {
                        const res = residents.find(r => r.unit_id === u.id);
                        const pay = paidForUnit(m.id, u.id);
                        const isPaid = pay?.is_paid;
                        return (
                          <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-[#E8EBF0]">
                            <div className="flex items-center gap-2">
                              <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded ${isPaid ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]' : 'bg-[rgba(231,76,60,0.12)] text-[#E74C3C]'}`}>
                                {isPaid ? '납부' : '미납'}
                              </span>
                              <span className="text-[15px] font-bold text-[#0F2242]">{u.ho_number}</span>
                              {res && <span className="text-[14px] text-[#6B7280]">{res.name}</span>}
                            </div>
                            <div className="flex gap-1">
                              {pay && (
                                <button
                                  onClick={() => togglePaid(pay, !isPaid)}
                                  className={`text-[13px] font-bold px-2.5 py-1 rounded ${isPaid ? 'bg-[#F5F6FA] text-[#6B7280]' : 'bg-[#2ECC71] text-white'}`}
                                >
                                  {isPaid ? '미납으로' : '납부 확인'}
                                </button>
                              )}
                              {!isPaid && (
                                <button
                                  onClick={() => alert(`${u.ho_number} ${res?.name ?? ''} 에게 납부 독촉 PUSH 발송\n(카카오 알림톡 셋업 후 자동 발송)`)}
                                  className="text-[13px] font-bold px-2.5 py-1 rounded bg-[#F39C12] text-white"
                                >
                                  Push
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 항목 목록 */}
                  <div className="space-y-1.5 mt-2">
                    {m.bill_items.length === 0 ? (
                      <p className="text-[15px] text-[#9CA3AF] py-2">아직 항목이 없습니다 — 아래에서 추가하세요</p>
                    ) : (
                      m.bill_items.map(it => (
                        <div key={it.id} className="flex justify-between items-center py-1.5 border-b border-[#F5F6FA]">
                          <span className="text-[16px] text-[#0F2242]">{it.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] font-bold text-[#0F2242]">₩{fmt(it.amount)}</span>
                            {m.status !== 'closed' && (
                              <button onClick={() => removeItem(it.id)} className="text-[14px] text-[#E74C3C] font-bold">×</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between pt-2 mt-1">
                      <span className="text-[15px] font-bold text-[#0F2242]">합계</span>
                      <span className="text-[19px] font-black text-[#4263E8]">₩{fmt(total)}</span>
                    </div>
                  </div>

                  {/* 항목 추가 (draft + published 둘 다 가능 — QA Page 3) */}
                  {m.status !== 'closed' && (
                    <div className="mt-3 pt-3 border-t border-[#E8EBF0]">
                      {isAddingItem ? (
                        <form onSubmit={e => addItem(m.id, e)} className="flex gap-2">
                          <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="항목명" maxLength={30}
                            className="flex-1 bg-white border border-[#E8EBF0] rounded-lg px-2.5 py-2 text-[16px] outline-none focus:border-[#4263E8]" />
                          <input type="number" value={itemAmount} onChange={e => setItemAmount(e.target.value)} placeholder="금액" min={1}
                            className="w-24 bg-white border border-[#E8EBF0] rounded-lg px-2.5 py-2 text-[16px] outline-none focus:border-[#4263E8]" />
                          <button type="submit" className="bg-[#4263E8] text-white px-3 py-2 rounded-lg text-[15px] font-bold">＋</button>
                          <button type="button" onClick={() => { setEditingItemMonth(null); setItemName(''); setItemAmount(''); }} className="px-2 text-[#6B7280] text-[15px]">취소</button>
                        </form>
                      ) : (
                        <button onClick={() => setEditingItemMonth(m.id)} className="text-[15px] text-[#4263E8] font-bold">＋ 항목 추가</button>
                      )}
                    </div>
                  )}

                  {/* draft — 상태 전환 */}
                  {m.status === 'draft' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => changeStatus(m.id, 'published')} className="flex-1 bg-[#2ECC71] text-white py-2.5 rounded-lg text-[15px] font-bold">청구 시작</button>
                      <button onClick={() => removeMonth(m.id)} className="px-3 bg-white border border-[#E74C3C]/30 text-[#E74C3C] py-2.5 rounded-lg text-[15px] font-bold">삭제</button>
                    </div>
                  )}
                  {m.status === 'published' && (
                    <button onClick={() => changeStatus(m.id, 'closed')} className="w-full mt-3 bg-[#8E44AD] text-white py-2.5 rounded-lg text-[15px] font-bold">마감 처리</button>
                  )}
                  {m.status === 'closed' && (
                    <p className="text-[14px] text-[#9CA3AF] mt-3 text-center">이 회차는 마감되었습니다</p>
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
