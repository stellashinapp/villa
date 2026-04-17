'use client';

import { useState } from 'react';

const VILLAS = [
  { id: 1, name: '선릉 파크빌', address: '서울 강남구 선릉로 123', admin: '김철수', units: 32, plan: '인기', price: 50000, payRate: 94, residents: 28, region: '강남' },
  { id: 2, name: '역삼 그린빌', address: '서울 강남구 역삼동 456', admin: '김철수', units: 28, plan: '소형', price: 30000, payRate: 88, residents: 24, region: '강남' },
  { id: 3, name: '삼성 리버뷰', address: '서울 강남구 삼성동 789', admin: '김철수', units: 27, plan: '대형', price: 70000, payRate: 96, residents: 25, region: '강남' },
  { id: 4, name: '강남 힐스테이트', address: '서울 강남구 논현동 11', admin: '박영희', units: 40, plan: '대형', price: 70000, payRate: 92, residents: 36, region: '강남' },
  { id: 5, name: '서초 브라운빌', address: '서울 서초구 방배동 22', admin: '박영희', units: 25, plan: '소형', price: 30000, payRate: 68, residents: 20, region: '서초' },
  { id: 6, name: '잠실 레이크빌', address: '서울 송파구 잠실동 33', admin: '박영희', units: 35, plan: '인기', price: 50000, payRate: 97, residents: 32, region: '송파' },
  { id: 7, name: '송파 파크뷰', address: '서울 송파구 가락동 44', admin: '박영희', units: 30, plan: '인기', price: 50000, payRate: 91, residents: 27, region: '송파' },
  { id: 8, name: '마포 하늘빌', address: '서울 마포구 상수동 66', admin: '박영희', units: 32, plan: '인기', price: 50000, payRate: 93, residents: 29, region: '마포' },
  { id: 9, name: '용산 센트럴', address: '서울 용산구 한남동 77', admin: '박영희', units: 28, plan: '대형', price: 70000, payRate: 89, residents: 24, region: '용산' },
  { id: 10, name: '강동 리버사이드', address: '서울 강동구 천호동 55', admin: '박영희', units: 20, plan: '소형', price: 30000, payRate: 72, residents: 16, region: '강동' },
  { id: 11, name: '성북 아트빌', address: '서울 성북구 성북동 88', admin: '이민호', units: 24, plan: '소형', price: 30000, payRate: 75, residents: 18, region: '성북' },
  { id: 12, name: '노원 스카이', address: '서울 노원구 상계동 99', admin: '정수진', units: 45, plan: '대형', price: 70000, payRate: 91, residents: 40, region: '노원' },
];

const PLANS = ['전체', '소형', '인기', '대형'];
const REGIONS = ['전체', ...Array.from(new Set(VILLAS.map((v) => v.region)))];

export default function VillasPage() {
  const [planFilter, setPlanFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = VILLAS.filter((v) => {
    if (planFilter !== '전체' && v.plan !== planFilter) return false;
    if (regionFilter !== '전체' && v.region !== regionFilter) return false;
    if (search && !v.name.includes(search) && !v.admin.includes(search) && !v.address.includes(search)) return false;
    return true;
  });

  const totalVillas = VILLAS.length;
  const totalUnits = VILLAS.reduce((s, v) => s + v.units, 0);
  const lowPayVillas = VILLAS.filter((v) => v.payRate < 80).length;
  const avgUnits = (totalUnits / totalVillas).toFixed(1);

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">빌라 관리</h2>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '총 빌라', value: `${totalVillas}개`, color: 'text-pri' },
          { label: '총 세대', value: `${totalUnits}세대`, color: 'text-ok' },
          { label: '미납률 높은 빌라', value: `${lowPayVillas}개`, color: 'text-err' },
          { label: '평균 세대/빌라', value: avgUnits, color: 'text-[#4DA6FF]' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        >
          {PLANS.map((p) => <option key={p} value={p}>{p === '전체' ? '플랜 전체' : p}</option>)}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        >
          {REGIONS.map((r) => <option key={r} value={r}>{r === '전체' ? '지역 전체' : r}</option>)}
        </select>
        <input
          placeholder="빌라명, 관리자 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-t1 w-60 outline-none focus:border-pri"
        />
      </div>

      {/* Table */}
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
                <th className="text-right px-5 py-3 font-medium">입주민수</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-t1">{v.name}</td>
                  <td className="px-5 py-3.5 text-t2">{v.address}</td>
                  <td className="px-5 py-3.5 text-t2">{v.admin}</td>
                  <td className="px-5 py-3.5 text-right text-t2">{v.units}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-priL text-priT">{v.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">{v.price.toLocaleString()}원</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={v.payRate >= 90 ? 'text-ok' : v.payRate >= 80 ? 'text-warn' : 'text-err'}>
                      {v.payRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-t2">{v.residents}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-t3">검색 결과가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
