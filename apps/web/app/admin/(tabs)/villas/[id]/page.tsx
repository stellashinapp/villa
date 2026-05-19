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

type Stats = {
  units: number;
  residents: number;
  bill_months: number;
  notices: number;
  messages_unread: number;
};

export default function AdminVillaDetailPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [villa, setVilla] = useState<Villa | null>(null);
  const [stats, setStats] = useState<Stats>({ units: 0, residents: 0, bill_months: 0, notices: 0, messages_unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 기본정보 편집
  const [editingBasic, setEditingBasic] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingBasic, setSavingBasic] = useState(false);

  // 계좌 편집 상태
  const [editingAccount, setEditingAccount] = useState(false);
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    if (!villaId) return;
    load();
  }, [villaId]);

  async function load() {
    setLoading(true);
    const [
      { data: v, error: vErr },
      { count: unitCount },
      { count: residentCount },
      { count: billCount },
      { count: noticeCount },
      { count: msgUnread },
    ] = await Promise.all([
      supabase.from('villas').select('id, name, address, total_units, units_per_floor, account_bank, account_number, account_holder, status').eq('id', villaId).maybeSingle(),
      supabase.from('units').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
      supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true }).eq('units.villa_id', villaId).eq('status', 'active'),
      supabase.from('bill_months').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
      supabase.from('notices').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('villa_id', villaId).eq('is_read', false),
    ]);

    if (vErr) setError(vErr.message);
    setVilla(v as Villa | null);
    setStats({
      units: unitCount ?? 0,
      residents: residentCount ?? 0,
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
    setEditName(villa.name);
    setEditAddress(villa.address);
    setEditingBasic(true);
  }

  async function saveBasic() {
    if (!villa) return;
    if (!editName.trim() || !editAddress.trim()) {
      alert('이름과 주소는 비울 수 없습니다');
      return;
    }
    setSavingBasic(true);
    const { error: upErr } = await supabase.from('villas').update({
      name: editName.trim(),
      address: editAddress.trim(),
    }).eq('id', villa.id);
    setSavingBasic(false);
    if (upErr) {
      alert('저장 실패: ' + upErr.message);
      return;
    }
    setEditingBasic(false);
    await load();
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
    if (upErr) {
      alert('저장 실패: ' + upErr.message);
      return;
    }
    setEditingAccount(false);
    await load();
  }

  if (loading) return <div className="px-5 pt-6 text-center text-sm text-[#9CA3AF]">불러오는 중…</div>;
  if (error) return <div className="px-5 pt-6 text-center text-sm text-[#E74C3C]">오류: {error}</div>;
  if (!villa) return <div className="px-5 pt-6 text-center text-sm text-[#9CA3AF]">빌라를 찾을 수 없습니다</div>;

  const hasAccount = villa.account_bank || villa.account_number;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href="/admin/villas" className="text-[12px] text-[#6B7280] hover:text-[#0F2242]">← 빌라 목록</Link>

      <div className="mt-3 mb-6">
        {editingBasic ? (
          <div className="bg-white border border-[#4263E8] border-[1.5px] rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">빌라 이름</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="빌라 이름"
                maxLength={50}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">주소</label>
              <input
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                placeholder="주소"
                maxLength={200}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveBasic} disabled={savingBasic} className="flex-1 bg-[#4263E8] text-white py-2.5 rounded-lg text-[14px] font-bold disabled:opacity-50">
                {savingBasic ? '저장 중…' : '저장'}
              </button>
              <button onClick={() => setEditingBasic(false)} disabled={savingBasic} className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-lg text-[14px] font-bold">
                취소
              </button>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">호실 추가·삭제는 입주민 메뉴에서 가능합니다</p>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-black text-[#0F2242]">{villa.name}</h1>
              <p className="text-[13px] text-[#6B7280] mt-0.5">{villa.address}</p>
            </div>
            <button
              onClick={startEditBasic}
              className="text-[12px] text-[#4263E8] font-bold hover:underline ml-3 flex-shrink-0 mt-1"
            >
              ✏️ 편집
            </button>
          </div>
        )}
      </div>

      {/* 요약 통계 4개 */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="총 호실" value={villa.total_units} accent="#0F2242" />
        <StatCard label="활성 입주민" value={stats.residents} accent="#4263E8" />
        <StatCard label="관리비 회차" value={stats.bill_months} accent="#2ECC71" />
        <StatCard label="미읽음 메시지" value={stats.messages_unread} accent={stats.messages_unread > 0 ? '#E74C3C' : '#9CA3AF'} />
      </div>

      {/* 입금 계좌 — 클릭 시 편집 */}
      <div className="flex items-center justify-between mt-6 mb-2.5">
        <h2 className="text-[13px] font-bold text-[#6B7280] tracking-wider">관리비 입금 계좌</h2>
        {!editingAccount && (
          <button
            onClick={startEdit}
            className="text-[12px] text-[#4263E8] font-bold hover:underline"
          >
            {hasAccount ? '수정' : '＋ 추가'}
          </button>
        )}
      </div>

      {editingAccount ? (
        <div className="bg-white border border-[#4263E8] border-[1.5px] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">은행</label>
              <input
                value={bank}
                onChange={e => setBank(e.target.value)}
                placeholder="예: 신한"
                maxLength={20}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">예금주</label>
              <input
                value={holder}
                onChange={e => setHolder(e.target.value)}
                placeholder="예: 홍길동"
                maxLength={30}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">계좌번호</label>
            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="예: 110-123-456789"
              maxLength={30}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveAccount}
              disabled={savingAccount}
              className="flex-1 bg-[#4263E8] text-white py-2.5 rounded-lg text-[14px] font-bold disabled:opacity-50"
            >
              {savingAccount ? '저장 중…' : '저장'}
            </button>
            <button
              onClick={() => setEditingAccount(false)}
              disabled={savingAccount}
              className="px-4 bg-[#F5F6FA] text-[#6B7280] py-2.5 rounded-lg text-[14px] font-bold"
            >
              취소
            </button>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            ⓘ 입주민이 관리비 납부 시 보이는 계좌입니다. 빈 칸은 비공개 처리됩니다.
          </p>
        </div>
      ) : hasAccount ? (
        <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
          <p className="text-[14px] font-bold text-[#0F2242]">
            {villa.account_bank} {villa.account_number}
          </p>
          {villa.account_holder && (
            <p className="text-[12px] text-[#6B7280] mt-1">예금주: {villa.account_holder}</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E8EBF0] rounded-2xl p-4 text-center">
          <p className="text-[13px] text-[#9CA3AF]">아직 입금 계좌가 등록되지 않았습니다</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">우측 상단 "+ 추가" 로 등록하세요</p>
        </div>
      )}

      {/* 서브 메뉴 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">관리 메뉴</h2>
      <div className="space-y-2">
        <SubMenu href={`/admin/villas/${villa.id}/bills`} icon="bills" label="관리비" hint={`${stats.bill_months}회차 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/notices`} icon="notice" label="공지사항" hint={`${stats.notices}건 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/residents`} icon="residents" label="입주민" hint={`활성 ${stats.residents}명`} />
        <SubMenu href={`/admin/villas/${villa.id}/parking`} icon="parking" label="주차" hint="등록 차량 관리" />
        <SubMenu href={`/admin/villas/${villa.id}/messages`} icon="message" label="메시지" hint={`미읽음 ${stats.messages_unread}건`} />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
      <p className="text-[24px] font-extrabold" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] text-[#6B7280] mt-1">{label}</p>
    </div>
  );
}

function SubMenu({ href, icon, label, hint }: { href: string; icon: IconName; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="flex items-center bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm active:scale-[0.99] transition"
    >
      <span className="mr-3 flex-shrink-0 w-9 h-9 rounded-xl bg-[#EEF1FB] flex items-center justify-center">
        <Icon name={icon} size={20} color="#4263E8" filled />
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-extrabold text-[#0F2242]">{label}</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">{hint}</p>
      </div>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </Link>
  );
}
