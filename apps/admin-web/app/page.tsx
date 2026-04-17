export default function DashboardPage() {
  return (
    <div>
      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '총 관리자', value: '-', color: 'pri' },
          { label: '등록 빌라', value: '-', color: 'ok' },
          { label: '총 세대', value: '-', color: 'blue-400' },
          { label: 'MRR', value: '-', color: 'warn' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-[10px] p-5 relative overflow-hidden"
          >
            <div className="text-xs text-t3 font-medium mb-2">{kpi.label}</div>
            <div className="text-2xl font-extrabold tracking-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* MRR 차트 + 플랜 분포 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-card border border-border rounded-[10px] p-5">
          <h4 className="text-sm font-bold text-t2 mb-4">MRR 추이</h4>
          <div className="h-[220px] flex items-center justify-center text-t3 text-sm">
            {/* TODO: Chart.js 또는 Recharts 연동 */}
            차트 영역
          </div>
        </div>
        <div className="bg-card border border-border rounded-[10px] p-5">
          <h4 className="text-sm font-bold text-t2 mb-4">플랜 분포</h4>
          <div className="h-[220px] flex items-center justify-center text-t3 text-sm">
            {/* TODO: 도넛 차트 */}
            차트 영역
          </div>
        </div>
      </div>

      {/* 주의 항목 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">⚠️ 주의 항목</h3>
        </div>
        <div className="p-5 text-center text-t3 text-sm">
          데이터 연동 후 표시됩니다
        </div>
      </div>
    </div>
  );
}
