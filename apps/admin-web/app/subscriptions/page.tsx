import { createServerClient } from '@/lib/supabase-server';

type SubRow = {
  id: string;
  admin_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
  billing_key: string | null;
  card_brand: string | null;
  card_last4: string | null;
  card_expiry_year: number | null;
  card_expiry_month: number | null;
  billing_day: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  admins: { name: string | null; email: string } | null;
  subscription_items: { id: string; plan: string; price: number }[] | null;
};

function cardExpiryDaysLeft(year: number | null, month: number | null): number | null {
  if (!year || !month) return null;
  const expiry = new Date(year, month, 0, 23, 59, 59);
  const diff = expiry.getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

type PaymentRow = {
  id: string;
  subscription_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
};

const STATUS_STYLE: Record<SubRow['status'], { label: string; cls: string }> = {
  trialing: { label: '무료체험', cls: 'bg-priL text-priT' },
  active: { label: '활성', cls: 'bg-okL text-ok' },
  past_due: { label: '결제실패', cls: 'bg-errL text-err' },
  pending_cancel: { label: '해지예정', cls: 'bg-warnL text-warn' },
  cancelled: { label: '해지됨', cls: 'bg-bg text-t3' },
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function volumeDiscount(villaCount: number): number {
  if (villaCount >= 10) return 0.15;
  if (villaCount >= 5) return 0.1;
  if (villaCount >= 3) return 0.05;
  return 0;
}

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const supabase = createServerClient();

  const [{ data: subs }, { data: payments }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select(`
        id, admin_id, status, billing_key, card_brand, card_last4,
        card_expiry_year, card_expiry_month, billing_day,
        trial_ends_at, current_period_end, created_at,
        admins:admin_id ( name, email ),
        subscription_items ( id, plan, price )
      `)
      .returns<SubRow[]>(),
    supabase
      .from('subscription_payments')
      .select('id, subscription_id, amount, status, created_at')
      .eq('status', 'success')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .returns<PaymentRow[]>(),
  ]);

  const subsRows = subs ?? [];
  const paymentRows = payments ?? [];

  const monthlyMap = new Map<string, number>();
  for (const p of paymentRows) {
    const key = monthKey(new Date(p.created_at));
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.amount);
  }

  const months: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }

  const trend = months.map((m, idx) => {
    const mrr = monthlyMap.get(m) ?? 0;
    const prev = idx > 0 ? monthlyMap.get(months[idx - 1]) ?? 0 : 0;
    const change = prev > 0 ? (((mrr - prev) / prev) * 100).toFixed(1) : null;
    return { month: m, mrr, change };
  });

  const currentMrr = trend[trend.length - 1]?.mrr ?? 0;
  const activeCount = subsRows.filter((s) => s.status === 'active').length;
  const totalVillaSubs = subsRows.reduce((s, a) => s + (a.subscription_items?.length ?? 0), 0);
  const arpu = subsRows.length > 0 ? Math.round(currentMrr / subsRows.length) : 0;

  const expiringSoon = subsRows
    .map((s) => ({ sub: s, daysLeft: cardExpiryDaysLeft(s.card_expiry_year, s.card_expiry_month) }))
    .filter((x) => x.daysLeft !== null && x.daysLeft >= 0 && x.daysLeft <= 30)
    .sort((a, b) => (a.daysLeft! - b.daysLeft!));

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">구독 / 매출</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '이번달 MRR', value: `${currentMrr.toLocaleString()}원`, color: 'text-pri' },
          { label: '활성 구독', value: `${activeCount}건`, color: 'text-ok' },
          { label: '빌라 구독건', value: `${totalVillaSubs}건`, color: 'text-[#4DA6FF]' },
          { label: 'ARPU', value: `${arpu.toLocaleString()}원`, color: 'text-warn' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <div className="bg-warnL border border-warn/30 rounded-[10px] p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-warn font-bold text-sm">⚠️ 카드 만료 임박 ({expiringSoon.length}건)</span>
          </div>
          <div className="space-y-1.5">
            {expiringSoon.slice(0, 5).map(({ sub, daysLeft }) => (
              <div key={sub.id} className="flex items-center justify-between text-xs">
                <span className="text-t1 font-semibold">
                  {sub.admins?.name ?? sub.admins?.email ?? '-'}
                </span>
                <span className="text-t3">
                  {sub.card_brand ? `${sub.card_brand} ····${sub.card_last4}` : '-'}
                  {' · '}
                  <span className={daysLeft! <= 7 ? 'text-err font-bold' : 'text-warn font-bold'}>
                    D-{daysLeft}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">MRR 월별 추이 (최근 7개월)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">월</th>
                <th className="text-right px-5 py-3 font-medium">MRR</th>
                <th className="text-right px-5 py-3 font-medium">전월대비</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((r) => (
                <tr key={r.month} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-semibold text-t1">{r.month}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{r.mrr.toLocaleString()}원</td>
                  <td className="px-5 py-3.5 text-right">
                    {r.change !== null ? (
                      <span className={parseFloat(r.change) >= 0 ? 'text-ok' : 'text-err'}>
                        {parseFloat(r.change) >= 0 ? '+' : ''}{r.change}%
                      </span>
                    ) : (
                      <span className="text-t3">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                <th className="text-left px-5 py-3 font-medium">카드</th>
                <th className="text-left px-5 py-3 font-medium">만료</th>
                <th className="text-right px-5 py-3 font-medium">월 금액</th>
                <th className="text-left px-5 py-3 font-medium">결제일</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {subsRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-t3">
                    아직 등록된 구독이 없습니다
                  </td>
                </tr>
              ) : (
                subsRows.map((s) => {
                  const items = s.subscription_items ?? [];
                  const baseAmount = items.reduce((sum, it) => sum + (it.price ?? 0), 0);
                  const amount = Math.round(baseAmount * (1 - volumeDiscount(items.length)));
                  const st = STATUS_STYLE[s.status];
                  const daysLeft = cardExpiryDaysLeft(s.card_expiry_year, s.card_expiry_month);
                  const expiryLabel = s.card_expiry_year && s.card_expiry_month
                    ? `${String(s.card_expiry_month).padStart(2, '0')}/${String(s.card_expiry_year).slice(-2)}`
                    : '-';
                  const expiryCls = daysLeft === null
                    ? 'text-t3'
                    : daysLeft < 0
                      ? 'text-err font-bold'
                      : daysLeft <= 7
                        ? 'text-err font-bold'
                        : daysLeft <= 30
                          ? 'text-warn font-bold'
                          : 'text-t2';
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-t1">
                        {s.admins?.name ?? s.admins?.email ?? '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-t2">{items.length}</td>
                      <td className="px-5 py-3.5 text-t3 text-xs">
                        {s.card_brand ? `${s.card_brand} ···· ${s.card_last4 ?? ''}` : '미등록'}
                      </td>
                      <td className={`px-5 py-3.5 text-xs ${expiryCls}`}>
                        {expiryLabel}
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                          <span className="ml-1">(D-{daysLeft})</span>
                        )}
                        {daysLeft !== null && daysLeft < 0 && (
                          <span className="ml-1">(만료)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold">{amount.toLocaleString()}원</td>
                      <td className="px-5 py-3.5 text-t3">매월 {s.billing_day}일</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                          {st.label}
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
