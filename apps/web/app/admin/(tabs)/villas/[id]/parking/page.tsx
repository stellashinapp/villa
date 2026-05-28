'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminTopBar from '@/components/AdminTopBar';

type Unit = { id: string; ho_number: string };
type Parking = {
  id: string;
  unit_id: string | null;
  plate_number: string;
  vehicle_type: string;
  memo: string | null;
  expires_at: string | null;
  units: { ho_number: string } | null;
};

// 방문차량은 종료일이 지나면 목록에서 자동 제외 (DB 정리 cron 의 최대 1시간 지연 보완)
function isExpiredVisitor(p: { vehicle_type: string | null; expires_at: string | null }) {
  if (p.vehicle_type !== 'visitor' || !p.expires_at) return false;
  const today = new Date().toISOString().slice(0, 10);
  return p.expires_at.slice(0, 10) < today;
}

export default function AdminVillaParkingPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [items, setItems] = useState<Parking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'resident' | 'visitor'>('resident');
  const [unitId, setUnitId] = useState('');
  const [memo, setMemo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const [{ data: pdata }, { data: udata }] = await Promise.all([
      supabase
        .from('parking')
        .select('id, unit_id, plate_number, vehicle_type, memo, expires_at, units(ho_number)')
        .eq('villa_id', villaId)
        .order('created_at', { ascending: false }),
      supabase.from('units').select('id, ho_number').eq('villa_id', villaId).order('ho_number'),
    ]);
    setItems(((pdata ?? []) as unknown as Parking[]).filter(p => !isExpiredVisitor(p)));
    setUnits((udata ?? []) as Unit[]);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) { alert('차량 번호를 입력하세요'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('parking').insert({
      villa_id: villaId,
      unit_id: unitId || null,
      plate_number: plate.trim(),
      vehicle_type: vehicleType,
      memo: memo.trim() || null,
      expires_at: expiresAt || null,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setPlate(''); setVehicleType('resident'); setUnitId(''); setMemo(''); setExpiresAt('');
    setShowForm(false);
    await load();
  }

  async function remove(p: Parking) {
    if (!confirm(`${p.plate_number} 차량을 삭제할까요?`)) return;
    await supabase.from('parking').delete().eq('id', p.id);
    await load();
  }

  return (
    <>
      <AdminTopBar
        title="주차 관리"
        subtitle={`총 ${items.length}대 등록`}
        right={
          <button onClick={() => setShowForm(!showForm)} className="bg-[#2B2BEE] text-white text-[14px] font-bold px-3.5 py-2.5 rounded-xl hover:bg-[#1C1CC9] transition">
            {showForm ? '취소' : '＋ 등록'}
          </button>
        }
      />
      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">

      {showForm && (
        <form onSubmit={submit} className="mb-4 bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">차량 번호 *</label>
            <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="예: 12가 3456" maxLength={15}
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">차량 구분</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value as 'resident' | 'visitor')}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]">
                <option value="resident">입주민 차량</option>
                <option value="visitor">방문 차량</option>
              </select>
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">호실</label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]">
                <option value="">(선택 안 함)</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.ho_number}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">메모 (선택)</label>
            <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 소나타 흰색 (주 사용)" maxLength={100}
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]" />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">유효기간 (방문 차량용, 선택)</label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]" />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
            {submitting ? '등록 중…' : '차량 등록'}
          </button>
        </form>
      )}

      {loading ? null
        : items.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[17px] font-bold text-[#0F2242]">등록된 차량이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map(p => (
              <div key={p.id} className="bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[17px] font-extrabold text-[#0F2242]">{p.plate_number}</span>
                  <button onClick={() => remove(p)} className="text-[14px] text-[#FF3B30] font-bold hover:underline">삭제</button>
                </div>
                <div className="text-[14px] text-[#6B7280] space-y-0.5">
                  <p>구분: <span className={p.vehicle_type === 'visitor' ? 'text-[#2B2BEE] font-semibold' : 'text-[#2B2BEE] font-semibold'}>
                    {p.vehicle_type === 'resident' ? '입주민' : '방문'}
                  </span></p>
                  {p.units?.ho_number && <p>호실: {p.units.ho_number}</p>}
                  {p.memo && <p>메모: {p.memo}</p>}
                  {p.expires_at && <p>유효: {new Date(p.expires_at).toLocaleDateString('ko-KR')}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      }
      </div>
    </>
  );
}
