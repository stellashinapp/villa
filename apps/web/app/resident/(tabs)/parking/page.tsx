'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ParkingEntry = {
  id: string; unit_id: string | null; plate_number: string;
  vehicle_type: string | null; memo: string | null; expires_at: string | null;
  units?: { ho_number: string } | null;
};

export default function ResidentParkingPage() {
  const [villaId, setVillaId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [myHo, setMyHo] = useState('');
  const [myVehicles, setMyVehicles] = useState<ParkingEntry[]>([]);
  const [otherVehicles, setOtherVehicles] = useState<ParkingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'resident' | 'visitor'>('resident');
  const [memo, setMemo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { villaId: string; villaName: string; ho: string };
    setVillaId(s.villaId); setVillaName(s.villaName); setMyHo(s.ho);
    supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => { if (villaId) load(); }, [villaId, myHo]);

  async function load() {
    if (!villaId) return;
    setLoading(true);
    const { data } = await supabase.from('parking')
      .select('id, unit_id, plate_number, vehicle_type, memo, expires_at, units!inner(ho_number, villa_id)')
      .eq('units.villa_id', villaId).order('created_at', { ascending: false });
    const all = (data ?? []) as unknown as (ParkingEntry & { units: { ho_number: string } })[];
    setMyVehicles(all.filter(p => p.units?.ho_number === myHo));
    setOtherVehicles(all.filter(p => p.units?.ho_number !== myHo));
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) { alert('차량 번호를 입력하세요'); return; }
    if (!villaId || !unitId) { alert('호실 정보를 가져올 수 없습니다'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('parking').insert({
      villa_id: villaId, unit_id: unitId, plate_number: plate.trim(),
      vehicle_type: vehicleType, memo: memo.trim() || null, expires_at: expiresAt || null,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setPlate(''); setVehicleType('resident'); setMemo(''); setExpiresAt(''); setShowForm(false);
    await load();
  }

  async function remove(p: ParkingEntry) {
    if (!confirm(`${p.plate_number} 차량을 삭제할까요?`)) return;
    await supabase.from('parking').delete().eq('id', p.id);
    await load();
  }

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <header className="bg-white px-5 pt-3 pb-3 sticky top-0 z-30 border-b border-[#F0F2F5]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] tracking-widest">{villaName} · {myHo}</p>
            <h1 className="text-[18px] font-extrabold text-[#0F2242] mt-0.5">주차</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#3766EE] text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-sm">
            {showForm ? '취소' : '＋ 차량 등록'}
          </button>
        </div>
      </header>

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {showForm && (
          <form onSubmit={submit} className="bg-white border border-[#F0F2F5] rounded-2xl p-4 shadow-sm space-y-3 mb-4">
            <div>
              <label className="block text-[13px] font-bold text-[#6B7280] mb-1.5">차량 번호 *</label>
              <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="예: 12가 3456" maxLength={15}
                className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-[#3766EE]/30" required />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#6B7280] mb-1.5">차량 구분 *</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setVehicleType('resident')}
                  className={`py-3 rounded-xl text-[14px] font-bold ${vehicleType === 'resident' ? 'bg-[#3766EE] text-white' : 'bg-[#F5F6FA] text-[#6B7280]'}`}>
                  🚗 내 차량
                </button>
                <button type="button" onClick={() => setVehicleType('visitor')}
                  className={`py-3 rounded-xl text-[14px] font-bold ${vehicleType === 'visitor' ? 'bg-[#F39C12] text-white' : 'bg-[#F5F6FA] text-[#6B7280]'}`}>
                  🅿️ 방문 차량
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#6B7280] mb-1.5">메모 (선택)</label>
              <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 소나타 흰색" maxLength={100}
                className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-[#3766EE]/30" />
            </div>
            {vehicleType === 'visitor' && (
              <div>
                <label className="block text-[13px] font-bold text-[#6B7280] mb-1.5">방문 종료일 (권장)</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-[#3766EE]/30" />
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-full bg-[#3766EE] text-white py-3 rounded-xl text-[15px] font-bold disabled:opacity-50">
              {submitting ? '등록 중…' : '차량 등록'}
            </button>
          </form>
        )}

        {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-10">불러오는 중…</p>
          : (
            <>
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[13px] font-bold text-[#6B7280] tracking-wider">내 차량 ({myVehicles.length})</h2>
              </div>
              {myVehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#F0F2F5] text-center mb-5">
                  <div className="text-3xl mb-1">🚗</div>
                  <p className="text-[13px] text-[#9CA3AF]">등록된 내 차량이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  {myVehicles.map(v => <VehicleCard key={v.id} v={v} isMine onRemove={() => remove(v)} />)}
                </div>
              )}

              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[13px] font-bold text-[#6B7280] tracking-wider">빌라 전체 ({otherVehicles.length})</h2>
              </div>
              {otherVehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-[#F0F2F5] text-center">
                  <p className="text-[13px] text-[#9CA3AF]">다른 차량이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {otherVehicles.map(v => <VehicleCard key={v.id} v={v} isMine={false} />)}
                </div>
              )}
            </>
          )
        }
      </div>
    </div>
  );
}

function VehicleCard({ v, isMine, onRemove }: { v: ParkingEntry & { units?: { ho_number: string } | null }; isMine: boolean; onRemove?: () => void }) {
  const bg = v.vehicle_type === 'visitor' ? '#FFF0E6' : isMine ? '#EEF2FF' : '#E8F8EC';
  const fg = v.vehicle_type === 'visitor' ? '#F39C12' : isMine ? '#3766EE' : '#2ECC71';
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#F0F2F5] shadow-sm flex items-center">
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] mr-3 flex-shrink-0" style={{ background: bg }}>
        {v.vehicle_type === 'visitor' ? '🅿️' : '🚗'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[16px] font-extrabold text-[#0F2242]">{v.plate_number}</span>
          {isMine && <span className="text-[10px] font-bold bg-[#EEF2FF] text-[#3766EE] px-1.5 py-0.5 rounded">내 차량</span>}
        </div>
        <div className="text-[12px] text-[#6B7280] flex flex-wrap gap-x-2">
          {v.units?.ho_number && <span>{v.units.ho_number}</span>}
          <span style={{ color: fg }}>{v.vehicle_type === 'resident' ? '입주민' : v.vehicle_type === 'visitor' ? '방문' : ''}</span>
          {v.memo && <span className="text-[#9CA3AF]">· {v.memo}</span>}
        </div>
      </div>
      {onRemove && <button onClick={onRemove} className="text-[12px] text-[#FF3B30] font-bold ml-2">삭제</button>}
    </div>
  );
}
