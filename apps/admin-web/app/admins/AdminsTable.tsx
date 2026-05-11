'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  villas: number;
  units: number;
  mrr: number;
  joinedAt: string;
  status: string;
  villaNames: string[];
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  trialing: { label: '무료체험', cls: 'bg-priL text-priT' },
  active: { label: '활성', cls: 'bg-okL text-ok' },
  past_due: { label: '결제실패', cls: 'bg-errL text-err' },
  pending_cancel: { label: '해지예정', cls: 'bg-warnL text-warn' },
  cancelled: { label: '해지됨', cls: 'bg-bg text-t3' },
  none: { label: '미가입', cls: 'bg-bg text-t3' },
};

export default function AdminsTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(r => {
      const haystack = [
        r.name,
        r.email,
        r.phone,
        ...r.villaNames,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(k);
    });
  }, [q, rows]);

  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <h3 className="text-sm font-bold whitespace-nowrap">관리자 목록</h3>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="관리자명·이메일·전화·빌라명 검색"
          className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-sm text-t1 outline-none focus:border-pri focus:bg-white transition-colors"
          autoComplete="off"
        />
        <span className="text-xs text-t3 whitespace-nowrap">
          {filtered.length} / {rows.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-t3 text-xs">
              <th className="text-left px-5 py-3 font-medium">관리자명</th>
              <th className="text-left px-5 py-3 font-medium">연락처</th>
              <th className="text-right px-5 py-3 font-medium">빌라수</th>
              <th className="text-right px-5 py-3 font-medium">세대수</th>
              <th className="text-right px-5 py-3 font-medium">월 구독료</th>
              <th className="text-left px-5 py-3 font-medium">가입일</th>
              <th className="text-left px-5 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-t3">
                  {q ? `'${q}' 검색 결과가 없습니다` : '아직 가입한 관리자가 없습니다'}
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.none;
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-priL cursor-pointer transition-colors"
                    onClick={() => (window.location.href = `/admins/${a.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-t1">
                      <Link href={`/admins/${a.id}`} className="hover:underline">{a.name}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-t2">{a.phone || '-'}</td>
                    <td className="px-5 py-3.5 text-right text-t2">{a.villas}</td>
                    <td className="px-5 py-3.5 text-right text-t2">{a.units}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{a.mrr.toLocaleString()}원</td>
                    <td className="px-5 py-3.5 text-t3">{a.joinedAt}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
