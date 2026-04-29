import { createServerClient } from '@/lib/supabase-server';

type MessageRow = {
  id: string;
  text: string;
  is_read: boolean;
  category: string;
  created_at: string;
  villas: {
    name: string;
    admins: { name: string | null; email: string } | null;
  } | null;
  units: { ho_number: string } | null;
  message_replies: { id: string; text: string; author_type: string; created_at: string }[] | null;
};

export const dynamic = 'force-dynamic';

export default async function InquiriesPage() {
  const supabase = createServerClient();

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, text, is_read, category, created_at,
      villas:villa_id ( name, admins:admin_id ( name, email ) ),
      units:unit_id ( ho_number ),
      message_replies ( id, text, author_type, created_at )
    `)
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<MessageRow[]>();

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">민원/문의</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rows = messages ?? [];
  const pending = rows.filter((m) => (m.message_replies?.length ?? 0) === 0);
  const resolved = rows.filter((m) => (m.message_replies?.length ?? 0) > 0);

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">민원/문의 모니터링</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '총 민원', value: `${rows.length}건`, color: 'text-pri' },
          { label: '답변 대기', value: `${pending.length}건`, color: 'text-warn' },
          { label: '답변 완료', value: `${resolved.length}건`, color: 'text-ok' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-priL/30 border border-priL rounded-[10px] p-4 mb-4 text-xs text-t2">
        💡 입주민이 관리자에게 보낸 민원/문의를 본사에서 모니터링합니다. 답변은 관리자 모바일 앱에서 진행됩니다.
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">전체 민원 (최근 200건)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">접수일</th>
                <th className="text-left px-5 py-3 font-medium">빌라</th>
                <th className="text-left px-5 py-3 font-medium">호실</th>
                <th className="text-left px-5 py-3 font-medium">내용</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-t3">아직 민원이 없습니다</td></tr>
              ) : (
                rows.map((m) => {
                  const villa = m.villas?.name ?? '-';
                  const admin = m.villas?.admins?.name ?? m.villas?.admins?.email ?? '-';
                  const ho = m.units?.ho_number ?? '-';
                  const replyCount = m.message_replies?.length ?? 0;
                  const isResolved = replyCount > 0;
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 text-t2 whitespace-nowrap">{new Date(m.created_at).toLocaleString('ko-KR')}</td>
                      <td className="px-5 py-3.5 text-t2">{villa}</td>
                      <td className="px-5 py-3.5 text-t2">{ho}</td>
                      <td className="px-5 py-3.5 text-t1 max-w-md truncate">{m.text}</td>
                      <td className="px-5 py-3.5 text-t2">{admin}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isResolved ? 'bg-okL text-ok' : 'bg-warnL text-warn'}`}>
                          {isResolved ? `답변 ${replyCount}건` : '대기중'}
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
