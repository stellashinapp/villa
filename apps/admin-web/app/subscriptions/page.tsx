'use client';

const MRR_DATA = [
  { month: '2025-10', mrr: 420000, change: null, admins: 3, villas: 8, newSubs: 3, churned: 0 },
  { month: '2025-11', mrr: 480000, change: '+14.3%', admins: 4, villas: 10, newSubs: 2, churned: 0 },
  { month: '2025-12', mrr: 530000, change: '+10.4%', admins: 4, villas: 11, newSubs: 1, churned: 0 },
  { month: '2026-01', mrr: 680000, change: '+28.3%', admins: 5, villas: 15, newSubs: 4, churned: 0 },
  { month: '2026-02', mrr: 750000, change: '+10.3%', admins: 5, villas: 17, newSubs: 2, churned: 0 },
  { month: '2026-03', mrr: 820000, change: '+9.3%', admins: 5, villas: 19, newSubs: 3, churned: 1 },
  { month: '2026-04', mrr: 880000, change: '+7.3%', admins: 5, villas: 20, newSubs: 2, churned: 1 },
];

const ADMIN_SUBS = [
  { admin: '김철수', villas: 3, plan: '혼합', amount: 150000, status: '활성' },
  { admin: '박영희', villas: 7, plan: '혼합', amount: 280000, status: '활성' },
  { admin: '이민호', villas: 1, plan: '소형', amount: 30000, status: '미정산' },
  { admin: '정수진', villas: 12, plan: '혼합', amount: 600000, status: '활성' },
  { admin: '최동욱', villas: 2, plan: '인기', amount: 100000, status: '결제실패' },
];

const STATUS_STYLE: Record<string, string> = {
  '활성': 'bg-okL text-ok',
  '미정산': 'bg-warnL text-warn',
  '결제실패': 'bg-errL text-err',
};

const currentMrr = MRR_DATA[MRR_DATA.length - 1];
const activeSubs = ADMIN_SUBS.filter((s) => s.status === '활성').length;
const totalVillaSubs = ADMIN_SUBS.reduce((s, a) => s + a.villas, 0);
const arpu = Math.round(currentMrr.mrr / ADMIN_SUBS.length);

function downloadCSV() {
  const header = '월,MRR,전월대비,관리자수,빌라수,신규,해지\n';
  const rows = MRR_DATA.map((r) =>
    `${r.month},${r.mrr},${r.change ?? '-'},${r.admins},${r.villas},${r.newSubs},${r.churned}`
  ).join('\n');
  const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mrr_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SubscriptionsPage() {
  return (
    <div>
      <h2 className="text-lg font-bold mb-5">구독 / 매출</h2>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '이번달 MRR', value: `${currentMrr.mrr.toLocaleString()}원`, color: 'text-pri' },
          { label: '활성 구독', value: `${activeSubs}건`, color: 'text-ok' },
          { label: '빌라 구독건', value: `${totalVillaSubs}건`, color: 'text-[#4DA6FF]' },
          { label: 'ARPU', value: `${arpu.toLocaleString()}원`, color: 'text-warn' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* MRR Monthly Trend */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">MRR 월별 추이</h3>
          <button
            onClick={downloadCSV}
            className="px-3.5 py-1.5 bg-pri/10 text-pri text-xs font-semibold rounded-lg hover:bg-pri/20 transition-colors"
          >
            CSV 다운로드
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">월</th>
                <th className="text-right px-5 py-3 font-medium">MRR</th>
                <th className="text-right px-5 py-3 font-medium">전월대비</th>
                <th className="text-right px-5 py-3 font-medium">관리자수</th>
                <th className="text-right px-5 py-3 font-medium">빌라수</th>
                <th className="text-right px-5 py-3 font-medium">신규</th>
                <th className="text-right px-5 py-3 font-medium">해지</th>
              </tr>
            </thead>
            <tbody>
              {MRR_DATA.map((r) => (
                <tr key={r.month} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-t1">{r.month}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{r.mrr.toLocaleString()}원</td>
                  <td className="px-5 py-3.5 text-right">
                    {r.change ? (
                      <span className={r.change.startsWith('+') ? 'text-ok' : 'text-err'}>{r.change}</span>
                    ) : (
                      <span className="text-t3">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-t2">{r.admins}</td>
                  <td className="px-5 py-3.5 text-right text-t2">{r.villas}</td>
                  <td className="px-5 py-3.5 text-right text-ok">{r.newSubs}</td>
                  <td className="px-5 py-3.5 text-right text-err">{r.churned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Subscriptions */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">관리자별 구독 상세</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-right px-5 py-3 font-medium">빌라수</th>
                <th className="text-left px-5 py-3 font-medium">플랜</th>
                <th className="text-right px-5 py-3 font-medium">월 금액</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_SUBS.map((a) => (
                <tr key={a.admin} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-t1">{a.admin}</td>
                  <td className="px-5 py-3.5 text-right text-t2">{a.villas}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-priL text-priT">{a.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">{a.amount.toLocaleString()}원</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
