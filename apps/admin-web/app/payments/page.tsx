import { createServerClient } from '@/lib/supabase-server';

type Row = {
  id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
  failure_reason: string | null;
  subscriptions: {
    id: string;
    admin_id: string;
    admins: { name: string | null; email: string } | null;
    subscription_items: { id: string }[] | null;
  } | null;
};

const STATUS_KO: Record<Row['status'], { label: string; cls: string }> = {
  success: { label: '성공', cls: 'bg-okL text-ok' },
  failed: { label: '실패', cls: 'bg-errL text-err' },
  refunded: { label: '환불', cls: 'bg-bg text-t3' },
};

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const supabase = createServerClient();

  const { data: payments, error } = await supabase
    .from('subscription_payments')
    .select(`
      id, amount, status, created_at, failure_reason,
      subscriptions:subscription_id (
        id, admin_id,
        admins:admin_id ( name, email ),
        subscription_items ( id )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<Row[]>();

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">결제 내역</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          데이터 조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rows = payments ?? [];
  const success = rows.filter((p) => p.status === 'success');
  const failed = rows.filter((p) => p.status === 'failed');
  const successAmount = success.reduce((s, p) => s + (p.amount ?? 0), 0);
  const failAmount = failed.reduce((s, p) => s + (p.amount ?? 0), 0);
  const successRate = rows.length > 0 ? ((success.length / rows.length) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">결제 내역</h2>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: '결제 성공 금액', value: `${successAmount.toLocaleString()}원`, color: 'text-ok' },
          { label: '성공 건수', value: `${success.length}건`, color: 'text-ok' },
          { label: '결제 실패 금액', value: `${failAmount.toLocaleString()}원`, color: 'text-err' },
          { label: '실패 건수', value: `${failed.length}건`, color: 'text-err' },
          { label: '성공률', value: `${successRate}%`, color: 'text-pri' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">결제 목록 (최근 200건)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">결제일</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">내역</th>
                <th className="text-right px-5 py-3 font-medium">금액</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
                <th className="text-left px-5 py-3 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-t3">
                    아직 결제 내역이 없습니다
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const admin = p.subscriptions?.admins;
                  const villaCount = p.subscriptions?.subscription_items?.length ?? 0;
                  const st = STATUS_KO[p.status];
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 text-t2">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                      <td className="px-5 py-3.5 font-semibold text-t1">{admin?.name ?? admin?.email ?? '-'}</td>
                      <td className="px-5 py-3.5 text-t2">구독료 ({villaCount} 빌라)</td>
                      <td className="px-5 py-3.5 text-right font-semibold">{(p.amount ?? 0).toLocaleString()}원</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-t3 text-xs">{p.failure_reason ?? ''}</td>
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
