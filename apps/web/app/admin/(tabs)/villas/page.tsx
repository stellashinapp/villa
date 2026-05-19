'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Villa = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number | null;
  account_bank: string | null;
  account_number: string | null;
  status: string;
  created_at: string;
};

export default function AdminVillasPage() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitStats, setUnitStats] = useState<Record<string, { occupied: number; vacant: number }>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();
    if (!adminRow) return;

    const { data, error } = await supabase
      .from('villas')
      .select('id, name, address, total_units, units_per_floor, account_bank, account_number, status, created_at')
      .eq('admin_id', (adminRow as { id: string }).id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setVillas([]);
    } else {
      const vs = (data ?? []) as Villa[];
      setVillas(vs);

      // 각 빌라의 활성 입주민 수 (호실 중 거주자 있는 갯수)
      const villaIds = vs.map(v => v.id);
      if (villaIds.length > 0) {
        const { data: resData } = await supabase
          .from('residents')
          .select('unit_id, status, units!inner(villa_id)')
          .in('units.villa_id', villaIds)
          .eq('status', 'active');
        const occupiedPerVilla: Record<string, Set<string>> = {};
        ((resData ?? []) as unknown as { unit_id: string; units: { villa_id: string } }[]).forEach(r => {
          if (!occupiedPerVilla[r.units.villa_id]) occupiedPerVilla[r.units.villa_id] = new Set();
          occupiedPerVilla[r.units.villa_id].add(r.unit_id);
        });
        const stats: Record<string, { occupied: number; vacant: number }> = {};
        vs.forEach(v => {
          const occ = occupiedPerVilla[v.id]?.size ?? 0;
          stats[v.id] = { occupied: occ, vacant: Math.max(0, v.total_units - occ) };
        });
        setUnitStats(stats);
      }
    }
    setLoading(false);
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[11px] text-[#4263E8] font-bold tracking-[0.16em] mb-1.5">VILLAS</p>
          <h1 className="text-[22px] font-black text-[#0F2242]">내 빌라</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">총 {villas.length}개 등록</p>
        </div>
        <Link
          href="/admin/villas/add"
          className="bg-[#4263E8] text-white text-[13px] font-bold px-3.5 py-2 rounded-lg shadow-sm"
        >
          ＋ 빌라 추가
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
          <p className="text-[13px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : villas.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-5xl mb-3">🏘️</div>
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">등록된 빌라가 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">+ 빌라 추가 버튼으로 시작하세요</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {villas.map(v => {
            const stat = unitStats[v.id] ?? { occupied: 0, vacant: v.total_units };
            return (
              <Link
                key={v.id}
                href={`/admin/villas/${v.id}`}
                className="block bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[16px] font-extrabold text-[#0F2242]">{v.name}</h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      v.status === 'active'
                        ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]'
                        : 'bg-[#F5F6FA] text-[#6B7280]'
                    }`}
                  >
                    {v.status === 'active' ? '운영중' : v.status}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] mb-3">{v.address}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="총 호실" value={v.total_units} />
                  <Stat label="입주중" value={stat.occupied} highlight />
                  <Stat label="공실" value={stat.vacant} muted />
                </div>
                {(v.account_bank || v.account_number) && (
                  <p className="text-[11px] text-[#9CA3AF] mt-3">
                    💳 {v.account_bank} {v.account_number}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, muted }: { label: string; value: number; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="bg-[#F5F6FA] rounded-lg py-2">
      <p
        className={`text-[18px] font-extrabold ${
          highlight ? 'text-[#4263E8]' : muted ? 'text-[#9CA3AF]' : 'text-[#0F2242]'
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-[#6B7280] mt-0.5">{label}</p>
    </div>
  );
}
