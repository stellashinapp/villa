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
      <Link href={`/admin/villas/${villaId}`} className="text-[12px] text-[#6B7280]">← 빌라 상세</Link>
      <div className="mt-3 mb-4">
        <h1 className="text-[22px] font-black text-[#0F2242]">입주민</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">총 {residents.length}명 (호실 {units.length}개)</p>
      </div>

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
            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border whitespace-nowrap ${
              filter === f.v ? 'bg-[#4263E8] text-white border-[#4263E8]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'
            }`}>
            {f.label} {f.n > 0 && <span className={filter === f.v ? 'text-white/80' : 'text-[#9CA3AF]'}>· {f.n}</span>}
          </button>
        ))}
      </div>

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-10">불러오는 중…</p>
        : filtered.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[15px] font-bold text-[#0F2242]">해당 상태의 입주민이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(r => {
              const meta = STATUS_LABEL[r.status] ?? { label: r.status, color: 'bg-[#F5F6FA] text-[#6B7280]' };
              return (
                <div key={r.id} className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[15px] font-extrabold text-[#0F2242]">{r.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                    {r.is_owner && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(66,99,232,0.12)] text-[#4263E8]">소유주</span>}
                    <span className="ml-auto text-[12px] text-[#6B7280]">{r.units?.ho_number ?? '-'}</span>
                  </div>
                  <p className="text-[12px] text-[#6B7280]">{r.phone}</p>
                  {r.reject_reason && <p className="text-[12px] text-[#E74C3C] mt-1">거절 사유: {r.reject_reason}</p>}
                  {r.applied_at && <p className="text-[11px] text-[#9CA3AF] mt-1">신청: {new Date(r.applied_at).toLocaleDateString('ko-KR')}</p>}

                  {/* 액션 */}
                  <div className="flex gap-2 mt-3">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => approve(r)} className="flex-1 bg-[#4263E8] text-white py-2 rounded-lg text-[12px] font-bold">승인</button>
                        <button onClick={() => reject(r)} className="flex-1 bg-white border border-[#E74C3C]/30 text-[#E74C3C] py-2 rounded-lg text-[12px] font-bold">거절</button>
                      </>
                    )}
                    {r.status === 'pending_moveout' && (
                      <button onClick={() => confirmMoveout(r)} className="flex-1 bg-[#4263E8] text-white py-2 rounded-lg text-[12px] font-bold">이사 확정</button>
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
