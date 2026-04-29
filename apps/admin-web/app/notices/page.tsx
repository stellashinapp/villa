import { createServerClient } from '@/lib/supabase-server';

type NoticeRow = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  villas: {
    name: string;
    admins: { name: string | null; email: string } | null;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  const supabase = createServerClient();

  const { data: notices, error } = await supabase
    .from('notices')
    .select(`
      id, title, body, is_pinned, created_at,
      villas:villa_id ( name, admins:admin_id ( name, email ) )
    `)
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<NoticeRow[]>();

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">공지 모니터링</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rows = notices ?? [];

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">공지 모니터링</h2>

      <div className="bg-priL/30 border border-priL rounded-[10px] p-4 mb-4 text-xs text-t2">
        💡 각 관리자가 자기 빌라에 발행한 공지를 본사에서 모아 봅니다. 공지 작성은 관리자 모바일 앱에서 진행됩니다.
      </div>

      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">최근 공지 (최근 200건)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">발행일</th>
                <th className="text-left px-5 py-3 font-medium">제목</th>
                <th className="text-left px-5 py-3 font-medium">빌라</th>
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">고정</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-t3">아직 공지가 없습니다</td></tr>
              ) : (
                rows.map((n) => {
                  const villa = n.villas?.name ?? '-';
                  const admin = n.villas?.admins?.name ?? n.villas?.admins?.email ?? '-';
                  return (
                    <tr key={n.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 text-t2 whitespace-nowrap">{new Date(n.created_at).toLocaleString('ko-KR')}</td>
                      <td className="px-5 py-3.5 font-semibold text-t1">{n.title}</td>
                      <td className="px-5 py-3.5 text-t2">{villa}</td>
                      <td className="px-5 py-3.5 text-t2">{admin}</td>
                      <td className="px-5 py-3.5">
                        {n.is_pinned ? <span className="text-xs bg-warnL text-warn px-2 py-0.5 rounded">📌 고정</span> : <span className="text-t3 text-xs">-</span>}
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
