'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';
import { BANK_NAMES, getBankCode } from '@villatolk/shared';

type Villa = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number | null;
  account_bank: string | null;
  account_number: string | null;
  account_holder: string | null;
  expose_admin_contact: boolean | null;
  special_notes: string | null;
  status: string;
};

type Status = {
  current_label: string | null;
  current_total_amount: number;
  current_paid_count: number;
  current_pay_rate: number;
  current_bm_id: string | null;
  active_residents: number;
  bill_months: number;
  notices: number;
  messages_unread: number;
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminVillaDetailPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [villa, setVilla] = useState<Villa | null>(null);
  const [status, setStatus] = useState<Status>({
    current_label: null, current_total_amount: 0, current_paid_count: 0, current_pay_rate: 0, current_bm_id: null,
    active_residents: 0, bill_months: 0, notices: 0, messages_unread: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [editingBasic, setEditingBasic] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingBasic, setSavingBasic] = useState(false);

  const [editingAccount, setEditingAccount] = useState(false);
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // 공개 설정 (관리자 연락처 노출 + 특이사항)
  const [editingExpose, setEditingExpose] = useState(false);
  const [exposeContact, setExposeContact] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingExpose, setSavingExpose] = useState(false);

  useEffect(() => { if (villaId) load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const thisYM = new Date().toISOString().slice(0, 7);

    const [
      { data: v, error: vErr },
      { count: activeRes },
      { count: billCount },
      { count: noticeCount },
      { count: msgUnread },
      { data: currentBM },
    ] = await Promise.all([
      supabase.from('villas').select('id, name, address, total_units, units_per_floor, account_bank, account_number, account_holder, expose_admin_contact, special_notes, status').eq('id', villaId).maybeSingle(),
      supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true })
        .eq('units.villa_id', villaId).eq('status', 'active'),
      supabase.from('bill_months').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
      supabase.from('notices').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('villa_id', villaId).eq('is_read', false),
      supabase.from('bill_months').select('id, label, year_month, bill_items(amount)')
        .eq('villa_id', villaId).eq('year_month', thisYM).eq('status', 'published').maybeSingle(),
    ]);

    if (vErr) setError(vErr.message);
    const villaRow = v as Villa | null;
    setVilla(villaRow);

    // 이번달 청구 합계 + 납부율
    const bm = currentBM as { id: string; label: string | null; year_month: string; bill_items: { amount: number }[] } | null;
    let currentTotal = 0, paidCount = 0, payRate = 0, label: string | null = null, bmId: string | null = null;
    if (bm && villaRow?.total_units) {
      currentTotal = (bm.bill_items ?? []).reduce((s, i) => s + i.amount, 0);
      label = bm.label ?? `${bm.year_month} 관리비`;
      bmId = bm.id;
      const { count: paid } = await supabase.from('payments').select('*', { count: 'exact', head: true })
        .eq('bill_month_id', bm.id).eq('is_paid', true);
      paidCount = paid ?? 0;
      payRate = Math.round((paidCount / villaRow.total_units) * 100);
    }

    setStatus({
      current_label: label,
      current_total_amount: currentTotal,
      current_paid_count: paidCount,
      current_pay_rate: payRate,
      current_bm_id: bmId,
      active_residents: activeRes ?? 0,
      bill_months: billCount ?? 0,
      notices: noticeCount ?? 0,
      messages_unread: msgUnread ?? 0,
    });
    setLoading(false);
  }

  function startEdit() {
    if (!villa) return;
    setBank(villa.account_bank ?? '');
    setNumber(villa.account_number ?? '');
    setHolder(villa.account_holder ?? '');
    setEditingAccount(true);
  }
  function startEditBasic() {
    if (!villa) return;
    setEditName(villa.name); setEditAddress(villa.address); setEditingBasic(true);
  }
  async function saveBasic() {
    if (!villa) return;
    if (!editName.trim() || !editAddress.trim()) { alert('이름과 주소는 비울 수 없습니다'); return; }
    setSavingBasic(true);
    const { error: upErr } = await supabase.from('villas').update({ name: editName.trim(), address: editAddress.trim() }).eq('id', villa.id);
    setSavingBasic(false);
    if (upErr) { alert('저장 실패: ' + upErr.message); return; }
    setEditingBasic(false); await load();
  }
  async function saveAccount() {
    if (!villa) return;
    setSavingAccount(true);
    const { error: upErr } = await supabase.from('villas').update({
      account_bank: bank.trim() || null,
      account_bank_code: bank.trim() ? getBankCode(bank.trim()) : null,
      account_number: number.trim() || null,
      account_holder: holder.trim() || null,
    }).eq('id', villa.id);
    setSavingAccount(false);
    if (upErr) { alert('저장 실패: ' + upErr.message); return; }
    setEditingAccount(false); await load();
  }
  function startEditExpose() {
    if (!villa) return;
    setExposeContact(!!villa.expose_admin_contact);
    setNotes(villa.special_notes ?? '');
    setEditingExpose(true);
  }
  async function saveExpose() {
    if (!villa) return;
    setSavingExpose(true);
    const { error: upErr } = await supabase.from('villas').update({
      expose_admin_contact: exposeContact,
      special_notes: notes.trim() || null,
    }).eq('id', villa.id);
    setSavingExpose(false);
    if (upErr) { alert('저장 실패: ' + upErr.message); return; }
    setEditingExpose(false); await load();
  }

  if (loading) return <div className="px-5 pt-6 text-center text-[16px] text-[#9CA3AF]">불러오는 중…</div>;
  if (error) return <div className="px-5 pt-6 text-center text-[16px] text-[#FF3B30]">오류: {error}</div>;
  if (!villa) return <div className="px-5 pt-6 text-center text-[16px] text-[#9CA3AF]">빌라를 찾을 수 없습니다</div>;

  const unpaidCount = villa.total_units - status.current_paid_count;
  const hasAlerts = status.current_bm_id && unpaidCount > 0 || status.messages_unread > 0;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      {/* 이름/주소 + 편집 */}
      <div className="mt-3 mb-5">
        {editingBasic ? (
          <div className="bg-white border border-[#2B2BEE] border-[1.5px] rounded-xl p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">빌라 이름</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={50}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#2B2BEE]" />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">주소</label>
              <input value={editAddress} onChange={e => setEditAddress(e.target.value)} maxLength={200}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#2B2BEE]" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveBasic} disabled={savingBasic} className="flex-1 bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
                {savingBasic ? '저장 중…' : '저장'}
              </button>
              <button onClick={() => setEditingBasic(false)} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-xl text-[16px] font-bold">취소</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-black text-[#0F2242]">{villa.name}</h1>
            </div>
            <button onClick={startEditBasic} className="text-[15px] text-[#2B2BEE] font-bold ml-3 flex-shrink-0 mt-1">✏️ 편집</button>
          </div>
        )}
      </div>

      {/* 이번달 관리 현황 (큰 카드 — QA 페이지 2) */}
      <p className="text-[14px] text-[#6B7280] font-bold tracking-widest mb-2">이번달 관리 현황</p>
      {status.current_bm_id ? (
        <div className="bg-gradient-to-br from-[#E9E9FD] to-[#F8FAFF] border border-[#2B2BEE]/20 rounded-xl p-4 shadow-sm">
          <div className="flex items-end justify-between mb-1">
            <p className="text-[15px] text-[#6B7280] font-bold">{status.current_label}</p>
            {unpaidCount > 0 && (
              <span className="bg-[#FEE8E7] text-[#FF3B30] text-[13px] font-bold px-2 py-0.5 rounded-full">{unpaidCount}세대 미납</span>
            )}
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className={`text-[38px] font-black ${status.current_pay_rate >= 80 ? 'text-[#2ECC71]' : 'text-[#2B2BEE]'}`}>
                {status.current_pay_rate}%
              </p>
              <p className="text-[13px] text-[#6B7280] mt-0.5">납부율 · {status.current_paid_count}/{villa.total_units}</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-extrabold text-[#0F2242]">₩{fmt(status.current_total_amount)}</p>
              <p className="text-[13px] text-[#6B7280] mt-0.5">총 청구액</p>
            </div>
          </div>
          {unpaidCount > 0 && (
            <button
              onClick={() => alert('미납세대 독촉 발송 기능 준비중\n다음 업데이트에서 카카오 알림톡 또는 푸시 알림으로 자동 발송됩니다.')}
              className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[15px] font-bold mb-2 hover:bg-[#1C1CC9] transition"
            >
              📢 미납세대 독촉 보내기
            </button>
          )}
          <Link href={`/admin/villas/${villa.id}/bills`} className="block w-full bg-white border border-[#E8EBF0] text-[#2B2BEE] py-2.5 rounded-xl text-[15px] font-bold text-center">
            세대별 납부 현황 상세 →
          </Link>
        </div>
      ) : (
        <div className="bg-[#F5F6FA] border border-dashed border-[#E8EBF0] rounded-xl p-5 text-center">
          <p className="text-[16px] font-bold text-[#0F2242] mb-1">이번 달 관리비 미발행</p>
          <p className="text-[14px] text-[#9CA3AF] mb-3">관리비 메뉴에서 고지 작성 → 청구 시작</p>
          <Link href={`/admin/villas/${villa.id}/bills`} className="block w-full bg-[#2B2BEE] text-white py-3 rounded-xl text-[15px] font-bold hover:bg-[#1C1CC9] transition">
            관리비 발행
          </Link>
        </div>
      )}

      {/* 중요 알림 — 메시지 미답변 */}
      {status.messages_unread > 0 && (
        <div className="mt-3">
          <p className="text-[14px] text-[#6B7280] font-bold tracking-widest mb-2">중요 알림</p>
          <Link href={`/admin/villas/${villa.id}/messages`} className="block bg-white border border-[#FF3B30]/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-[#FF3B30]">민원 메시지 대기 중</p>
                <p className="text-[24px] font-extrabold text-[#FF3B30] mt-0.5">{status.messages_unread}건</p>
              </div>
              <button className="bg-[#2B2BEE] text-white px-4 py-2.5 rounded-xl text-[15px] font-bold">바로 확인</button>
            </div>
          </Link>
        </div>
      )}

      {/* 관리 메뉴 */}
      <h2 className="text-[14px] font-bold text-[#6B7280] tracking-widest mt-6 mb-2">관리 메뉴</h2>
      <div className="space-y-2">
        <SubMenu href={`/admin/villas/${villa.id}/bills`} icon="bills" label="관리비" hint={`${status.bill_months}회차 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/notices`} icon="notice" label="공지사항" hint={`${status.notices}건 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/residents`} icon="residents" label="입주민" hint={`활성 ${status.active_residents}명`} />
        <SubMenu href={`/admin/villas/${villa.id}/parking`} icon="parking" label="주차" hint="등록 차량 관리" />
        <SubMenu href={`/admin/villas/${villa.id}/messages`} icon="message" label="메시지" hint={`미읽음 ${status.messages_unread}건`} />
      </div>

      {/* 입금 계좌 — 제일 하단 (QA 페이지 2) */}
      <div className="flex items-center justify-between mt-6 mb-2">
        <h2 className="text-[14px] font-bold text-[#6B7280] tracking-widest">관리비 입금 계좌</h2>
        {!editingAccount && (
          <button onClick={startEdit} className="text-[14px] text-[#2B2BEE] font-bold">
            {(villa.account_bank || villa.account_number) ? '수정' : '＋ 추가'}
          </button>
        )}
      </div>
      {editingAccount ? (
        <div className="bg-white border border-[#2B2BEE] border-[1.5px] rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">은행</label>
              <select value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#2B2BEE]">
                <option value="">은행 선택</option>
                {BANK_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">예금주</label>
              <input value={holder} onChange={e => setHolder(e.target.value)} maxLength={30} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#2B2BEE]" />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">계좌번호</label>
            <input value={number} onChange={e => setNumber(e.target.value)} maxLength={30} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#2B2BEE]" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveAccount} disabled={savingAccount} className="flex-1 bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
              {savingAccount ? '저장 중…' : '저장'}
            </button>
            <button onClick={() => setEditingAccount(false)} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-xl text-[16px] font-bold">취소</button>
          </div>
        </div>
      ) : (villa.account_bank || villa.account_number) ? (
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm">
          <p className="text-[17px] font-bold text-[#0F2242]">{villa.account_bank} {villa.account_number}</p>
          {villa.account_holder && <p className="text-[14px] text-[#6B7280] mt-1">예금주: {villa.account_holder}</p>}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E8EBF0] rounded-xl p-4 text-center">
          <p className="text-[15px] text-[#9CA3AF]">아직 입금 계좌가 등록되지 않았습니다</p>
        </div>
      )}

      {/* 입주민 공개 설정 */}
      <div className="flex items-center justify-between mt-6 mb-2">
        <h2 className="text-[14px] font-bold text-[#6B7280] tracking-widest">입주민 공개 설정</h2>
        {!editingExpose && (
          <button onClick={startEditExpose} className="text-[14px] text-[#2B2BEE] font-bold">수정</button>
        )}
      </div>
      {editingExpose ? (
        <div className="bg-white border-[1.5px] border-[#2B2BEE] rounded-xl p-4 shadow-sm space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={exposeContact} onChange={e => setExposeContact(e.target.checked)} className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[#2B2BEE]" />
            <span>
              <span className="block text-[15px] font-bold text-[#0F2242]">관리자 성함·전화번호 노출</span>
              <span className="block text-[13px] text-[#6B7280] mt-0.5">켜면 입주민 앱에 관리자 연락처가 표시됩니다.</span>
            </span>
          </label>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">특이사항 (입주민에게 항시 표시)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={300}
              placeholder="예: 분리수거는 매주 화·금요일 / 방문차량 사전 등록 필수"
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE] resize-none" />
            <p className="text-[12px] text-[#9CA3AF] mt-1">{notes.length}/300</p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveExpose} disabled={savingExpose} className="flex-1 bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
              {savingExpose ? '저장 중…' : '저장'}
            </button>
            <button onClick={() => setEditingExpose(false)} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-xl text-[16px] font-bold">취소</button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-[#0F2242]">관리자 연락처 노출</span>
            <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${villa.expose_admin_contact ? 'bg-[#E9E9FD] text-[#2B2BEE]' : 'bg-[#F5F6FA] text-[#9CA3AF]'}`}>
              {villa.expose_admin_contact ? '공개' : '비공개'}
            </span>
          </div>
          <div className="pt-2.5 border-t border-[#F0F2F5]">
            <p className="text-[13px] font-bold text-[#6B7280] mb-1">특이사항</p>
            {villa.special_notes
              ? <p className="text-[14px] text-[#0F2242] leading-relaxed whitespace-pre-wrap">{villa.special_notes}</p>
              : <p className="text-[14px] text-[#9CA3AF]">등록된 특이사항이 없습니다</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function SubMenu({ href, icon, label, hint }: { href: string; icon: IconName; label: string; hint: string }) {
  return (
    <Link href={href} className="flex items-center bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm active:scale-[0.99] transition">
      <span className="mr-3 flex-shrink-0 w-10 h-10 rounded-xl bg-[#E9E9FD] flex items-center justify-center">
        <Icon name={icon} size={22} color="#2B2BEE" filled />
      </span>
      <div className="flex-1">
        <p className="text-[17px] font-extrabold text-[#0F2242]">{label}</p>
        <p className="text-[14px] text-[#6B7280] mt-0.5">{hint}</p>
      </div>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </Link>
  );
}
