'use client';

import Link from 'next/link';

const ADMINS = [
  { id: 'adm-001', name: '김철수', phone: '010-1234-5678', villas: 3, units: 87, mrr: 150000, joinedAt: '2025-08-12', status: '활성' as const },
  { id: 'adm-002', name: '박영희', phone: '010-2345-6789', villas: 7, units: 210, mrr: 350000, joinedAt: '2025-09-03', status: '활성' as const },
  { id: 'adm-003', name: '이민호', phone: '010-3456-7890', villas: 1, units: 24, mrr: 30000, joinedAt: '2025-11-20', status: '미정산' as const },
  { id: 'adm-004', name: '정수진', phone: '010-4567-8901', villas: 12, units: 360, mrr: 600000, joinedAt: '2025-07-01', status: '활성' as const },
  { id: 'adm-005', name: '최동욱', phone: '010-5678-9012', villas: 2, units: 48, mrr: 100000, joinedAt: '2026-01-15', status: '결제실패' as const },
];

const STATUS_STYLE: Record<string, string> = {
  '활성': 'bg-okL text-ok',
  '미정산': 'bg-warnL text-warn',
  '결제실패': 'bg-errL text-err',
};

const totalAdmins = ADMINS.length;
const totalVillas = ADMINS.reduce((s, a) => s + a.villas, 0);
const avgVillas = (totalVillas / totalAdmins).toFixed(1);

export default function AdminsPage() {
  return (
    <div>
      <h2 className="text-lg font-bold mb-5">관리자 관리</h2>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 관리자', value: `${totalAdmins}명`, color: 'text-pri' },
          { label: '총 빌라', value: `${totalVillas}개`, color: 'text-ok' },
          { label: '평균 빌라/관리자', value: avgVillas, color: 'text-[#4DA6FF]' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">관리자 목록</h3>
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
              {ADMINS.map((a) => (
                <Link key={a.id} href={`/admins/${a.id}`} legacyBehavior>
                  <tr className="border-b border-border last:border-0 hover:bg-white/[.03] cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-t1">{a.name}</td>
                    <td className="px-5 py-3.5 text-t2">{a.phone}</td>
                    <td className="px-5 py-3.5 text-right text-t2">{a.villas}</td>
                    <td className="px-5 py-3.5 text-right text-t2">{a.units}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{a.mrr.toLocaleString()}원</td>
                    <td className="px-5 py-3.5 text-t3">{a.joinedAt}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
