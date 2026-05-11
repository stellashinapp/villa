import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type SubRow = {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
  card_expiry_year: number | null;
  card_expiry_month: number | null;
  subscription_items: { plan: string; price: number }[] | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
  subscription_id: string;
};

type VillaRow = { id: string; total_units: number; status: string };

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(ym: string) {
  return `${ym.slice(0, 4).slice(2)}.${ym.slice(5)}`;
}

const PLAN_KO: Record<string, string> = { small: '소형', medium: '중형', large: '대형', popular: '중형' };
const PLAN_COLOR: Record<string, string> = {
  small: 'bg-[#4263E8]',
  medium: 'bg-[#22C55E]',
  large: 'bg-[#F59E0B]',
  popular: 'bg-[#22C55E]',
};

export default async function DashboardPage() {
  const supabase = createServerClient();

  const sinceISO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: adminsCount },
    { data: villas },
    { data: subs },
    { data: payments },
    { data: recentSignupAdmins },
  ] = await Promise.all([
    supabase.from('admins').select('id', { count: 'exact', head: true }),
    supabase
      .from('villas')
      .select('id, total_units, status')
      .returns<VillaRow[]>(),
    supabase
      .from('subscriptions')
      .select('id, status, card_expiry_year, card_expiry_month, subscription_items ( plan, price )')
      .returns<SubRow[]>(),
    supabase
      .from('subscription_payments')
      .select('id, amount, status, created_at, subscription_id')
      .gte('created_at', sinceISO)
      .returns<PaymentRow[]>(),
    supabase
      .from('admins')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const activeVillas = (villas ?? []).filter(v => v.status === 'active');
  const villaCount = activeVillas.length;
  const totalUnits = activeVillas.reduce((s, v) => s + (v.total_units ?? 0), 0);

  const subsRows = subs ?? [];
  const activeSubsCount = subsRows.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const pastDueCount = subsRows.filter(s => s.status === 'past_due').length;

  // 월별 MRR (최근 7개월) — subscription_payments 성공분만 집계
  const successPayments = (payments ?? []).filter(p => p.status === 'success');
  const monthlyMap = new Map<string, number>();
  for (const p of successPayments) {
    const k = monthKey(new Date(p.created_at));
    monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + (p.amount ?? 0));
  }
  const now = new Date();
  const months: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  const trend = months.map(m => ({ month: m, mrr: monthlyMap.get(m) ?? 0 }));
  const currentMrr = trend[trend.length - 1]?.mrr ?? 0;
  const prevMrr = trend[trend.length - 2]?.mrr ?? 0;
  const mrrChange = prevMrr > 0 ? ((currentMrr - prevMrr) / prevMrr) * 100 : null;
  const maxMrr = Math.max(...trend.map(t => t.mrr), 1);

  // 플랜 분포 — subscription_items grouped by plan
  const planCount = new Map<string, number>();
  for (const s of subsRows) {
    for (const item of (s.subscription_items ?? [])) {
      planCount.set(item.plan, (planCount.get(item.plan) ?? 0) + 1);
    }
  }
  const planEntries = Array.from(planCount.entries()).sort((a, b) => b[1] - a[1]);
  const totalPlanItems = planEntries.reduce((s, [, c]) => s + c, 0) || 1;

  // 결제 실패 최근 7건
  const failedRecent = (payments ?? [])
    .filter(p => p.status === 'failed')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  // 카드 만료 임박 (30일 이내)
  function daysToCardExpiry(y: number | null, m: number | null) {
    if (!y || !m) return null;
    const expiry = new Date(y, m, 0, 23, 59, 59);
    return Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }
  const expiringSoon = subsRows
    .map(s => ({ s, d: daysToCardExpiry(s.card_expiry_year, s.card_expiry_month) }))
    .filter(x => x.d !== null && x.d >= 0 && x.d <= 30)
    .sort((a, b) => a.d! - b.d!)
    .slice(0, 5);

  const kpis = [
    { label: '총 관리자', value: `${adminsCount ?? 0}명`, hint: `최근 가입 ${recentSignupAdmins?.length ?? 0}건`, color: 'text-pri' },
    { label: '등록 빌라', value: `${villaCount}개`, hint: `세대 합 ${totalUnits}`, color: 'text-ok' },
    { label: '활성 구독', value: `${activeSubsCount}건`, hint: pastDueCount > 0 ? `결제실패 ${pastDueCount}건` : '결제 정상', color: 'text-[#4DA6FF]' },
    {
      label: '이번달 MRR',
      value: `${currentMrr.toLocaleString()}원`,
      hint: mrrChange !== null
        ? `${mrrChange >= 0 ? '+' : ''}${mrrChange.toFixed(1)}% MoM`
        : '전월 데이터 없음',
      color: 'text-warn',
    },
  ];

  return (
    <div>
      {/* KPI 4개 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold tracking-tight ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-t3 mt-1">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* MRR 추이 + 플랜 분포 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-card border border-border rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-t2">MRR 추이 (최근 7개월)</h4>
            <Link href="/subscriptions" className="text-xs text-pri hover:underline">상세 →</Link>
          </div>
          <div className="h-[220px] flex items-end gap-3 px-2">
            {trend.map(t => {
              const heightPct = (t.mrr / maxMrr) * 100;
              const isCurrent = t.month === months[months.length - 1];
              return (
                <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-[10px] text-t3 font-semibold">
                    {t.mrr > 0 ? `${Math.round(t.mrr / 10000)}만` : '-'}
                  </div>
                  <div
                    className={`w-full rounded-t ${isCurrent ? 'bg-pri' : 'bg-pri/30'}`}
                    style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '4px' }}
                  />
                  <div className="text-[10px] text-t3 font-medium">{monthLabel(t.month)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-t2">플랜 분포</h4>
            <Link href="/subscriptions" className="text-xs text-pri hover:underline">상세 →</Link>
          </div>
          {planEntries.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-t3 text-sm">
              플랜 데이터 없음
            </div>
          ) : (
            <div className="space-y-3">
              {planEntries.map(([plan, cnt]) => {
                const pct = (cnt / totalPlanItems) * 100;
                return (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-t1">{PLAN_KO[plan] ?? plan}</span>
                      <span className="text-t3">{cnt}건 · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full ${PLAN_COLOR[plan] ?? 'bg-pri'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 주의 항목 — 결제 실패 + 카드 만료 임박 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold">
              <span className={pastDueCount > 0 || failedRecent.length > 0 ? 'text-err' : 'text-t1'}>
                {pastDueCount > 0 || failedRecent.length > 0 ? '⚠ ' : ''}
              </span>
              결제 실패 최근
            </h3>
            <Link href="/payments" className="text-xs text-pri hover:underline">전체 →</Link>
          </div>
          <div className="p-5">
            {failedRecent.length === 0 ? (
              <div className="text-center text-t3 text-sm py-6">결제 실패 없음</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {failedRecent.map(p => (
                  <li key={p.id} className="flex justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-t2">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                    <span className="text-err font-semibold">{(p.amount ?? 0).toLocaleString()}원</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold">
              <span className={expiringSoon.length > 0 ? 'text-warn' : 'text-t1'}>
                {expiringSoon.length > 0 ? '⚠ ' : ''}
              </span>
              카드 만료 임박
            </h3>
            <Link href="/subscriptions" className="text-xs text-pri hover:underline">전체 →</Link>
          </div>
          <div className="p-5">
            {expiringSoon.length === 0 ? (
              <div className="text-center text-t3 text-sm py-6">만료 임박 카드 없음</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {expiringSoon.map(({ s, d }) => (
                  <li key={s.id} className="flex justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-t2">
                      {String(s.card_expiry_month).padStart(2, '0')}/{String(s.card_expiry_year).slice(-2)} 만료
                    </span>
                    <span className={d! <= 7 ? 'text-err font-bold' : 'text-warn font-bold'}>D-{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 광고 — 미구현 placeholder */}
      <div className="bg-card border border-border rounded-[10px] p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-t1">광고 매출</h3>
          <span className="text-[11px] text-t3 bg-bg px-2 py-0.5 rounded-full font-semibold">준비중</span>
        </div>
        <p className="text-xs text-t3 leading-relaxed">
          지역 광고·제휴 매출 모듈은 별도 작업 예정 (memory: project_future.md — 광고/지역연결).
          광고주 등록·집행·정산 테이블 설계 후 본 대시보드에 매출 항목 추가됩니다.
        </p>
      </div>

      {/* 최근 가입 관리자 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">최근 가입 관리자</h3>
          <Link href="/admins" className="text-xs text-pri hover:underline">전체 →</Link>
        </div>
        <div className="p-5">
          {!recentSignupAdmins || recentSignupAdmins.length === 0 ? (
            <div className="text-center text-t3 text-sm py-6">최근 가입 없음</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSignupAdmins.map(a => (
                <li key={a.id} className="flex justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="font-semibold text-t1">{a.name ?? '(이름 없음)'}</span>
                  <span className="text-t3 text-xs">
                    {a.email} · {new Date(a.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
