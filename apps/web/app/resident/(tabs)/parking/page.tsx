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

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { villaId: string; villaName: string; ho: string };
    setVillaId(s.villaId);
    setVillaName(s.villaName);
    setMyHo(s.ho);

    // unit_id 는 -data 에서 가져옴
    const dataRaw = sessionStorage.getItem('villatolk:resident-data');
    if (dataRaw) {
      try {
        const sessRaw = JSON.parse(raw) as { villaId: string };
        // resident 객체 자체에서 unit_id 추출
        const residentRaw = sessionStorage.getItem('villatolk:resident-full');
        if (residentRaw) {
          const r = JSON.parse(residentRaw) as { unit_id?: string };
          if (r.unit_id) setUnitId(r.unit_id);
        }
        void sessRaw;
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('parking')
        .select('id, unit_id, plate_number, vehicle_type, memo, expires_at, units!inner(ho_number, villa_id)')
        .eq('units.villa_id', villaId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setMyVehicles([]);
        setOtherVehicles([]);
      } else {
        const all = (data ?? []) as unknown as (ParkingEntry & { units: { ho_number: string } })[];
        const mine = all.filter(p => p.units?.ho_number === myHo);
        const others = all.filter(p => p.units?.ho_number !== myHo);
        setMyVehicles(mine);
        setOtherVehicles(others);
      }
      setLoading(false);
    })();
  }, [villaId, myHo, unitId]);

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <h1 className="text-[22px] font-black text-[#0F2242]">주차</h1>
      <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName} · 내 호실: {myHo}</p>

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
          <p className="text-[13px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : (
        <>
          {/* 내 차량 */}
          <h2 className="text-[13px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">내 차량</h2>
          {myVehicles.length === 0 ? (
            <div className="bg-white rounded-xl p-6 border border-[#E8EBF0] text-center">
              <div className="text-3xl mb-2">🚗</div>
              <p className="text-[13px] text-[#9CA3AF]">등록된 내 차량이 없습니다</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">관리자에게 등록을 요청하세요</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myVehicles.map(v => (
                <VehicleCard key={v.id} v={v} isMine />
              ))}
            </div>
          )}

          {/* 빌라 전체 차량 */}
          <h2 className="text-[13px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">
            빌라 전체 등록 차량 ({otherVehicles.length}대)
          </h2>
          {otherVehicles.length === 0 ? (
            <div className="bg-white rounded-xl p-6 border border-[#E8EBF0] text-center">
              <p className="text-[13px] text-[#9CA3AF]">다른 차량이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {otherVehicles.map(v => (
                <VehicleCard key={v.id} v={v} isMine={false} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VehicleCard({
  v,
  isMine,
}: {
  v: ParkingEntry & { units?: { ho_number: string } | null };
  isMine: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-4 border shadow-sm ${
        isMine ? 'border-[#4263E8] border-[1.5px]' : 'border-[#E8EBF0]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[15px] font-extrabold text-[#0F2242]">{v.plate_number}</span>
        {isMine && (
          <span className="bg-[rgba(66,99,232,0.12)] text-[#4263E8] text-[10px] font-extrabold px-2 py-0.5 rounded">
            내 차량
          </span>
        )}
      </div>
      <div className="text-[12px] text-[#6B7280] space-y-0.5">
        {v.units?.ho_number && <p>호실: {v.units.ho_number}</p>}
        {v.vehicle_type && <p>차종: {v.vehicle_type}</p>}
        {v.memo && <p>메모: {v.memo}</p>}
        {v.expires_at && (
          <p>유효기간: {new Date(v.expires_at).toLocaleDateString('ko-KR')}</p>
        )}
      </div>
    </div>
  );
}
