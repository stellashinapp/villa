'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: '거주중', color: 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]' },
  pending: { label: '승인대기', color: 'bg-[rgba(243,156,18,0.12)] text-[#F39C12]' },
  pending_moveout: { label: '이사대기', color: 'bg-[rgba(255,107,53,0.12)] text-[#FF6B35]' },
  moved_out: { label: '이사완료', color: 'bg-[#F5F6FA] text-[#6B7280]' },
  rejected: { label: '거절됨', color: 'bg-[rgba(231,76,60,0.12)] text-[#E74C3C]' },
};

export default function AdminVillaResidentsPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [residents, setResidents] = useState<Resident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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
      // 즉시 등록 — 입주민 행 바로 active
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
      setAddName(''); setAddPhone(''); setAddUnitId(''); setAddIsOwner(false);
      setShowAdd(false);
      await load();
    } else {
      // 초대링크 발급
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

  async function confirmMoveout(r: Resident) {
    if (!confirm(`${r.name} 이사 처리하시겠습니까?`)) return;
    const { error } = await supabase.from('residents').update({
      status: 'moved_out',
    }).eq('id', r.id);
    if (error) { alert('실패: ' + error.message); return; }
    await load();
  }

  const filtered = filter === 'all' ? residents : residents.filter(r => r.status === filter);
  const counts: Record<string, number> = {};
  residents.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href={`/admin/villas/${villaId}`} className="text-[15px] text-[#6B7280]">← 빌라 상세</Link>
      <div className="flex justify-between items-end mt-3 mb-4">
        <div>
          <h1 className="text-[26px] font-black text-[#0F2242]">입주민</h1>
          <p className="text-[16px] text-[#6B7280] mt-0.5">총 {residents.length}명 (호실 {units.length}개)</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-[#3766EE] text-white text-[16px] font-bold px-3.5 py-2.5 rounded-xl">
          {showAdd ? '취소' : '＋ 입주민 추가'}
        </button>
      </div>

      {/* 직접 추가 폼 (QA Page 5) + 초대링크 (QA Page 11) */}
      {showAdd && !inviteUrl && (
        <form onSubmit={submitAdd} className="mb-4 bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">추가 방식</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAddMode('invite')}
                className={`py-2.5 rounded-xl text-[14px] font-bold border ${addMode === 'invite' ? 'bg-[#3766EE] text-white border-[#3766EE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                💌 초대링크 (권장)
              </button>
              <button type="button" onClick={() => setAddMode('direct')}
                className={`py-2.5 rounded-xl text-[14px] font-bold border ${addMode === 'direct' ? 'bg-[#3766EE] text-white border-[#3766EE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                ⚡ 즉시 등록
              </button>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mt-1.5">
              {addMode === 'invite'
                ? '입주민이 카카오톡 링크로 가입 — 본인이 정보 확인 후 활성'
                : '관리자가 정보 입력 → 즉시 활성 (입주민 가입 안 함)'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">이름 *</label>
              <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="예: 홍길동" maxLength={20}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" required />
            </div>
            <div>
              <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">호실 *</label>
              <select value={addUnitId} onChange={e => setAddUnitId(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" required>
                <option value="">선택</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.ho_number}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[15px] font-bold text-[#6B7280] mb-1.5">휴대전화 *</label>
            <input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="01012345678" inputMode="tel"
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[16px] outline-none focus:border-[#3766EE]" required />
          </div>
          <label className="flex items-center gap-2 text-[15px] text-[#0F2242] cursor-pointer">
            <input type="checkbox" checked={addIsOwner} onChange={e => setAddIsOwner(e.target.checked)} className="w-4 h-4" />
            소유주 (건물주)
          </label>
          <button type="submit" disabled={addSubmitting} className="w-full bg-[#3766EE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
            {addSubmitting ? '처리 중…' : addMode === 'invite' ? '초대링크 발급' : '즉시 등록'}
          </button>
        </form>
      )}

      {/* 초대링크 발급 결과 */}
      {inviteUrl && (
        <div className="mb-4 bg-[#EEF1FB] border border-[#3766EE]/30 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="text-center">
            <div className="text-3xl mb-1">💌</div>
            <p className="text-[15px] font-bold text-[#0F2242]">{inviteName}님 초대링크 발급 완료</p>
            <p className="text-[13px] text-[#6B7280] mt-1">14일간 유효합니다</p>
          </div>
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-3 break-all text-[12px] text-[#3766EE] font-mono">
            {inviteUrl}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={shareViaKakao} className="bg-[#FEE500] text-[#000000] py-3 rounded-xl text-[14px] font-bold">
              💬 카카오톡 공유
            </button>
            <button onClick={copyInvite} className="bg-white border border-[#E8EBF0] text-[#0F2242] py-3 rounded-xl text-[14px] font-bold">
              📋 링크 복사
            </button>
          </div>
          <button onClick={resetInvite} className="w-full text-[13px] text-[#6B7280] font-bold py-2">
            완료
          </button>
        </div>
      )}

      {/* 상태 필터 */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
        {[
          { v: 'all', label: '전체', n: residents.length },
          { v: 'pending', label: '승인대기', n: counts.pending ?? 0 },
          { v: 'active', label: '거주중', n: counts.active ?? 0 },
          { v: 'pending_moveout', label: '이사대기', n: counts.pending_moveout ?? 0 },
          { v: 'moved_out', label: '이사완료', n: counts.moved_out ?? 0 },
          { v: 'rejected', label: '거절', n: counts.rejected ?? 0 },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-[14px] font-bold border whitespace-nowrap ${
              filter === f.v ? 'bg-[#3766EE] text-white border-[#3766EE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'
            }`}>
            {f.label} {f.n > 0 && <span className={filter === f.v ? 'text-white/80' : 'text-[#9CA3AF]'}>· {f.n}</span>}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-10">불러오는 중…</p>
        : filtered.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[17px] font-bold text-[#0F2242]">해당 상태의 입주민이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(r => {
              const meta = STATUS_LABEL[r.status] ?? { label: r.status, color: 'bg-[#F5F6FA] text-[#6B7280]' };
              return (
                <div key={r.id} className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[17px] font-extrabold text-[#0F2242]">{r.name}</h3>
                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                    {r.is_owner && <span className="text-[12px] font-bold px-2 py-0.5 rounded bg-[rgba(55,102,238,0.12)] text-[#3766EE]">소유주</span>}
                    <span className="ml-auto text-[14px] text-[#6B7280]">{r.units?.ho_number ?? '-'}</span>
                  </div>
                  <p className="text-[14px] text-[#6B7280]">{r.phone}</p>
                  {r.reject_reason && <p className="text-[14px] text-[#E74C3C] mt-1">거절 사유: {r.reject_reason}</p>}
                  {r.applied_at && <p className="text-[13px] text-[#9CA3AF] mt-1">신청: {new Date(r.applied_at).toLocaleDateString('ko-KR')}</p>}

                  {/* 액션 */}
                  <div className="flex gap-2 mt-3">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => approve(r)} className="flex-1 bg-[#3766EE] text-white py-2 rounded-xl text-[14px] font-bold">승인</button>
                        <button onClick={() => reject(r)} className="flex-1 bg-white border border-[#E74C3C]/30 text-[#E74C3C] py-2 rounded-xl text-[14px] font-bold">거절</button>
                      </>
                    )}
                    {r.status === 'pending_moveout' && (
                      <button onClick={() => confirmMoveout(r)} className="flex-1 bg-[#3766EE] text-white py-2 rounded-xl text-[14px] font-bold">이사 확정</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
