'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ResidentPageHeader from '@/components/ResidentPageHeader';
import Icon from '@/components/Icon';

type ParkingEntry = {
  id: string; unit_id: string | null; plate_number: string;
  vehicle_type: string | null; memo: string | null; expires_at: string | null;
  units?: { ho_number: string } | null;
};

type Session = { villaId: string; villaName: string; ho: string; name: string };

// 방문차량은 종료일이 지나면 목록에서 자동 제외 (DB 정리 cron 의 최대 1시간 지연 보완)
function isExpiredVisitor(p: { vehicle_type: string | null; expires_at: string | null }) {
  if (p.vehicle_type !== 'visitor' || !p.expires_at) return false;
  const today = new Date().toISOString().slice(0, 10);
  return p.expires_at.slice(0, 10) < today;
}

export default function ResidentParkingPage() {
  const [s, setS] = useState<Session | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [list, setList] = useState<(ParkingEntry & { units: { ho_number: string } | null })[]>([]);
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
    const sess = JSON.parse(raw) as Session;
    setS(sess);
    supabase.from('units').select('id').eq('villa_id', sess.villaId).eq('ho_number', sess.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => { if (s) load(s); }, [s]);

  async function load(sess: Session) {
    setLoading(true);
    const { data } = await supabase.from('parking')
      .select('id, unit_id, plate_number, vehicle_type, memo, expires_at, units!inner(ho_number, villa_id)')
      .eq('units.villa_id', sess.villaId).order('created_at', { ascending: false });
    const rows = ((data ?? []) as unknown as (ParkingEntry & { units: { ho_number: string } | null })[])
      .filter(p => !isExpiredVisitor(p));
    setList(rows);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) { alert('차량 번호를 입력하세요'); return; }
    if (!s || !unitId) { alert('호실 정보를 가져올 수 없습니다'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('parking').insert({
      villa_id: s.villaId, unit_id: unitId, plate_number: plate.trim(),
      vehicle_type: vehicleType, memo: memo.trim() || null, expires_at: expiresAt || null,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setPlate(''); setVehicleType('resident'); setMemo(''); setExpiresAt(''); setShowForm(false);
    if (s) await load(s);
  }

  async function remove(p: ParkingEntry) {
    if (!confirm(`${p.plate_number} 차량을 삭제할까요?`)) return;
    await supabase.from('parking').delete().eq('id', p.id);
    if (s) await load(s);
  }

  if (!s) return null;

  const myVehicles = list.filter(v => v.units?.ho_number === s.ho);
  const residentList = list.filter(v => v.vehicle_type === 'resident');
  const visitorList = list.filter(v => v.vehicle_type === 'visitor');

  return (
    <>
      <ResidentPageHeader villaName={s.villaName} title="주차" ho={s.ho} name={s.name} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-extrabold text-[#0F2242]">내 등록 차량</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#2B2BEE] text-white text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-sm">
            {showForm ? '취소' : '＋ 등록'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="bg-white border border-[#F0F2F5] rounded-xl p-4 shadow-sm space-y-3 mb-4">
            <div>
              <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">차량 번호 *</label>
              <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="예: 12가 3456" maxLength={15}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" required />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">차량 구분</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setVehicleType('resident')}
                  className={`py-3 rounded-xl text-[14px] font-bold border transition ${
                    vehicleType === 'resident' ? 'bg-[#2B2BEE] text-white border-[#2B2BEE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'
                  }`}>
                  내 차량
                </button>
                <button type="button" onClick={() => setVehicleType('visitor')}
                  className={`py-3 rounded-xl text-[14px] font-bold border transition ${
                    vehicleType === 'visitor' ? 'bg-[#2B2BEE] text-white border-[#2B2BEE]' : 'bg-white text-[#6B7280] border-[#E8EBF0]'
                  }`}>
                  방문 차량
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">메모 (선택)</label>
              <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 소나타 흰색" maxLength={100}
                className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" />
            </div>
            {vehicleType === 'visitor' && (
              <div>
                <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">방문 종료일</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" />
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#2B2BEE] text-white py-3.5 rounded-xl text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition">
              {submitting ? '등록 중…' : '차량 등록'}
            </button>
          </form>
        )}

        {loading ? null : (
          <>
            {myVehicles.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-[#F0F2F5] text-center mb-6">
                <p className="text-[13px] text-[#9CA3AF]">등록된 내 차량이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {myVehicles.map(v => <VehicleCard key={v.id} v={v} variant="mine" onRemove={() => remove(v)} />)}
              </div>
            )}

            <h2 className="text-[15px] font-extrabold text-[#0F2242] mb-3">우리 빌라 등록 차량</h2>
            <p className="text-[12px] text-[#6B7280] mb-3">총 {list.length}대 등록됨</p>

            {residentList.length > 0 && (
              <>
                <p className="text-[13px] font-bold text-[#2B2BEE] mb-2">입주민 차량 {residentList.length}대</p>
                <div className="space-y-2 mb-5">
                  {residentList.map(v => (
                    <VehicleCard key={v.id} v={v} variant={v.units?.ho_number === s.ho ? 'mine' : 'resident'} />
                  ))}
                </div>
              </>
            )}

            {visitorList.length > 0 && (
              <>
                <p className="text-[13px] font-bold text-[#2B2BEE] mb-2">방문 차량 {visitorList.length}대</p>
                <div className="space-y-2">
                  {visitorList.map(v => <VehicleCard key={v.id} v={v} variant="visitor" />)}
                </div>
              </>
            )}

            {list.length === 0 && (
              <div className="bg-white rounded-xl p-8 border border-[#F0F2F5] text-center">
                <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="parking" size={26} color="#2B2BEE" filled /></div>
                <p className="text-[13px] text-[#9CA3AF]">등록된 차량이 없습니다</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function VehicleCard({
  v, variant, onRemove,
}: {
  v: ParkingEntry & { units: { ho_number: string } | null };
  variant: 'mine' | 'resident' | 'visitor';
  onRemove?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-[#F0F2F5] shadow-sm flex items-center">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center mr-3 flex-shrink-0 bg-[#E9E9FD]">
        <Icon name="parking" size={22} color="#2B2BEE" filled />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-extrabold text-[#0F2242]">{v.plate_number}</p>
        <p className="text-[12px] text-[#6B7280] mt-0.5">
          {variant === 'visitor'
            ? `방문 · ${v.units?.ho_number ?? ''}${v.memo ? ` · ${v.memo}` : ''}`
            : `${v.units?.ho_number ?? ''} · ${variant === 'mine' ? '입주민' : '입주민'}`}
        </p>
      </div>
      {variant === 'mine' && !onRemove && (
        <span className="text-[11px] font-bold bg-[#E9E9FD] text-[#2B2BEE] px-2 py-1 rounded-full">내 차량</span>
      )}
      {variant === 'visitor' && (
        <span className="text-[11px] font-bold bg-[#F5F6FA] text-[#6B7280] px-2 py-1 rounded-full">방문자</span>
      )}
      {onRemove && (
        <button onClick={onRemove} className="text-[11px] text-[#FF3B30] font-bold ml-2 px-2">삭제</button>
      )}
    </div>
  );
}
