'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ParkingSlot = {
  id: string;
  slot_number: string;
  unit_id: string | null;
  car_number: string | null;
  status: string;
};

export default function ResidentParkingPage() {
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [myHo, setMyHo] = useState('');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { villaId: string; villaName: string; ho: string };
    setVillaId(s.villaId);
    setVillaName(s.villaName);
    setMyHo(s.ho);
  }, []);

  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      // parking_slots 테이블에서 villa_id 기준 조회 — 없는 경우 빈 배열
      const { data, error } = await supabase
        .from('parking_slots')
        .select('id, slot_number, unit_id, car_number, status')
        .eq('villa_id', villaId)
        .order('slot_number', { ascending: true });
      if (error) {
        // 테이블 자체가 없을 수 있음 — 에러를 빈 상태로 처리
        setSlots([]);
        if (!error.message.toLowerCase().includes('not exist')) {
          setError(error.message);
        }
      } else {
        setSlots((data ?? []) as ParkingSlot[]);
      }
      setLoading(false);
    })();
  }, [villaId]);

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <h1 className="text-[22px] font-black text-[#0F2242]">주차</h1>
      <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName} · 우리 호실: {myHo}</p>

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
          <p className="text-[13px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-5xl mb-3">🅿️</div>
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">등록된 주차 정보가 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">관리자가 주차 자리를 배정하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {slots.map(slot => {
            const isMine = slot.unit_id !== null;
            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between ${
                  isMine ? 'border-[#4263E8] border-[1.5px]' : 'border-[#E8EBF0]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold text-[#0F2242]">
                      {slot.slot_number}번 자리
                    </span>
                    {isMine && (
                      <span className="bg-[rgba(66,99,232,0.12)] text-[#4263E8] text-[10px] font-extrabold px-2 py-0.5 rounded">
                        내 자리
                      </span>
                    )}
                  </div>
                  {slot.car_number && (
                    <p className="text-[13px] text-[#6B7280] mt-1">차량: {slot.car_number}</p>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-1 rounded ${
                    slot.status === 'occupied'
                      ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]'
                      : 'bg-[#F5F6FA] text-[#9CA3AF]'
                  }`}
                >
                  {slot.status === 'occupied' ? '사용중' : '비어있음'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
