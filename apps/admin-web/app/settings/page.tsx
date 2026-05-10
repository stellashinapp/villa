export default function SettingsPage() {
  const PLANS = [
    { name: '소형', price: '30,000원', desc: '20세대 이하', color: 'text-ok' },
    { name: '중형', price: '50,000원', desc: '21~50세대', color: 'text-pri' },
    { name: '대형', price: '70,000원', desc: '51세대 이상', color: 'text-warn' },
  ];

  const DISCOUNTS = [
    { range: '5~9개', rate: '20%' },
    { range: '10~19개', rate: '30%' },
    { range: '20개 이상', rate: '40%' },
  ];

  const SYSTEM_INFO = [
    { label: '앱 버전', value: 'v2.4.1 (2026-04-10)' },
    { label: 'DB', value: 'Supabase PostgreSQL (ap-northeast-2)' },
    { label: '호스팅', value: 'Vercel (Pro Plan)' },
    { label: '푸시', value: 'Firebase Cloud Messaging' },
    { label: 'PG', value: 'Toss Payments' },
    { label: '도메인', value: 'admin.andnew.kr' },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">설정</h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Price Settings */}
        <div className="bg-card border border-border rounded-[10px] p-6">
          <h3 className="text-sm font-bold mb-4">요금제 설정</h3>
          <div className="space-y-3">
            {PLANS.map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
                <div>
                  <span className={`font-bold text-sm ${p.color}`}>{p.name}</span>
                  <span className="text-xs text-t3 ml-2">{p.desc}</span>
                </div>
                <span className="text-sm font-bold text-t1">{p.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Discount */}
        <div className="bg-card border border-border rounded-[10px] p-6">
          <h3 className="text-sm font-bold mb-4">볼륨 할인</h3>
          <div className="space-y-3">
            {DISCOUNTS.map((d) => (
              <div key={d.range} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
                <span className="text-sm text-t2">빌라 {d.range}</span>
                <span className="text-sm font-bold text-ok">{d.rate}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-t3 mt-3">* 동일 관리자가 관리하는 빌라 수 기준 적용</p>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-card border border-border rounded-[10px] p-6">
        <h3 className="text-sm font-bold mb-4">시스템 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          {SYSTEM_INFO.map((info) => (
            <div key={info.label} className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
              <span className="text-sm text-t3 font-medium">{info.label}</span>
              <span className="text-sm text-t1">{info.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
