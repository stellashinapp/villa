'use client';

import { useState, useMemo } from 'react';

export type ResidentRow = {
  id: string;
  name: string;
  phone: string;
  villaName: string;
  adminLabel: string;
  ho: string;
  isPaid: boolean;
};

export default function ResidentsTable({
  rows,
  villaOptions,
}: {
  rows: ResidentRow[];
  villaOptions: string[];
}) {
  const [search, setSearch] = useState('');
  const [villaFilter, setVillaFilter] = useState('전체');
  const [paidFilter, setPaidFilter] = useState<'전체' | '납부' | '미납'>('전체');

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase();
    return rows.filter(r => {
      if (villaFilter !== '전체' && r.villaName !== villaFilter) return false;
      if (paidFilter === '납부' && !r.isPaid) return false;
      if (paidFilter === '미납' && r.isPaid) return false;
      if (k) {
        const haystack = [r.name, r.phone, r.villaName, r.adminLabel, r.ho].join(' ').toLowerCase();
        if (!haystack.includes(k)) return false;
      }
      return true;
    });
  }, [rows, search, villaFilter, paidFilter]);

  const villas = ['전체', ...villaOptions];

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={villaFilter}
          onChange={e => setVillaFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        >
          {villas.map(v => (
            <option key={v} value={v}>{v === '전체' ? '빌라 전체' : v}</option>
          ))}
        </select>

        <select
          value={paidFilter}
          onChange={e => setPaidFilter(e.target.value as '전체' | '납부' | '미납')}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        >
          <option value="전체">납부 전체</option>
          <option value="납부">납부</option>
          <option value="미납">미납</option>
        </select>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름·전화·빌라·관리자·호실 검색"
          className="flex-1 min-w-[200px] bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-t1 outline-none focus:border-pri"
          autoComplete="off"
        />

        <span className="text-xs text-t3 self-center whitespace-nowrap">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">입주민 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">이름</th>
                <th className="text-left px-5 py-3 font-medium">연락처</th>
                <th className="text-left px-5 py-3 font-medium">빌라</th>
                <th className="text-left px-5 py-3 font-medium">호실</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-t3">
                    {rows.length === 0 ? '등록된 입주민이 없습니다' : '검색 결과가 없습니다'}
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-t1">{r.name}</td>
                    <td className="px-5 py-3.5 text-t2">{r.phone}</td>
                    <td className="px-5 py-3.5 text-t2">{r.villaName}</td>
                    <td className="px-5 py-3.5 text-t2">{r.ho}</td>
                    <td className="px-5 py-3.5 text-t2">{r.adminLabel}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.isPaid ? 'bg-okL text-ok' : 'bg-errL text-err'}`}>
                        {r.isPaid ? '납부' : '미납'}
                      </span>
                    </td>
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
