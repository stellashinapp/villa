import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';

type AdminRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  villas: { id: string }[] | null;
  subscriptions: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
    subscription_items: { plan: string; price: number }[] | null;
  }[] | null;
};

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  trialing: { label: '무료체험', cls: 'bg-priL text-priT' },
  active: { label: '활성', cls: 'bg-okL text-ok' },
  past_due: { label: '결제실패', cls: 'bg-errL text-err' },
  pending_cancel: { label: '해지예정', cls: 'bg-warnL text-warn' },
  cancelled: { label: '해지됨', cls: 'bg-white/10 text-t3' },
  none: { label: '미가입', cls: 'bg-white/10 text-t3' },
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
      villas ( id ),
      subscriptions ( status, subscription_items ( plan, price ) )
    `)
    .order('created_at', { ascending: false })
    .returns<AdminRow[]>();

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

  const rows = admins ?? [];

  const adminIds = rows.map((a) => a.id);
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

  const enriched = rows.map((a) => {
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
      phone: formatPhone(a.phone),
      villas: villaCount,
      units: unitsCount,
      mrr,
      joinedAt: new Date(a.created_at).toISOString().slice(0, 10),
      status,
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
              {enriched.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-t3">
                    아직 가입한 관리자가 없습니다
                  </td>
                </tr>
              ) : (
                enriched.map((a) => {
                  const st = STATUS_STYLE[a.status];
                  return (
                    <Link key={a.id} href={`/admins/${a.id}`} legacyBehavior>
                      <tr className="border-b border-border last:border-0 hover:bg-white/[.03] cursor-pointer transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-t1">{a.name}</td>
                        <td className="px-5 py-3.5 text-t2">{a.phone || '-'}</td>
                        <td className="px-5 py-3.5 text-right text-t2">{a.villas}</td>
                        <td className="px-5 py-3.5 text-right text-t2">{a.units}</td>
                        <td className="px-5 py-3.5 text-right font-semibold">{a.mrr.toLocaleString()}원</td>
                        <td className="px-5 py-3.5 text-t3">{a.joinedAt}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    </Link>
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
