import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type ColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
};

type ConstraintRow = {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  column_name: string | null;
};

const EDGE_FUNCTIONS = [
  { name: 'add-villa-with-billing', purpose: '빌라 등록 + subscription_items 추가 (트랜잭션)' },
  { name: 'billing-cron', purpose: '매일 결제일 도래 구독 자동 결제 (Vercel Cron)' },
  { name: 'card-expiry-cron', purpose: '카드 만료 30/7/0일 전 푸시 알림' },
  { name: 'confirm-payment', purpose: '단건 결제 confirm (토스 API)' },
  { name: 'issue-billing-key', purpose: '토스 빌링키 발급 + subscriptions UPDATE/INSERT' },
  { name: 'payment-webhook', purpose: '토스 webhook 수신 → subscription_payments INSERT' },
  { name: 'push-notify', purpose: '입주민 푸시 알림 전송 (Expo Push + FCM v1 자동 분기)' },
  { name: 'resident-login', purpose: '입주민 휴대폰 인증 + 세션 발급' },
  { name: 'transfer-villa', purpose: '빌라 관리자 이전 (소유권 변경)' },
];

const ADMIN_API_ENDPOINTS = [
  { path: 'GET /', purpose: '대시보드 (KPI, MRR 추이, 결제실패·만료 임박)' },
  { path: 'GET /admins', purpose: '관리자 목록 (검색·필터)' },
  { path: 'GET /admins/[id]', purpose: '관리자 상세 (구독·이슈·활동지표·민원·결제내역)' },
  { path: 'GET /villas', purpose: '빌라 목록 (도/시 필터, 납부율, 누적미납)' },
  { path: 'GET /residents', purpose: '입주민 목록 (검색·납부 필터)' },
  { path: 'GET /subscriptions', purpose: '구독·매출 — MRR 7개월 추이' },
  { path: 'GET /payments', purpose: '결제 내역' },
  { path: 'GET /schema', purpose: '본 페이지 (DB 스키마 + API 레퍼런스)' },
  { path: 'GET /settings', purpose: '시스템 설정' },
  { path: 'POST /api/keep-alive', purpose: 'Vercel Cron 데일리 Ping (Supabase 일시중지 방지)' },
  { path: 'POST /api/danal/start', purpose: '다날 본인확인 시작 (TID 발급)' },
  { path: 'POST /api/danal/callback', purpose: '다날 본인확인 결과 콜백 → postMessage' },
];

export default async function SchemaPage() {
  const supabase = createServerClient();

  // public 스키마의 모든 테이블·컬럼 조회
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type, is_nullable, column_default, ordinal_position')
    .eq('table_schema', 'public')
    .order('table_name')
    .order('ordinal_position')
    .returns<ColumnRow[]>();

  // 제약 (PK, FK, UNIQUE)
  const { data: constraints } = await supabase
    .from('information_schema.table_constraints')
    .select('table_name, constraint_name, constraint_type')
    .eq('table_schema', 'public')
    .in('constraint_type', ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE'])
    .returns<ConstraintRow[]>();

  // 테이블별 컬럼 그룹화
  const byTable = new Map<string, ColumnRow[]>();
  (columns ?? []).forEach((c) => {
    if (!byTable.has(c.table_name)) byTable.set(c.table_name, []);
    byTable.get(c.table_name)!.push(c);
  });
  const tables = Array.from(byTable.keys()).sort();

  // 제약 정보
  const constraintByTable = new Map<string, { pk: number; fk: number; uniq: number }>();
  (constraints ?? []).forEach((c) => {
    const cur = constraintByTable.get(c.table_name) ?? { pk: 0, fk: 0, uniq: 0 };
    if (c.constraint_type === 'PRIMARY KEY') cur.pk++;
    if (c.constraint_type === 'FOREIGN KEY') cur.fk++;
    if (c.constraint_type === 'UNIQUE') cur.uniq++;
    constraintByTable.set(c.table_name, cur);
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">시스템 스키마 & API 레퍼런스</h2>
      <p className="text-xs text-t3 mb-6">
        Supabase Postgres · Edge Functions · 본사 콘솔 API 통합 문서. 운영 디버깅·신규 기능 설계 시 참조.
      </p>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'DB 테이블', value: `${tables.length}개`, color: 'text-pri' },
          { label: '총 컬럼', value: `${columns?.length ?? 0}개`, color: 'text-ok' },
          { label: 'Edge Functions', value: `${EDGE_FUNCTIONS.length}개`, color: 'text-warn' },
          { label: '본사 콘솔 라우트', value: `${ADMIN_API_ENDPOINTS.length}개`, color: 'text-[#4DA6FF]' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* DB 테이블 — 펼치기 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">📊 DB 테이블 — public 스키마 ({tables.length}개)</h3>
          <p className="text-xs text-t3 mt-1">테이블명 클릭하면 컬럼 펼침. PK/FK/UNIQUE 카운트는 우측 표시.</p>
        </div>
        <div className="divide-y divide-border">
          {tables.length === 0 ? (
            <div className="p-8 text-center text-t3 text-sm">스키마 조회 권한 부족 또는 빈 DB</div>
          ) : (
            tables.map((t) => {
              const cols = byTable.get(t)!;
              const cs = constraintByTable.get(t) ?? { pk: 0, fk: 0, uniq: 0 };
              return (
                <details key={t} className="group">
                  <summary className="px-5 py-3 cursor-pointer hover:bg-priL flex items-center justify-between text-sm list-none">
                    <div className="flex items-center gap-3">
                      <span className="text-pri group-open:rotate-90 inline-block transition-transform">▶</span>
                      <span className="font-bold font-mono text-t1">{t}</span>
                      <span className="text-xs text-t3">{cols.length}개 컬럼</span>
                    </div>
                    <div className="flex gap-2 text-[11px] font-bold">
                      {cs.pk > 0 && <span className="px-2 py-0.5 rounded bg-priL text-priT">PK {cs.pk}</span>}
                      {cs.fk > 0 && <span className="px-2 py-0.5 rounded bg-okL text-ok">FK {cs.fk}</span>}
                      {cs.uniq > 0 && <span className="px-2 py-0.5 rounded bg-warnL text-warn">UNIQUE {cs.uniq}</span>}
                    </div>
                  </summary>
                  <div className="px-5 pb-4 border-t border-border bg-bg">
                    <table className="w-full text-xs mt-3">
                      <thead>
                        <tr className="text-t3 border-b border-border">
                          <th className="text-left py-2 px-2 font-medium">컬럼</th>
                          <th className="text-left py-2 px-2 font-medium">타입</th>
                          <th className="text-left py-2 px-2 font-medium">NULL</th>
                          <th className="text-left py-2 px-2 font-medium">기본값</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map((c) => (
                          <tr key={c.column_name} className="border-b border-border last:border-0">
                            <td className="py-1.5 px-2 font-mono font-semibold text-t1">{c.column_name}</td>
                            <td className="py-1.5 px-2 font-mono text-t2">{c.data_type}</td>
                            <td className="py-1.5 px-2 text-t3">
                              {c.is_nullable === 'NO' ? <span className="text-err font-semibold">NOT NULL</span> : 'nullable'}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-t3 text-[10px] max-w-[300px] truncate" title={c.column_default ?? ''}>
                              {c.column_default ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>

      {/* Edge Functions */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">⚡ Edge Functions — Supabase 서버사이드 ({EDGE_FUNCTIONS.length}개)</h3>
          <p className="text-xs text-t3 mt-1">모두 service_role 로 동작 (RLS 우회). 토스 API 통신 / cron / push 알림 처리.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-t3 text-xs">
              <th className="text-left px-5 py-3 font-medium">함수명</th>
              <th className="text-left px-5 py-3 font-medium">용도</th>
            </tr>
          </thead>
          <tbody>
            {EDGE_FUNCTIONS.map((fn) => (
              <tr key={fn.name} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-mono font-semibold text-t1">{fn.name}</td>
                <td className="px-5 py-3 text-t2">{fn.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 본사 콘솔 라우트 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">🌐 본사 콘솔 라우트 — admin-web ({ADMIN_API_ENDPOINTS.length}개)</h3>
          <p className="text-xs text-t3 mt-1">모든 페이지 service_role 직접 접근 (RLS 우회 풀 조회).</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-t3 text-xs">
              <th className="text-left px-5 py-3 font-medium">경로</th>
              <th className="text-left px-5 py-3 font-medium">기능</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_API_ENDPOINTS.map((ep) => (
              <tr key={ep.path} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-mono font-semibold text-t1 whitespace-nowrap">{ep.path}</td>
                <td className="px-5 py-3 text-t2">{ep.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 핵심 함수 / 헬퍼 */}
      <div className="bg-card border border-border rounded-[10px] p-5 mb-6">
        <h3 className="text-sm font-bold mb-3">🔧 RLS 보조 함수 (Postgres)</h3>
        <pre className="text-xs font-mono bg-bg p-4 rounded border border-border overflow-x-auto whitespace-pre">
{`CREATE FUNCTION current_admin_id() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM admins WHERE auth_id = (SELECT auth.uid())
$$;

-- 모든 admin 관련 RLS 정책이 이 함수 호출:
-- POLICY xxx FOR ALL USING (admin_id = current_admin_id())`}
        </pre>
      </div>

      {/* 환경 / 운영 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-[10px] p-5">
          <h3 className="text-sm font-bold mb-3">🗄 Supabase 환경</h3>
          <div className="text-xs space-y-1 font-mono text-t2">
            <div><span className="text-t3">Project:</span> tdgieeupxxalwxikdxji</div>
            <div><span className="text-t3">Region:</span> ap-northeast-2 (Seoul)</div>
            <div><span className="text-t3">DB:</span> Postgres 15+</div>
            <div><span className="text-t3">Auth:</span> Supabase Auth (email + JWT)</div>
            <div><span className="text-t3">Realtime:</span> 미사용 (대비 가능)</div>
            <div><span className="text-t3">Storage:</span> buckets 운영 중 (avatar, attachments)</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[10px] p-5">
          <h3 className="text-sm font-bold mb-3">🚀 배포 환경</h3>
          <div className="text-xs space-y-1 font-mono text-t2">
            <div><span className="text-t3">본사:</span> villatolk-admin.vercel.app</div>
            <div><span className="text-t3">랜딩:</span> villatolk.vercel.app</div>
            <div><span className="text-t3">모바일:</span> EAS Build (APK)</div>
            <div><span className="text-t3">자동배포:</span> GitHub Actions → Vercel CLI</div>
            <div><span className="text-t3">트리거 브랜치:</span> main</div>
            <div><span className="text-t3">Edge Functions:</span> supabase CLI deploy</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-t3 text-center pt-2 pb-6">
        스키마는 Supabase information_schema 에서 실시간 조회. 마이그레이션 변경 시 자동 반영.
      </p>
    </div>
  );
}
