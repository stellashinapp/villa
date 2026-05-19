'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ParkingEntry = {
  id: string;
  unit_id: string | null;
  plate_number: string;
  vehicle_type: string | null;
  memo: string | null;
  expires_at: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
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
    setVillaId(s.villaId);
    setVillaName(s.villaName);
    setMyHo(s.ho);
    // unit_id 찾기
    supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => {
    if (!villaId) return;
    load();
  }, [villaId, myHo]);

  async function load() {
    if (!villaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('parking')
      .select('id, unit_id, plate_number, vehicle_type, memo, expires_at, units!inner(ho_number, villa_id)')
      .eq('units.villa_id', villaId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setMyVehicles([]); setOtherVehicles([]);
    } else {
      const all = (data ?? []) as unknown as (ParkingEntry & { units: { ho_number: string } })[];
      const mine = all.filter(p => p.units?.ho_number === myHo);
      const others = all.filter(p => p.units?.ho_number !== myHo);
      setMyVehicles(mine);
      setOtherVehicles(others);
    }
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) { alert('차량 번호를 입력하세요'); return; }
    if (!villaId || !unitId) { alert('호실 정보를 가져올 수 없습니다'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('parking').insert({
      villa_id: villaId,
      unit_id: unitId,
      plate_number: plate.trim(),
      vehicle_type: vehicleType,
      memo: memo.trim() || null,
      expires_at: expiresAt || null,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setPlate(''); setVehicleType('resident'); setMemo(''); setExpiresAt('');
    setShowForm(false);
    await load();
  }

  async function remove(p: ParkingEntry) {
    if (!confirm(`${p.plate_number} 차량을 삭제할까요?`)) return;
    const { error } = await supabase.from('parking').delete().eq('id', p.id);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    await load();
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[24px] font-black text-[#0F2242]">주차</h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">{villaName} · 내 호실: {myHo}</p>
        </div>
        <button
          className="bg-[#4263E8] text-white text-[15px] font-bold px-3.5 py-2 rounded-lg shadow-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '취소' : '＋ 차량 등록'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-4 bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">차량 번호 *</label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              placeholder="예: 12가 3456"
              maxLength={15}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              required
            />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">차량 구분 *</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setVehicleType('resident')}
                className={`py-2.5 rounded-lg text-[15px] font-bold border ${vehicleType === 'resident' ? 'bg-[#4263E8] text-white border-[#4263E8]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                🚗 내 차량 (입주민)
              </button>
              <button type="button" onClick={() => setVehicleType('visitor')}
                className={`py-2.5 rounded-lg text-[15px] font-bold border ${vehicleType === 'visitor' ? 'bg-[#F39C12] text-white border-[#F39C12]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'}`}>
                🅿️ 방문 차량
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">메모 (선택)</label>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="예: 소나타 흰색"
              maxLength={100}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
            />
          </div>
          {vehicleType === 'visitor' && (
            <div>
              <label className="block text-[14px] font-bold text-[#6B7280] mb-1.5">방문 종료일 (권장)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              />
            </div>
          )}
          <button type="submit" disabled={submitting} className="w-full bg-[#4263E8] text-white py-2.5 rounded-lg text-[16px] font-bold disabled:opacity-50">
            {submitting ? '등록 중…' : '차량 등록'}
          </button>
        </form>
      )}

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-10">불러오는 중…</p>
        : error ? (
          <div className="text-center mt-10">
            <p className="text-[17px] font-bold text-[#E74C3C] mb-1">오류</p>
            <p className="text-[15px] text-[#9CA3AF]">{error}</p>
          </div>
        ) : (
          <>
            {/* 내 차량 */}
            <h2 className="text-[15px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">내 차량 ({myVehicles.length})</h2>
            {myVehicles.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-[#E8EBF0] text-center">
                <div className="text-3xl mb-2">🚗</div>
                <p className="text-[15px] text-[#9CA3AF]">등록된 내 차량이 없습니다</p>
                <p className="text-[13px] text-[#9CA3AF] mt-1">＋ 차량 등록 버튼으로 추가</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myVehicles.map(v => <VehicleCard key={v.id} v={v} isMine onRemove={() => remove(v)} />)}
              </div>
            )}

            {/* 빌라 전체 차량 */}
            <h2 className="text-[15px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">
              빌라 전체 등록 차량 ({otherVehicles.length}대)
            </h2>
            {otherVehicles.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-[#E8EBF0] text-center">
                <p className="text-[15px] text-[#9CA3AF]">다른 차량이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {otherVehicles.map(v => <VehicleCard key={v.id} v={v} isMine={false} />)}
              </div>
            )}
          </>
        )
      }
    </div>
  );
}

function VehicleCard({ v, isMine, onRemove }: { v: ParkingEntry & { units?: { ho_number: string } | null }; isMine: boolean; onRemove?: () => void }) {
  return (
    <div className={`bg-white rounded-xl p-4 border shadow-sm ${isMine ? 'border-[#4263E8] border-[1.5px]' : 'border-[#E8EBF0]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[17px] font-extrabold text-[#0F2242]">{v.plate_number}</span>
        <div className="flex items-center gap-2">
          {isMine && (
            <span className="bg-[rgba(66,99,232,0.12)] text-[#4263E8] text-[12px] font-extrabold px-2 py-0.5 rounded">내 차량</span>
          )}
          {onRemove && (
            <button onClick={onRemove} className="text-[14px] text-[#E74C3C] font-bold hover:underline">삭제</button>
          )}
        </div>
      </div>
      <div className="text-[14px] text-[#6B7280] space-y-0.5">
        {v.units?.ho_number && <p>호실: {v.units.ho_number}</p>}
        {v.vehicle_type && (
          <p>
            구분:{' '}
            <span className={v.vehicle_type === 'visitor' ? 'text-[#F39C12] font-semibold' : 'text-[#2ECC71] font-semibold'}>
              {v.vehicle_type === 'resident' ? '입주민 차량' : v.vehicle_type === 'visitor' ? '방문 차량' : v.vehicle_type}
            </span>
          </p>
        )}
        {v.memo && <p>메모: {v.memo}</p>}
        {v.expires_at && <p>방문 종료: {new Date(v.expires_at).toLocaleDateString('ko-KR')}</p>}
      </div>
    </div>
  );
}
