import { createServerClient } from '@/lib/supabase-server';

type Row = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'moved_out';
  units: {
    ho_number: string;
    villas: {
      name: string;
      admins: { name: string | null; email: string } | null;
    } | null;
  } | null;
};

export const dynamic = 'force-dynamic';

function formatPhone(p: string) {
  const digits = (p ?? '').replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return p;
}

export default async function ResidentsPage() {
  const supabase = createServerClient();

  const { data: residents, error } = await supabase
    .from('residents')
    .select(`
      id, name, phone, status,
      units:unit_id (
        ho_number,
        villas:villa_id (
          name,
          admins:admin_id ( name, email )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(500)
    .returns<Row[]>();

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">입주민</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rows = residents ?? [];

  const ids = rows.map((r) => r.id);
  let paidIds = new Set<string>();
  if (ids.length > 0) {
    const { data: recentPayments } = await supabase
      .from('payments')
      .select(`
        unit_id,
        is_paid,
        bill_months!inner ( year_month )
      `)
      .order('bill_months(year_month)', { ascending: false });

    const latestPaidByUnit = new Map<string, boolean>();
    (recentPayments ?? []).forEach((p) => {
      if (!latestPaidByUnit.has(p.unit_id)) {
        latestPaidByUnit.set(p.unit_id, p.is_paid);
      }
    });

    rows.forEach((r) => {
      const unitId = (r as unknown as { unit_id?: string }).unit_id;
      if (unitId && latestPaidByUnit.get(unitId)) paidIds.add(r.id);
    });
  }

  const active = rows.filter((r) => r.status === 'active');
  const total = active.length;
  const paid = active.filter((r) => paidIds.has(r.id)).length;
  const unpaid = total - paid;

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">입주민</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 입주민', value: `${total}명`, color: 'text-pri' },
          { label: '이번달 납부', value: `${paid}명`, color: 'text-ok' },
          { label: '미납', value: `${unpaid}명`, color: 'text-err' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">입주민 목록 (최근 500명)</h3>
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
              {active.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-t3">등록된 입주민이 없습니다</td></tr>
              ) : (
                active.map((r) => {
                  const villa = r.units?.villas?.name ?? '-';
                  const admin = r.units?.villas?.admins?.name ?? r.units?.villas?.admins?.email ?? '-';
                  const room = r.units?.ho_number ?? '-';
                  const isPaid = paidIds.has(r.id);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-t1">{r.name}</td>
                      <td className="px-5 py-3.5 text-t2">{formatPhone(r.phone)}</td>
                      <td className="px-5 py-3.5 text-t2">{villa}</td>
                      <td className="px-5 py-3.5 text-t2">{room}호</td>
                      <td className="px-5 py-3.5 text-t2">{admin}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-okL text-ok' : 'bg-errL text-err'}`}>
                          {isPaid ? '납부' : '미납'}
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
    </div>
  );
}
