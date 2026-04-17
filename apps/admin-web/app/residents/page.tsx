export default function ResidentsPage() {
  const RESIDENTS = [
    { id: 1, name: '홍길동', phone: '010-1111-2222', villa: '선릉 파크빌', room: '101호', admin: '김철수', status: '납부' as const },
    { id: 2, name: '김나영', phone: '010-2222-3333', villa: '선릉 파크빌', room: '202호', admin: '김철수', status: '납부' as const },
    { id: 3, name: '이준혁', phone: '010-3333-4444', villa: '역삼 그린빌', room: '305호', admin: '김철수', status: '미납' as const },
    { id: 4, name: '박서연', phone: '010-4444-5555', villa: '강남 힐스테이트', room: '501호', admin: '박영희', status: '납부' as const },
    { id: 5, name: '최현우', phone: '010-5555-6666', villa: '잠실 레이크빌', room: '102호', admin: '박영희', status: '납부' as const },
    { id: 6, name: '정민지', phone: '010-6666-7777', villa: '서초 브라운빌', room: '401호', admin: '박영희', status: '미납' as const },
    { id: 7, name: '강도윤', phone: '010-7777-8888', villa: '성북 아트빌', room: '203호', admin: '이민호', status: '납부' as const },
    { id: 8, name: '윤서준', phone: '010-8888-9999', villa: '노원 스카이', room: '702호', admin: '정수진', status: '납부' as const },
    { id: 9, name: '장하은', phone: '010-9999-0000', villa: '마포 하늘빌', room: '303호', admin: '박영희', status: '미납' as const },
    { id: 10, name: '오지호', phone: '010-0000-1111', villa: '용산 센트럴', room: '604호', admin: '박영희', status: '납부' as const },
  ];

  const total = RESIDENTS.length;
  const paid = RESIDENTS.filter((r) => r.status === '납부').length;
  const unpaid = total - paid;

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">입주민</h2>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 입주민', value: `${total}명`, color: 'text-pri' },
          { label: '관리비 납부', value: `${paid}명`, color: 'text-ok' },
          { label: '미납', value: `${unpaid}명`, color: 'text-err' },
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
          <h3 className="text-sm font-bold">입주민 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">이름</th>
                <th className="text-left px-5 py-3 font-medium">전화번호</th>
                <th className="text-left px-5 py-3 font-medium">빌라</th>
                <th className="text-left px-5 py-3 font-medium">호실</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">관리비 상태</th>
              </tr>
            </thead>
            <tbody>
              {RESIDENTS.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-t1">{r.name}</td>
                  <td className="px-5 py-3.5 text-t2">{r.phone}</td>
                  <td className="px-5 py-3.5 text-t2">{r.villa}</td>
                  <td className="px-5 py-3.5 text-t2">{r.room}</td>
                  <td className="px-5 py-3.5 text-t2">{r.admin}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.status === '납부' ? 'bg-okL text-ok' : 'bg-errL text-err'
                    }`}>
                      {r.status}
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
