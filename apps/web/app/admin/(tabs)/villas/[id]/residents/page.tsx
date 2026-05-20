'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminTopBar from '@/components/AdminTopBar';
import Icon from '@/components/Icon';

type Unit = { id: string; ho_number: string };
type Resident = {
  id: string;
  unit_id: string | null;
  name: string;
  phone: string;
  status: string;
  is_owner: boolean | null;
  applied_at: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  units: { ho_number: string } | null;
};

type UnpaidBill = { label: string; amount: number };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: '거주중', color: 'bg-[#E9E9FD] text-[#2B2BEE]' },
  pending: { label: '승인대기', color: 'bg-[#E9E9FD] text-[#2B2BEE]' },
  pending_moveout: { label: '이사대기', color: 'bg-[#E9E9FD] text-[#2B2BEE]' },
  moved_out: { label: '이사완료', color: 'bg-[#F5F6FA] text-[#9CA3AF]' },
  rejected: { label: '거절됨', color: 'bg-[#FEE8E7] text-[#FF3B30]' },
};

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function AdminVillaResidentsPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [residents, setResidents] = useState<Resident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  // 입주 관리 / 이주 관리 1차 모드
  const [mode, setMode] = useState<'movein' | 'moveout'>('movein');

  // 직접 입주민 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'direct' | 'invite'>('invite');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addUnitId, setAddUnitId] = useState('');
  const [addIsOwner, setAddIsOwner] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState('');

  // 이주 확정 모달 (관리비 정산 확인)
  const [moveoutTarget, setMoveoutTarget] = useState<Resident | null>(null);
  const [unpaidBills, setUnpaidBills] = useState<UnpaidBill[] | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [moveoutProcessing, setMoveoutProcessing] = useState(false);

  function randToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addPhone.trim() || !addUnitId) {
      alert('이름, 휴대전화, 호실을 모두 입력하세요');
      return;
    }
    setAddSubmitting(true);

    if (addMode === 'direct') {
      const { error } = await supabase.from('residents').insert({
        unit_id: addUnitId,
        name: addName.trim(),
        phone: addPhone.replace(/\D/g, ''),
        status: 'active',
        is_owner: addIsOwner,
        applied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      });
      setAddSubmitting(false);
      if (error) { alert('추가 실패: ' + error.message); return; }
      const hoLabel = units.find(u => u.id === addUnitId)?.ho_number ?? '';
      alert(`✓ ${addName.trim()}님이 입주민으로 즉시 등록되었습니다 (${hoLabel}).\n\n해당 입주민은 지금 바로 입주민 앱에서\n이름 + 전화번호로 로그인할 수 있습니다.`);
      setAddName(''); setAddPhone(''); setAddUnitId(''); setAddIsOwner(false);
      setShowAdd(false);
      await load();
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminRow } = await supabase.from('admins').select('id').eq('auth_id', user?.id).maybeSingle();
      const adminId = (adminRow as { id: string } | null)?.id ?? null;
      const token = randToken();
      const { error } = await supabase.from('resident_invitations').insert({
        villa_id: villaId,
        unit_id: addUnitId,
        name: addName.trim(),
        phone: addPhone.replace(/\D/g, ''),
        token,
        is_owner: addIsOwner,
        invited_by: adminId,
      });
      setAddSubmitting(false);
      if (error) { alert('초대 발급 실패: ' + error.message); return; }
      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
      setInviteName(addName.trim());
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert('초대 링크 복사됨. 카카오톡·문자로 보내세요.');
    } catch {
      prompt('아래 링크를 복사하세요:', inviteUrl);
    }
  }

  function shareViaKakao() {
    if (!inviteUrl) return;
    const text = `[빌라톡 가입 초대]\n${inviteName}님, 아래 링크로 가입해주세요:\n${inviteUrl}\n\n(링크는 14일간 유효합니다)`;
    if (navigator.share) {
      navigator.share({ title: '빌라톡 가입 초대', text, url: inviteUrl }).catch(() => {});
    } else {
      copyInvite();
    }
  }

  function resetInvite() {
    setInviteUrl(null);
    setInviteName('');
    setAddName(''); setAddPhone(''); setAddUnitId(''); setAddIsOwner(false);
    setShowAdd(false);
    load();
  }

  useEffect(() => { load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const [{ data: resData }, { data: unitsData }] = await Promise.all([
      supabase
        .from('residents')
        .select('id, unit_id, name, phone, status, is_owner, applied_at, approved_at, reject_reason, units!inner(villa_id, ho_number)')
        .eq('units.villa_id', villaId)
        .order('created_at', { ascending: false }),
      supabase.from('units').select('id, ho_number').eq('villa_id', villaId).order('ho_number'),
    ]);
    setResidents((resData ?? []) as unknown as Resident[]);
    setUnits((unitsData ?? []) as Unit[]);
    setLoading(false);
  }

  async function approve(r: Resident) {
    if (!confirm(`${r.name} (${r.phone}) 입주민을 승인하시겠습니까?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminRow } = await supabase.from('admins').select('id').eq('auth_id', user?.id).maybeSingle();
    const { error } = await supabase.from('residents').update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: (adminRow as { id: string } | null)?.id ?? null,
    }).eq('id', r.id);
    if (error) { alert('승인 실패: ' + error.message); return; }
    await load();
  }

  async function reject(r: Resident) {
    const reason = prompt(`${r.name} 신청 거절 사유 (선택):`, '');
    if (reason === null) return;
    const { error } = await supabase.from('residents').update({
      status: 'rejected',
      reject_reason: reason || '관리자 거절',
    }).eq('id', r.id);
    if (error) { alert('거절 실패: ' + error.message); return; }
    await load();
  }

  // 이주 확정 시작 — 해당 세대 관리비 정산(미납) 확인
  async function openMoveout(r: Resident) {
    setMoveoutTarget(r);
    setUnpaidBills(null);
    if (!r.unit_id) { setUnpaidBills([]); return; }
    setSettlementLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('amount, is_paid, bill_months!inner(label, year_month, villa_id, status)')
      .eq('unit_id', r.unit_id)
      .eq('is_paid', false);
    const rows = (data ?? []) as unknown as { amount: number; bill_months: { label: string | null; year_month: string; status: string } }[];
    const unpaid: UnpaidBill[] = rows
      .filter(x => x.bill_months.status !== 'draft')
      .map(x => ({ label: x.bill_months.label ?? `${x.bill_months.year_month} 관리비`, amount: x.amount }));
    setUnpaidBills(unpaid);
    setSettlementLoading(false);
  }

  // 이주 확정 실행 — 상태 변경 + 번호 즉시 삭제(마스킹)
  async function doMoveout() {
    const r = moveoutTarget;
    if (!r) return;
    setMoveoutProcessing(true);
    const tombstone = `탈퇴-${r.id.slice(0, 8)}`;
    const { error } = await supabase.from('residents').update({
      status: 'moved_out',
      move_out_date: new Date().toISOString().slice(0, 10),
      phone: tombstone,
    }).eq('id', r.id);
    setMoveoutProcessing(false);
    if (error) { alert('이사 처리 실패: ' + error.message); return; }
    setMoveoutTarget(null);
    setUnpaidBills(null);
    await load();
  }

  // 모드별 상태 그룹
  const moveinStatuses = ['pending', 'active', 'rejected'];
  const moveoutStatuses = ['pending_moveout', 'moved_out'];
  const visible = residents.filter(r =>
    mode === 'movein' ? moveinStatuses.includes(r.status) : moveoutStatuses.includes(r.status));

  const counts: Record<string, number> = {};
  residents.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const moveinCount = residents.filter(r => moveinStatuses.includes(r.status)).length;
  const moveoutCount = residents.filter(r => moveoutStatuses.includes(r.status)).length;
  const unpaidTotal = (unpaidBills ?? []).reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <AdminTopBar
        title="입주민"
        subtitle={`총 ${residents.length}명 · 호실 ${units.length}개`}
        right={
          <button onClick={() => setShowAdd(!showAdd)} className="bg-[#2B2BEE] text-white text-[14px] font-bold px-3.5 py-2.5 rounded-xl hover:bg-[#1C1CC9] transition">
            {showAdd ? '취소' : '＋ 추가'}
          </button>
        }
      />
      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">

        {/* 입주 / 이주 토글 (세그먼트) */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setMode('movein')}
            className={`rounded-xl py-2.5 text-[14px] font-bold transition ${mode === 'movein' ? 'bg-[#2B2BEE] text-white' : 'bg-white text-[#6B7280] border border-[#E8EBF0]'}`}>
            이사 온 사람 · {moveinCount}
          </button>
          <button onClick={() => setMode('moveout')}
            className={`rounded-xl py-2.5 text-[14px] font-bold transition ${mode === 'moveout' ? 'bg-[#2B2BEE] text-white' : 'bg-white text-[#6B7280] border border-[#E8EBF0]'}`}>
            이사 가는 사람 · {moveoutCount}
          </button>
        </div>

      {/* 직접 추가 폼 + 초대링크 */}
      {showAdd && !inviteUrl && (
        <form onSubmit={submitAdd} className="mb-4 bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">추가 방식</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAddMode('invite')}
                className={`py-2.5 rounded-xl text-[14px] font-bold border ${addMode === 'invite' ? 'bg-[#2B2BEE] text-white border-[#2B2BEE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                초대링크 (권장)
              </button>
              <button type="button" onClick={() => setAddMode('direct')}
                className={`py-2.5 rounded-xl text-[14px] font-bold border ${addMode === 'direct' ? 'bg-[#2B2BEE] text-white border-[#2B2BEE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                즉시 등록
              </button>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mt-1.5">
              {addMode === 'invite'
                ? '입주민이 카카오톡 링크로 가입 — 본인이 정보 확인 후 활성'
                : '관리자가 정보 입력 → 입주민으로 즉시 등록·활성. 입주민은 바로 이름+전화번호로 로그인 가능합니다.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">이름 *</label>
              <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="예: 홍길동" maxLength={20}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE]" required />
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">호실 *</label>
              <select value={addUnitId} onChange={e => setAddUnitId(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE]" required>
                <option value="">선택</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.ho_number}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#0F2242] mb-1.5">휴대전화 *</label>
            <input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="01012345678" inputMode="tel"
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[#2B2BEE]" required />
          </div>
          <label className="flex items-center gap-2 text-[15px] text-[#0F2242] cursor-pointer">
            <input type="checkbox" checked={addIsOwner} onChange={e => setAddIsOwner(e.target.checked)} className="w-4 h-4 accent-[#2B2BEE]" />
            소유주 (건물주)
          </label>
          <button type="submit" disabled={addSubmitting} className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[15px] font-bold disabled:opacity-50 hover:bg-[#1C1CC9] transition">
            {addSubmitting ? '처리 중…' : addMode === 'invite' ? '초대링크 발급' : '즉시 등록'}
          </button>
        </form>
      )}

      {inviteUrl && (
        <div className="mb-4 bg-[#E9E9FD] border border-[#2B2BEE]/30 rounded-xl p-4 shadow-sm space-y-3">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-1"><Icon name="message" size={24} color="#2B2BEE" filled /></div>
            <p className="text-[15px] font-bold text-[#0F2242]">{inviteName}님 초대링크 발급 완료</p>
            <p className="text-[13px] text-[#6B7280] mt-1">14일간 유효합니다</p>
          </div>
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-3 break-all text-[12px] text-[#2B2BEE] font-mono">
            {inviteUrl}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={shareViaKakao} className="bg-[#FEE500] text-[#000000] py-3 rounded-xl text-[14px] font-bold">
              카카오톡 공유
            </button>
            <button onClick={copyInvite} className="bg-white border border-[#E8EBF0] text-[#0F2242] py-3 rounded-xl text-[14px] font-bold">
              링크 복사
            </button>
          </div>
          <button onClick={resetInvite} className="w-full text-[13px] text-[#6B7280] font-bold py-2">완료</button>
        </div>
      )}

      {/* 모드 안내 */}
      <p className="text-[13px] text-[#6B7280] mb-3">
        {mode === 'movein'
          ? '신규 신청(승인대기) · 거주중 입주민을 관리합니다.'
          : '이사 신청(이사대기) · 이사 완료된 세대를 관리합니다. 이사 확정 시 관리비 정산을 먼저 확인하세요.'}
      </p>

      {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-10">불러오는 중…</p>
        : visible.length === 0 ? (
          <div className="bg-white border border-[#F0F2F5] rounded-xl p-8 text-center">
            <p className="text-[15px] font-bold text-[#0F2242]">{mode === 'movein' ? '입주민이 없습니다' : '이주 내역이 없습니다'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map(r => {
              const meta = STATUS_LABEL[r.status] ?? { label: r.status, color: 'bg-[#F5F6FA] text-[#6B7280]' };
              const isMovedOut = r.status === 'moved_out';
              return (
                <div key={r.id} className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[17px] font-extrabold text-[#0F2242]">{r.name}</h3>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                    {r.is_owner && <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[#E9E9FD] text-[#2B2BEE]">소유주</span>}
                    <span className="ml-auto text-[14px] text-[#6B7280]">{r.units?.ho_number ?? '-'}</span>
                  </div>
                  <p className="text-[14px] text-[#6B7280]">{isMovedOut ? '번호 삭제됨' : r.phone}</p>
                  {r.reject_reason && <p className="text-[14px] text-[#FF3B30] mt-1">거절 사유: {r.reject_reason}</p>}
                  {r.applied_at && <p className="text-[13px] text-[#9CA3AF] mt-1">신청: {new Date(r.applied_at).toLocaleDateString('ko-KR')}</p>}

                  <div className="flex gap-2 mt-3">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => approve(r)} className="flex-1 bg-[#2B2BEE] text-white py-2 rounded-xl text-[14px] font-bold hover:bg-[#1C1CC9] transition">승인</button>
                        <button onClick={() => reject(r)} className="flex-1 bg-white border border-[#FF3B30]/30 text-[#FF3B30] py-2 rounded-xl text-[14px] font-bold">거절</button>
                      </>
                    )}
                    {r.status === 'pending_moveout' && (
                      <button onClick={() => openMoveout(r)} className="flex-1 bg-[#2B2BEE] text-white py-2 rounded-xl text-[14px] font-bold hover:bg-[#1C1CC9] transition">이사 확정 (정산 확인)</button>
                    )}
                    {r.status === 'active' && mode === 'moveout' && (
                      <button onClick={() => openMoveout(r)} className="flex-1 bg-white border border-[#2B2BEE]/30 text-[#2B2BEE] py-2 rounded-xl text-[14px] font-bold">이사 처리</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* 이주 확정 모달 — 관리비 정산 확인 + 번호 삭제 안내 */}
      {moveoutTarget && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0F2242]/40">
          <div className="bg-white w-full max-w-screen-sm rounded-t-2xl px-5 pt-3 pb-7 max-h-[88vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#E8EBF0] rounded-full mx-auto mb-4" />
            <h3 className="text-[18px] font-extrabold text-[#0F2242]">
              {moveoutTarget.name} · {moveoutTarget.units?.ho_number} 이사 확정
            </h3>

            {/* 관리비 정산 리스트 */}
            <p className="text-[13px] font-bold text-[#6B7280] mt-4 mb-2">관리비 정산 확인</p>
            {settlementLoading ? (
              <p className="text-[14px] text-[#9CA3AF] py-3">정산 내역 확인 중…</p>
            ) : (unpaidBills && unpaidBills.length > 0) ? (
              <div className="bg-[#FEE8E7] border border-[#FF3B30]/20 rounded-xl p-4 mb-3">
                <p className="text-[14px] font-bold text-[#FF3B30] mb-2">아직 정산 안 된 관리비 {unpaidBills.length}건</p>
                <ul className="space-y-1.5 mb-2">
                  {unpaidBills.map((b, i) => (
                    <li key={i} className="flex justify-between text-[14px]">
                      <span className="text-[#0F2242]">{b.label}</span>
                      <span className="font-bold text-[#0F2242]">₩{fmt(b.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between pt-2 border-t border-[#FF3B30]/20">
                  <span className="text-[14px] font-bold text-[#FF3B30]">미정산 합계</span>
                  <span className="text-[16px] font-black text-[#FF3B30]">₩{fmt(unpaidTotal)}</span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-2">미정산 금액이 있습니다. 정산 완료 여부를 확인 후 진행하세요.</p>
              </div>
            ) : (
              <div className="bg-[#E9E9FD] border border-[#2B2BEE]/25 rounded-xl p-4 mb-3">
                <p className="text-[14px] font-bold text-[#2B2BEE]">✓ 미정산 관리비가 없습니다</p>
                <p className="text-[12px] text-[#6B7280] mt-1">모든 세대 관리비가 정산 완료되었습니다.</p>
              </div>
            )}

            {/* 번호 삭제 + 복구 불가 안내 */}
            <div className="bg-[#E9E9FD] border border-[#2B2BEE]/15 rounded-xl p-4 mb-4">
              <p className="text-[13px] text-[#0F2242] leading-relaxed">
                이사 확정 시 <strong className="text-[#2B2BEE]">전화번호가 즉시 삭제</strong>됩니다 (개인정보 보호).<br />
                되돌리려면 입주민이 <strong className="text-[#2B2BEE]">다시 가입</strong>해야 합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMoveoutTarget(null); setUnpaidBills(null); }}
                disabled={moveoutProcessing}
                className="bg-white border border-[#E8EBF0] text-[#0F2242] rounded-xl py-3.5 text-[15px] font-bold disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={doMoveout}
                disabled={moveoutProcessing || settlementLoading}
                className="bg-[#2B2BEE] text-white rounded-xl py-3.5 text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition"
              >
                {moveoutProcessing ? '처리 중…' : '이사 확정 · 번호 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
