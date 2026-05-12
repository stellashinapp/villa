import { createServerClient } from '@/lib/supabase-server';
import { getViewerEmail, canRevealPII, isSuperAdmin } from '@/lib/auth-context';
import { logAdminAccess } from '@/lib/access-log';
import { maskName, maskPhone, maskEmail } from '@/lib/mask';
import AdminsTable, { type AdminRow } from './AdminsTable';
import RevealToggle from '../residents/RevealToggle';

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

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ reveal?: string }>;
}) {
  const sp = await searchParams;
  const viewer = await getViewerEmail();
  const reveal = canRevealPII(viewer, sp.reveal);
  const superAdmin = isSuperAdmin(viewer);

  await logAdminAccess({
    path: '/admins',
    viewerEmail: viewer,
    payload: { reveal },
  });

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
    const displayName = a.name ?? a.email;
    return {
      id: a.id,
      name: reveal ? displayName : (a.name ? maskName(a.name) : maskEmail(a.email)),
      email: reveal ? a.email : maskEmail(a.email),
      phone: reveal ? formatPhone(a.phone) : maskPhone(a.phone),
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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">관리자 관리</h2>
        <RevealToggle reveal={reveal} canReveal={superAdmin} />
      </div>

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

      <div className="bg-priL/40 border border-pri/20 text-priT rounded-[10px] px-4 py-2.5 mb-4 text-xs">
        {reveal
          ? '🔓 PII 풀 노출 모드. 모든 열람은 1년 이상 보관되는 접근로그에 기록됩니다.'
          : '🔒 관리자 이름·이메일·연락처는 마스킹 처리됩니다. 슈퍼관리자는 우측 토글로 풀 노출 가능.'}
      </div>

      <AdminsTable rows={enriched} />
    </div>
  );
}
