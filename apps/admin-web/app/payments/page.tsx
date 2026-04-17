export default function PaymentsPage() {
  const PAYMENTS = [
    { id: 1, date: '2026-04-15', admin: '김철수', desc: '4월 구독료 (3 빌라)', amount: 150000, method: '카드 자동결제', status: '성공' as const },
    { id: 2, date: '2026-04-15', admin: '박영희', desc: '4월 구독료 (7 빌라)', amount: 280000, method: '카드 자동결제', status: '성공' as const },
    { id: 3, date: '2026-04-15', admin: '이민호', desc: '4월 구독료 (1 빌라)', amount: 30000, method: '카드 자동결제', status: '실패' as const },
    { id: 4, date: '2026-04-15', admin: '정수진', desc: '4월 구독료 (12 빌라)', amount: 600000, method: '카드 자동결제', status: '성공' as const },
    { id: 5, date: '2026-04-15', admin: '최동욱', desc: '4월 구독료 (2 빌라)', amount: 100000, method: '카드 자동결제', status: '실패' as const },
    { id: 6, date: '2026-03-15', admin: '김철수', desc: '3월 구독료 (3 빌라)', amount: 150000, method: '카드 자동결제', status: '성공' as const },
    { id: 7, date: '2026-03-15', admin: '박영희', desc: '3월 구독료 (7 빌라)', amount: 280000, method: '카드 자동결제', status: '성공' as const },
    { id: 8, date: '2026-03-15', admin: '정수진', desc: '3월 구독료 (12 빌라)', amount: 600000, method: '카드 자동결제', status: '성공' as const },
    { id: 9, date: '2026-03-15', admin: '이민호', desc: '3월 구독료 (1 빌라)', amount: 30000, method: '계좌이체', status: '성공' as const },
    { id: 10, date: '2026-03-15', admin: '최동욱', desc: '3월 구독료 (2 빌라)', amount: 100000, method: '카드 자동결제', status: '성공' as const },
  ];

  const successPayments = PAYMENTS.filter((p) => p.status === '성공');
  const failPayments = PAYMENTS.filter((p) => p.status === '실패');
  const successAmount = successPayments.reduce((s, p) => s + p.amount, 0);
  const failAmount = failPayments.reduce((s, p) => s + p.amount, 0);
  const successRate = ((successPayments.length / PAYMENTS.length) * 100).toFixed(1);

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">결제 내역</h2>

      {/* KPI */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: '결제 성공 금액', value: `${successAmount.toLocaleString()}원`, color: 'text-ok' },
          { label: '성공 건수', value: `${successPayments.length}건`, color: 'text-ok' },
          { label: '결제 실패 금액', value: `${failAmount.toLocaleString()}원`, color: 'text-err' },
          { label: '실패 건수', value: `${failPayments.length}건`, color: 'text-err' },
          { label: '성공률', value: `${successRate}%`, color: 'text-pri' },
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
          <h3 className="text-sm font-bold">결제 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">결제일</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">내역</th>
                <th className="text-right px-5 py-3 font-medium">금액</th>
                <th className="text-left px-5 py-3 font-medium">결제수단</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 text-t2">{p.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-t1">{p.admin}</td>
                  <td className="px-5 py-3.5 text-t2">{p.desc}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{p.amount.toLocaleString()}원</td>
                  <td className="px-5 py-3.5 text-t3">{p.method}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === '성공' ? 'bg-okL text-ok' : 'bg-errL text-err'
                    }`}>
                      {p.status}
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
