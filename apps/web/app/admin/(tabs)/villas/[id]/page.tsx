'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';

type Villa = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number | null;
  account_bank: string | null;
  account_number: string | null;
  account_holder: string | null;
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
      supabase.from('villas').select('id, name, address, total_units, units_per_floor, account_bank, account_number, account_holder, status').eq('id', villaId).maybeSingle(),
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
      account_number: number.trim() || null,
      account_holder: holder.trim() || null,
    }).eq('id', villa.id);
    setSavingAccount(false);
    if (upErr) { alert('저장 실패: ' + upErr.message); return; }
    setEditingAccount(false); await load();
  }

  if (loading) return <div className="px-5 pt-6 text-center text-[16px] text-[#9CA3AF]">불러오는 중…</div>;
  if (error) return <div className="px-5 pt-6 text-center text-[16px] text-[#E74C3C]">오류: {error}</div>;
  if (!villa) return <div className="px-5 pt-6 text-center text-[16px] text-[#9CA3AF]">빌라를 찾을 수 없습니다</div>;

  const unpaidCount = villa.total_units - status.current_paid_count;
  const hasAlerts = status.current_bm_id && unpaidCount > 0 || status.messages_unread > 0;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href="/admin/villas" className="text-[15px] text-[#6B7280] hover:text-[#0F2242]">← 빌라 목록</Link>

      {/* 이름/주소 + 편집 */}
      <div className="mt-3 mb-5">
        {editingBasic ? (
          <div className="bg-white border border-[#3766EE] border-[1.5px] rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">빌라 이름</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={50}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">주소</label>
              <input value={editAddress} onChange={e => setEditAddress(e.target.value)} maxLength={200}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveBasic} disabled={savingBasic} className="flex-1 bg-[#3766EE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
                {savingBasic ? '저장 중…' : '저장'}
              </button>
              <button onClick={() => setEditingBasic(false)} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-xl text-[16px] font-bold">취소</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-black text-[#0F2242]">{villa.name}</h1>
              <p className="text-[16px] text-[#6B7280] mt-0.5">{villa.address}</p>
            </div>
            <button onClick={startEditBasic} className="text-[15px] text-[#3766EE] font-bold ml-3 flex-shrink-0 mt-1">✏️ 편집</button>
          </div>
        )}
      </div>

      {/* 이번달 관리 현황 (큰 카드 — QA 페이지 2) */}
      <p className="text-[14px] text-[#6B7280] font-bold tracking-widest mb-2">이번달 관리 현황</p>
      {status.current_bm_id ? (
        <div className="bg-gradient-to-br from-[#EEF1FB] to-[#F8FAFF] border border-[#3766EE]/20 rounded-2xl p-4 shadow-sm">
          <div className="flex items-end justify-between mb-1">
            <p className="text-[15px] text-[#6B7280] font-bold">{status.current_label}</p>
            {unpaidCount > 0 && (
              <span className="bg-[rgba(231,76,60,0.12)] text-[#E74C3C] text-[13px] font-bold px-2 py-0.5 rounded">{unpaidCount}세대 미납</span>
            )}
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className={`text-[38px] font-black ${status.current_pay_rate >= 80 ? 'text-[#2ECC71]' : status.current_pay_rate >= 50 ? 'text-[#F39C12]' : 'text-[#E74C3C]'}`}>
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
              className="w-full bg-[#FF6B35] text-white py-2.5 rounded-xl text-[15px] font-bold mb-2"
            >
              📢 미납세대 독촉 보내기
            </button>
          )}
          <Link href={`/admin/villas/${villa.id}/bills`} className="block w-full bg-white border border-[#E8EBF0] text-[#3766EE] py-2.5 rounded-xl text-[15px] font-bold text-center">
            세대별 납부 현황 상세 →
          </Link>
        </div>
      ) : (
        <div className="bg-[#F5F6FA] border border-dashed border-[#E8EBF0] rounded-2xl p-5 text-center">
          <p className="text-[16px] font-bold text-[#0F2242] mb-1">이번 달 관리비 미발행</p>
          <p className="text-[14px] text-[#9CA3AF] mb-3">관리비 메뉴에서 회차 생성 + 항목 추가 → 청구 시작</p>
          <Link href={`/admin/villas/${villa.id}/bills`} className="inline-block bg-[#3766EE] text-white px-4 py-2 rounded-xl text-[15px] font-bold">
            관리비 메뉴로 →
          </Link>
        </div>
      )}

      {/* 중요 알림 — 메시지 미답변 */}
      {status.messages_unread > 0 && (
        <div className="mt-3">
          <p className="text-[14px] text-[#6B7280] font-bold tracking-widest mb-2">중요 알림</p>
          <Link href={`/admin/villas/${villa.id}/messages`} className="block bg-white border border-[#E74C3C]/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-bold text-[#E74C3C]">민원 메시지 대기 중</p>
                <p className="text-[24px] font-extrabold text-[#E74C3C] mt-0.5">{status.messages_unread}건</p>
              </div>
              <button className="bg-[#3766EE] text-white px-4 py-2.5 rounded-xl text-[15px] font-bold">바로 확인</button>
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
          <button onClick={startEdit} className="text-[14px] text-[#3766EE] font-bold">
            {(villa.account_bank || villa.account_number) ? '수정' : '＋ 추가'}
          </button>
        )}
      </div>
      {editingAccount ? (
        <div className="bg-white border border-[#3766EE] border-[1.5px] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">은행</label>
              <input value={bank} onChange={e => setBank(e.target.value)} maxLength={20} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" />
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">예금주</label>
              <input value={holder} onChange={e => setHolder(e.target.value)} maxLength={30} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" />
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">계좌번호</label>
            <input value={number} onChange={e => setNumber(e.target.value)} maxLength={30} className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveAccount} disabled={savingAccount} className="flex-1 bg-[#3766EE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
              {savingAccount ? '저장 중…' : '저장'}
            </button>
            <button onClick={() => setEditingAccount(false)} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-xl text-[16px] font-bold">취소</button>
          </div>
        </div>
      ) : (villa.account_bank || villa.account_number) ? (
        <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
          <p className="text-[17px] font-bold text-[#0F2242]">{villa.account_bank} {villa.account_number}</p>
          {villa.account_holder && <p className="text-[14px] text-[#6B7280] mt-1">예금주: {villa.account_holder}</p>}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E8EBF0] rounded-2xl p-4 text-center">
          <p className="text-[15px] text-[#9CA3AF]">아직 입금 계좌가 등록되지 않았습니다</p>
        </div>
      )}
    </div>
  );
}

function SubMenu({ href, icon, label, hint }: { href: string; icon: IconName; label: string; hint: string }) {
  return (
    <Link href={href} className="flex items-center bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm active:scale-[0.99] transition">
      <span className="mr-3 flex-shrink-0 w-10 h-10 rounded-xl bg-[#EEF1FB] flex items-center justify-center">
        <Icon name={icon} size={22} color="#3766EE" filled />
      </span>
      <div className="flex-1">
        <p className="text-[17px] font-extrabold text-[#0F2242]">{label}</p>
        <p className="text-[14px] text-[#6B7280] mt-0.5">{hint}</p>
      </div>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </Link>
  );
}
