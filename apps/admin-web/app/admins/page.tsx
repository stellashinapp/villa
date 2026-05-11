import { createServerClient } from '@/lib/supabase-server';
import AdminsTable, { type AdminRow } from './AdminsTable';

type RawAdmin = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  villas: { id: string; name: string }[] | null;
  subscriptions: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
    subscription_items: { plan: string; price: number }[] | null;
  }[] | null;
};

function formatPhone(p: string | null) {
  const digits = (p ?? '').replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return p ?? '';
}

function volumeDiscount(count: number) {
  if (count >= 10) return 0.15;
  if (count >= 5) return 0.1;
  if (count >= 3) return 0.05;
  return 0;
}

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const supabase = createServerClient();

  const { data: admins, error } = await supabase
    .from('admins')
    .select(`
      id, name, email, phone, created_at,
      villas ( id, name ),
      subscriptions ( status, subscription_items ( plan, price ) )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">관리자 관리</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rawRows = (admins ?? []) as RawAdmin[];

  // 세대수 합계용 — units 별도 카운트
  const adminIds = rawRows.map(a => a.id);
  let unitsByAdmin = new Map<string, number>();
  if (adminIds.length > 0) {
    const { data: units } = await supabase
      .from('units')
      .select('id, villas!inner(admin_id)');
    (units ?? []).forEach((u: unknown) => {
      const adminId = (u as { villas: { admin_id: string } }).villas.admin_id;
      unitsByAdmin.set(adminId, (unitsByAdmin.get(adminId) ?? 0) + 1);
    });
  }

  const enriched: AdminRow[] = rawRows.map((a) => {
    const villaCount = a.villas?.length ?? 0;
    const unitsCount = unitsByAdmin.get(a.id) ?? 0;
    const sub = a.subscriptions?.[0];
    const items = sub?.subscription_items ?? [];
    const baseAmount = items.reduce((s, it) => s + (it.price ?? 0), 0);
    const mrr = Math.round(baseAmount * (1 - volumeDiscount(items.length)));
    const status = sub?.status ?? 'none';
    return {
      id: a.id,
      name: a.name ?? a.email,
      email: a.email,
      phone: formatPhone(a.phone),
      villas: villaCount,
      units: unitsCount,
      mrr,
      joinedAt: new Date(a.created_at).toISOString().slice(0, 10),
      status,
      villaNames: (a.villas ?? []).map(v => v.name),
    };
  });

  const totalAdmins = enriched.length;
  const totalVillas = enriched.reduce((s, a) => s + a.villas, 0);
  const avgVillas = totalAdmins > 0 ? (totalVillas / totalAdmins).toFixed(1) : '0.0';

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">관리자 관리</h2>

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

      <AdminsTable rows={enriched} />
    </div>
  );
}
