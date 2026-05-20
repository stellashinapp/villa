'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Pending = {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'pending_moveout';
  applied_at: string | null;
  move_out_date: string | null;
  units: { ho_number: string; villas: { id: string; name: string } } | null;
};

function fmtPhone(p: string) {
  const d = (p ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  return p;
}
function relTime(iso: string | null): string {
  if (!iso) return '-';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  return `${d}일 전`;
}

export default function ApplicationsShell() {
  const router = useRouter();
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // 처리 중인 residentId

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/admin/login'); return; }

    const { data: adminRow } = await supabase.from('admins').select('id').eq('auth_id', user.id).maybeSingle();
    if (!adminRow) { router.replace('/admin/login'); return; }

    // 내 빌라들 → 그 안의 pending/pending_moveout residents
    const { data: villas } = await supabase.from('villas').select('id').eq('admin_id', adminRow.id);
    const villaIds = (villas ?? []).map(v => v.id);
    if (villaIds.length === 0) { setRows([]); setLoading(false); return; }

    const { data: pending } = await supabase
      .from('residents')
      .select('id, name, phone, status, applied_at, move_out_date, units!inner(ho_number, villa_id, villas!inner(id, name))')
      .in('units.villa_id', villaIds)
      .in('status', ['pending', 'pending_moveout'])
      .order('applied_at', { ascending: true });

    const list = (pending ?? []).map(p => {
      const u = Array.isArray(p.units) ? p.units[0] : (p as { units?: unknown }).units;
      const v = Array.isArray((u as { villas?: unknown })?.villas) ? (u as { villas: unknown[] }).villas[0] : (u as { villas?: unknown })?.villas;
      return { ...p, units: u ? { ho_number: (u as { ho_number: string }).ho_number, villas: v as { id: string; name: string } } : null };
    }) as Pending[];
    setRows(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function decide(id: string, action: 'approve' | 'reject', kind: 'application' | 'moveout') {
    if (kind === 'application' && action === 'reject') {
      const reason = prompt('거부 사유를 입력하세요 (입주민에게 표시됨)');
      if (reason === null) return;
      setBusy(id);
      const { error } = await supabase.functions.invoke('approve-resident-application', {
        body: { residentId: id, action: 'reject', rejectReason: reason },
      });
      if (error) alert('처리 실패: ' + error.message);
      setBusy(null);
      await load();
      return;
    }

    if (kind === 'moveout' && !confirm('이주를 확정하시겠습니까? 이 입주민은 더이상 청구서·민원 작성이 불가능해집니다.')) return;
    if (kind === 'application' && action === 'approve' && !confirm('입주 신청을 승인하시겠습니까?')) return;

    setBusy(id);
    const fn = kind === 'application'
      ? { name: 'approve-resident-application', body: { residentId: id, action: 'approve' } }
      : { name: 'confirm-moveout', body: { residentId: id } };
    const { error } = await supabase.functions.invoke(fn.name, { body: fn.body });
    if (error) alert('처리 실패: ' + error.message);
    setBusy(null);
    await load();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-t3">불러오는 중…</div>;

  const applications = rows.filter(r => r.status === 'pending');
  const moveouts = rows.filter(r => r.status === 'pending_moveout');

  return (
    <div className="max-w-md mx-auto px-5 py-6 pb-24">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs text-t3">
          <Link href="/admin" className="hover:text-t1">← 홈</Link>
          <span>/</span>
          <span className="text-t1 font-semibold">신청 대기</span>
        </div>
        <h1 className="text-xl font-extrabold text-t1 mt-2">입주·이주 신청</h1>
      </header>

      {/* 입주 신청 */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-t3 tracking-widest mb-3">📮 입주 신청 ({applications.length})</h2>
        {applications.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-t3">대기 중인 입주 신청 없음</div>
        ) : (
          <div className="space-y-3">
            {applications.map(r => (
              <div key={r.id} className="bg-white border border-border rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-t1">{r.name}</div>
                    <div className="text-[13px] text-t3 mt-0.5">{fmtPhone(r.phone)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-pri">{r.units?.villas.name ?? '-'}</div>
                    <div className="text-[13px] text-t3 mt-0.5">{r.units?.ho_number ?? '-'}호</div>
                  </div>
                </div>
                <div className="text-[13px] text-t3 mb-3">신청 {relTime(r.applied_at)}</div>
                <div className="flex gap-2">
                  <button
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, 'reject', 'application')}
                    className="flex-1 border border-err/30 text-err rounded-2xl py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    거부
                  </button>
                  <button
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, 'approve', 'application')}
                    className="flex-1 bg-pri text-white rounded-2xl py-2.5 text-sm font-bold disabled:opacity-50"
                  >
                    {busy === r.id ? '처리 중…' : '승인'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 이주 신청 */}
      <section>
        <h2 className="text-xs font-bold text-t3 tracking-widest mb-3">📦 이주 신청 ({moveouts.length})</h2>
        {moveouts.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-t3">대기 중인 이주 신청 없음</div>
        ) : (
          <div className="space-y-3">
            {moveouts.map(r => (
              <div key={r.id} className="bg-white border border-border rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-t1">{r.name}</div>
                    <div className="text-[13px] text-t3 mt-0.5">{fmtPhone(r.phone)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-warn">{r.units?.villas.name ?? '-'}</div>
                    <div className="text-[13px] text-t3 mt-0.5">{r.units?.ho_number ?? '-'}호</div>
                  </div>
                </div>
                {r.move_out_date && (
                  <div className="text-[13px] text-t3 mb-3">이사 예정일 {r.move_out_date}</div>
                )}
                <button
                  disabled={busy === r.id}
                  onClick={() => decide(r.id, 'approve', 'moveout')}
                  className="w-full bg-warn text-white rounded-2xl py-2.5 text-sm font-bold disabled:opacity-50"
                >
                  {busy === r.id ? '처리 중…' : '이주 확정 (moved_out)'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
