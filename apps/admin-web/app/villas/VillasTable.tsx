'use client';

import { useState, useMemo } from 'react';

type Villa = {
  id: string;
  name: string;
  address: string;
  admin: string;
  units: number;
  plan: string;
  price: number;
  payRate: number;
  residents: number;
  region: string;
  overdueAmount: number;
  overdueUnits: number;
};

const PLANS = ['전체', '소형', '인기', '대형'];

export default function VillasTable({ villas }: { villas: Villa[] }) {
  const [planFilter, setPlanFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [search, setSearch] = useState('');

  const regions = useMemo(
    () => ['전체', ...Array.from(new Set(villas.map((v) => v.region).filter((r) => r !== '-')))],
    [villas]
  );

  const filtered = villas.filter((v) => {
    if (planFilter !== '전체' && v.plan !== planFilter) return false;
    if (regionFilter !== '전체' && v.region !== regionFilter) return false;
    if (search && !v.name.includes(search) && !v.admin.includes(search) && !v.address.includes(search)) return false;
    return true;
  });

  const totalVillas = villas.length;
  const totalUnits = villas.reduce((s, v) => s + v.units, 0);
  const lowPayVillas = villas.filter((v) => v.payRate > 0 && v.payRate < 80).length;
  const avgUnits = totalVillas > 0 ? (totalUnits / totalVillas).toFixed(1) : '0';
  const totalOverdueAmount = villas.reduce((s, v) => s + (v.overdueAmount ?? 0), 0);

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">빌라 관리</h2>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: '총 빌라', value: `${totalVillas}개`, color: 'text-pri' },
          { label: '총 세대', value: `${totalUnits}세대`, color: 'text-ok' },
          { label: '미납률 높은 빌라', value: `${lowPayVillas}개`, color: 'text-err' },
          { label: '누적 미납 총액', value: `${totalOverdueAmount.toLocaleString()}원`, color: 'text-err' },
          { label: '평균 세대/빌라', value: avgUnits, color: 'text-[#4DA6FF]' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri">
          {PLANS.map((p) => <option key={p} value={p}>{p === '전체' ? '플랜 전체' : p}</option>)}
        </select>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri">
          {regions.map((r) => <option key={r} value={r}>{r === '전체' ? '지역 전체' : r}</option>)}
        </select>
        <input placeholder="빌라명, 관리자 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-t1 w-60 outline-none focus:border-pri" />
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">빌라명</th>
                <th className="text-left px-5 py-3 font-medium">주소</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-right px-5 py-3 font-medium">세대수</th>
                <th className="text-left px-5 py-3 font-medium">플랜</th>
                <th className="text-right px-5 py-3 font-medium">월가격</th>
                <th className="text-right px-5 py-3 font-medium">납부율</th>
                <th className="text-right px-5 py-3 font-medium">누적 미납</th>
                <th className="text-right px-5 py-3 font-medium">입주민수</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-t3">{villas.length === 0 ? '등록된 빌라가 없습니다' : '검색 결과가 없습니다'}</td></tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-t1">{v.name}</td>
                    <td className="px-5 py-3.5 text-t2">{v.address}</td>
                    <td className="px-5 py-3.5 text-t2">{v.admin}</td>
                    <td className="px-5 py-3.5 text-right text-t2">{v.units}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-priL text-priT">{v.plan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">{v.price.toLocaleString()}원</td>
                    <td className="px-5 py-3.5 text-right">
                      {v.payRate > 0 ? (
                        <span className={v.payRate >= 90 ? 'text-ok' : v.payRate >= 80 ? 'text-warn' : 'text-err'}>{v.payRate}%</span>
                      ) : (
                        <span className="text-t3">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {v.overdueAmount > 0 ? (
                        <span className="text-err font-semibold">
                          {v.overdueAmount.toLocaleString()}원
                          <span className="text-t3 font-normal text-xs ml-1">({v.overdueUnits}세대)</span>
                        </span>
                      ) : (
                        <span className="text-t3">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-t2">{v.residents}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
