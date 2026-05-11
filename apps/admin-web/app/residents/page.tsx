import { createServerClient } from '@/lib/supabase-server';
import ResidentsTable, { type ResidentRow } from './ResidentsTable';

type Row = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'moved_out';
  unit_id: string | null;
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

// '101' 또는 '101호' 가 섞여 들어와도 '101호' 로 통일
function normalizeHo(raw: string | null | undefined): string {
  if (!raw) return '-';
  const s = String(raw).trim();
  if (!s) return '-';
  return s.endsWith('호') ? s : `${s}호`;
}

export default async function ResidentsPage() {
  const supabase = createServerClient();

  const { data: residents, error } = await supabase
    .from('residents')
    .select(`
      id, name, phone, status, unit_id,
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

  // 납부 상태 계산 (최신 bill_month 기준)
  let paidIds = new Set<string>();
  const ids = rows.map(r => r.id);
  if (ids.length > 0) {
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('unit_id, is_paid, bill_months!inner ( year_month )')
      .order('bill_months(year_month)', { ascending: false });

    const latestPaidByUnit = new Map<string, boolean>();
    (recentPayments ?? []).forEach((p: unknown) => {
      const row = p as { unit_id: string; is_paid: boolean };
      if (!latestPaidByUnit.has(row.unit_id)) {
        latestPaidByUnit.set(row.unit_id, row.is_paid);
      }
    });

    rows.forEach(r => {
      if (r.unit_id && latestPaidByUnit.get(r.unit_id)) paidIds.add(r.id);
    });
  }

  const active = rows.filter(r => r.status === 'active');
  const total = active.length;
  const paid = active.filter(r => paidIds.has(r.id)).length;
  const unpaid = total - paid;

  const tableRows: ResidentRow[] = active.map(r => ({
    id: r.id,
    name: r.name,
    phone: formatPhone(r.phone),
    villaName: r.units?.villas?.name ?? '-',
    adminLabel: r.units?.villas?.admins?.name ?? r.units?.villas?.admins?.email ?? '-',
    ho: normalizeHo(r.units?.ho_number),
    isPaid: paidIds.has(r.id),
  }));

  // 빌라 필터 옵션 (active 거주민 기준, 중복 제거)
  const villaOptions = Array.from(new Set(tableRows.map(r => r.villaName).filter(v => v && v !== '-'))).sort();

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">입주민</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 입주민', value: `${total}명`, color: 'text-pri' },
          { label: '이번달 납부', value: `${paid}명`, color: 'text-ok' },
          { label: '미납', value: `${unpaid}명`, color: 'text-err' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <ResidentsTable rows={tableRows} villaOptions={villaOptions} />
    </div>
  );
}
