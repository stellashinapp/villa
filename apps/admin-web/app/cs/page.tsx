import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { getViewerEmail, canRevealPII, isSuperAdmin } from '@/lib/auth-context';
import { logAdminAccess } from '@/lib/access-log';
import { maskName, maskEmail, maskPhone } from '@/lib/mask';
import RevealToggle from '../residents/RevealToggle';

export const dynamic = 'force-dynamic';

type MessageRow = {
  id: string;
  text: string;
  created_at: string;
  villas: {
    id: string;
    name: string;
    admins: { id: string; name: string | null; email: string } | null;
  } | null;
  units: { ho_number: string } | null;
  message_replies: { id: string }[] | null;
};

type AdminRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  auth_id: string | null;
  villas: { id: string; status: string }[] | null;
  subscriptions: {
    status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
    card_brand: string | null;
    card_expiry_year: number | null;
    card_expiry_month: number | null;
    trial_ends_at: string | null;
  }[] | null;
};

type AccessLogRow = {
  id: string;
  viewer_email: string | null;
  path: string;
  ip: string | null;
  created_at: string;
  payload: { reveal?: boolean; event?: string } | null;
};

function daysBetween(from: string | Date, to: string | Date = new Date()) {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR');
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = daysBetween(iso);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  if (d < 365) return `${Math.floor(d / 30)}개월 전`;
  return `${Math.floor(d / 365)}년 전`;
}

export default async function CSPage({
  searchParams,
}: {
  searchParams: Promise<{ reveal?: string }>;
}) {
  const sp = await searchParams;
  const viewer = await getViewerEmail();
  const reveal = canRevealPII(viewer, sp.reveal);
  const superAdmin = isSuperAdmin(viewer);

  await logAdminAccess({
    path: '/cs',
    viewerEmail: viewer,
    payload: { reveal },
  });

  const supabase = createServerClient();

  type PendingResident = {
    id: string;
    name: string;
    phone: string;
    status: 'pending' | 'pending_moveout';
    applied_at: string | null;
    move_out_date: string | null;
    units: { ho_number: string; villas: { name: string; admins: { name: string | null; email: string } | null } } | null;
  };

  const [
    { data: messages },
    { data: admins },
    { data: accessLogs },
    { data: pendingResidents },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select(`
        id, text, created_at,
        villas:villa_id ( id, name, admins:admin_id ( id, name, email ) ),
        units:unit_id ( ho_number ),
        message_replies ( id )
      `)
      .order('created_at', { ascending: false })
      .limit(500)
      .returns<MessageRow[]>(),
    supabase
      .from('admins')
      .select(`
        id, name, email, phone, created_at, auth_id,
        villas ( id, status ),
        subscriptions ( status, card_brand, card_expiry_year, card_expiry_month, trial_ends_at )
      `)
      .order('created_at', { ascending: false })
      .returns<AdminRow[]>(),
    supabase
      .from('admin_access_logs')
      .select('id, viewer_email, path, ip, created_at, payload')
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<AccessLogRow[]>(),
    supabase
      .from('residents')
      .select(`
        id, name, phone, status, applied_at, move_out_date,
        units:unit_id ( ho_number, villas:villa_id ( name, admins:admin_id ( name, email ) ) )
      `)
      .in('status', ['pending', 'pending_moveout'])
      .order('applied_at', { ascending: true })
      .returns<PendingResident[]>(),
  ]);

  const msgRows = messages ?? [];
  const adminRows = admins ?? [];
  const logRows = accessLogs ?? [];

  // ===== 0. 입주민 신청·이주 대기 =====
  const pendingApps = (pendingResidents ?? []).filter(r => r.status === 'pending');
  const pendingMoveouts = (pendingResidents ?? []).filter(r => r.status === 'pending_moveout');

  // ===== 1. 답변 지연 민원 =====
  const pendingMessages = msgRows.filter(m => (m.message_replies?.length ?? 0) === 0);
  const oldPending = pendingMessages
    .filter(m => daysBetween(m.created_at) >= 3)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // 오래된 순

  // ===== 2. 결제 이슈 관리자 =====
  type AdminIssue = {
    admin: AdminRow;
    reasons: { label: string; severity: 'critical' | 'warning'; detail: string }[];
  };
  const billingIssues: AdminIssue[] = [];
  const stalledAdmins: AdminIssue[] = [];

  for (const a of adminRows) {
    const sub = a.subscriptions?.[0];
    const activeVillas = (a.villas ?? []).filter(v => v.status === 'active');
    const billing: AdminIssue['reasons'] = [];
    const stall: AdminIssue['reasons'] = [];

    if (sub?.status === 'past_due') {
      billing.push({
        severity: 'critical',
        label: '정기결제 실패',
        detail: '카드 결제 거절 — 사용자 연락 + 카드 재등록 안내 필요',
      });
    }

    if (sub && !sub.card_brand && (sub.status === 'trialing' || sub.status === 'active')) {
      billing.push({
        severity: 'warning',
        label: '카드 미등록',
        detail: '다음 결제 실패 위험',
      });
    }

    if (sub?.card_expiry_year && sub?.card_expiry_month) {
      const expiry = new Date(sub.card_expiry_year, sub.card_expiry_month, 0, 23, 59, 59);
      const dExp = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (dExp < 0) {
        billing.push({
          severity: 'critical',
          label: '카드 만료됨',
          detail: `${String(sub.card_expiry_month).padStart(2, '0')}/${String(sub.card_expiry_year).slice(-2)} — 즉시 재등록 안내`,
        });
      } else if (dExp <= 30) {
        billing.push({
          severity: 'warning',
          label: `카드 만료 D-${dExp}`,
          detail: `${String(sub.card_expiry_month).padStart(2, '0')}/${String(sub.card_expiry_year).slice(-2)} 만료`,
        });
      }
    }

    if (sub?.status === 'trialing' && sub.trial_ends_at) {
      const tDays = daysBetween(new Date(), sub.trial_ends_at);
      if (tDays < 0) {
        billing.push({
          severity: 'critical',
          label: '체험 만료됨',
          detail: '카드 미등록 시 곧 차단',
        });
      } else if (tDays <= 7) {
        billing.push({
          severity: 'warning',
          label: `체험 D-${tDays}`,
          detail: '카드 등록 안내 필요',
        });
      }
    }

    if (!sub) {
      stall.push({
        severity: 'critical',
        label: '구독 미가입',
        detail: '회원가입은 했으나 결제 등록 X',
      });
    } else if (activeVillas.length === 0 && daysBetween(a.created_at) > 3) {
      stall.push({
        severity: 'warning',
        label: '빌라 미등록',
        detail: `가입 후 ${daysBetween(a.created_at)}일째 빌라 0개 — 온보딩 안내`,
      });
    }

    if (billing.length > 0) billingIssues.push({ admin: a, reasons: billing });
    if (stall.length > 0) stalledAdmins.push({ admin: a, reasons: stall });
  }

  // ===== 3. 장기 미접속 관리자 — auth.users 일괄 조회 =====
  type StaleAdmin = { admin: AdminRow; lastSignInAt: string | null; days: number };
  const staleAdmins: StaleAdmin[] = [];
  const authIds = adminRows.map(a => a.auth_id).filter(Boolean) as string[];
  if (authIds.length > 0) {
    // service_role 에선 한 명씩 getUserById 호출 — 30명 이하면 부담 적음
    for (const a of adminRows) {
      if (!a.auth_id) continue;
      try {
        const { data: u } = await supabase.auth.admin.getUserById(a.auth_id);
        const last = u?.user?.last_sign_in_at ?? null;
        if (last) {
          const d = daysBetween(last);
          if (d > 30) staleAdmins.push({ admin: a, lastSignInAt: last, days: d });
        }
      } catch {
        // 무시
      }
    }
    staleAdmins.sort((a, b) => b.days - a.days);
  }

  // KPI 카운트
  const kpiUnanswered = pendingMessages.length;
  const kpiOldUnanswered = oldPending.length;
  const kpiBilling = billingIssues.length;
  const kpiStalled = stalledAdmins.length;
  const kpiStale = staleAdmins.length;

  function displayAdmin(a: AdminRow): string {
    if (reveal) return a.name ?? a.email;
    return a.name ? maskName(a.name) : maskEmail(a.email);
  }
  function displayEmail(e: string): string {
    return reveal ? e : maskEmail(e);
  }
  function displayPhone(p: string | null): string {
    if (!p) return '-';
    return reveal ? p : maskPhone(p);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">고객지원 (CS) 종합</h2>
        <RevealToggle reveal={reveal} canReveal={superAdmin} />
      </div>

      {/* 본사 직접 채널 */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <h3 className="text-sm font-bold mb-3">📮 본사 직접 채널</h3>
        <p className="text-xs text-t3 mb-4">
          외부 가입자·잠재고객·언론·제휴 문의는 아래 채널로 들어옵니다. 본사 콘솔에서 직접 처리할 수 있는 인박스는 추후 도입 예정 — 우선은 이메일 모니터링.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-bg border border-border rounded-lg px-4 py-3">
            <div className="text-[11px] text-t3 font-medium mb-1">고객 문의 이메일</div>
            <a href="mailto:villatolk@andnew.kr" className="font-semibold text-pri hover:underline">villatolk@andnew.kr</a>
          </div>
          <div className="bg-bg border border-border rounded-lg px-4 py-3">
            <div className="text-[11px] text-t3 font-medium mb-1">사업자·개인정보 보호책임자</div>
            <div className="font-semibold text-t1">앤뉴 (ANDNEW) · 신경아</div>
            <div className="text-[11px] text-t3 mt-0.5">서울 송파구 송파대로 111</div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <KpiCard
          label="미답변 민원"
          value={`${kpiUnanswered}건`}
          color={kpiUnanswered > 0 ? 'text-warn' : 'text-ok'}
          hint={kpiOldUnanswered > 0 ? `3일+ ${kpiOldUnanswered}건` : '신속 처리 중'}
        />
        <KpiCard
          label="결제 이슈"
          value={`${kpiBilling}명`}
          color={kpiBilling > 0 ? 'text-err' : 'text-ok'}
          hint="past_due · 카드만료 · 체험만료"
        />
        <KpiCard
          label="구독 미가입·정체"
          value={`${kpiStalled}명`}
          color={kpiStalled > 0 ? 'text-warn' : 'text-ok'}
          hint="가입 후 결제 또는 빌라 미설정"
        />
        <KpiCard
          label="장기 미접속"
          value={`${kpiStale}명`}
          color={kpiStale > 0 ? 'text-warn' : 'text-ok'}
          hint="30일+ 로그인 없음"
        />
        <KpiCard
          label="총 답변완료 (최근)"
          value={`${msgRows.length - kpiUnanswered}건`}
          color="text-pri"
          hint={`전체 ${msgRows.length}건 중`}
        />
      </div>

      {/* 0. 입주민 신청·이주 대기 */}
      <Section
        title="입주·이주 신청 대기"
        countLabel={`신청 ${pendingApps.length} / 이주 ${pendingMoveouts.length}`}
        accent={(pendingApps.length + pendingMoveouts.length) > 0 ? 'warn' : 'ok'}
        hint="PWA 에서 입주민이 보낸 신청. 관리자(앱·PWA)가 승인·거부 처리. 본사는 모니터링용."
      >
        {pendingApps.length + pendingMoveouts.length === 0 ? (
          <EmptyRow>현재 대기 중인 신청 없음 👍</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">종류</th>
                <th className="text-left px-5 py-3 font-medium">빌라 / 호실</th>
                <th className="text-left px-5 py-3 font-medium">신청자</th>
                <th className="text-left px-5 py-3 font-medium">담당 관리자</th>
                <th className="text-left px-5 py-3 font-medium">신청일</th>
              </tr>
            </thead>
            <tbody>
              {[...pendingApps, ...pendingMoveouts].slice(0, 20).map(r => {
                const isMoveout = r.status === 'pending_moveout';
                const adminObj = r.units?.villas?.admins;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${isMoveout ? 'bg-warnL text-warn' : 'bg-priL text-priT'}`}>
                        {isMoveout ? '📦 이주' : '📮 입주'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-t2">
                      <div className="font-semibold">{r.units?.villas?.name ?? '-'}</div>
                      <div className="text-[11px] text-t3">{r.units?.ho_number ?? '-'}호</div>
                    </td>
                    <td className="px-5 py-3.5 text-t2">
                      <div className="font-semibold text-t1">{reveal ? r.name : maskName(r.name)}</div>
                      <div className="text-[11px] text-t3">{reveal ? r.phone : maskPhone(r.phone)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-t2 text-xs">
                      {adminObj ? (reveal ? (adminObj.name ?? adminObj.email) : (adminObj.name ? maskName(adminObj.name) : maskEmail(adminObj.email))) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-t3 text-xs whitespace-nowrap">
                      {fmtRelative(r.applied_at)}
                      {isMoveout && r.move_out_date && (
                        <div className="text-[11px] text-warn mt-0.5">예정 {r.move_out_date}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* 1. 답변 지연 민원 */}
      <Section
        title="답변 지연 민원 (3일+ 미답변)"
        countLabel={`${oldPending.length}건`}
        accent={oldPending.length > 0 ? 'warn' : 'ok'}
        hint="입주민이 관리자에게 보낸 민원 중 3일 이상 답변 지연된 케이스. 관리자에게 답변 독려 필요."
      >
        {oldPending.length === 0 ? (
          <EmptyRow>지연 민원 없음 — 모든 민원이 3일 안에 답변되었습니다 👍</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">경과</th>
                <th className="text-left px-5 py-3 font-medium">빌라 / 호실</th>
                <th className="text-left px-5 py-3 font-medium">내용</th>
                <th className="text-left px-5 py-3 font-medium">담당 관리자</th>
              </tr>
            </thead>
            <tbody>
              {oldPending.slice(0, 20).map(m => {
                const d = daysBetween(m.created_at);
                const adminObj = m.villas?.admins;
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${d >= 7 ? 'bg-errL text-err' : 'bg-warnL text-warn'}`}>
                        {d}일째
                      </span>
                      <div className="text-[11px] text-t3 mt-0.5">{fmtRelative(m.created_at)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-t2">
                      <div className="font-semibold">{m.villas?.name ?? '-'}</div>
                      <div className="text-[11px] text-t3">{m.units?.ho_number ?? '-'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-t1 max-w-md truncate" title={m.text}>{m.text}</td>
                    <td className="px-5 py-3.5 text-t2">
                      {adminObj ? (
                        <Link href={`/admins/${adminObj.id}`} className="hover:underline">
                          <div className="font-semibold">{reveal ? (adminObj.name ?? adminObj.email) : (adminObj.name ? maskName(adminObj.name) : maskEmail(adminObj.email))}</div>
                          <div className="text-[11px] text-t3">{displayEmail(adminObj.email)}</div>
                        </Link>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {oldPending.length > 20 && (
          <FooterMore>상위 20건만 표시 · 전체 {oldPending.length}건</FooterMore>
        )}
      </Section>

      {/* 2. 결제 이슈 */}
      <Section
        title="결제 이슈 관리자"
        countLabel={`${billingIssues.length}명`}
        accent={billingIssues.length > 0 ? 'err' : 'ok'}
        hint="past_due, 카드 만료, 체험 만료 임박 — 즉시 안내 메일·전화 필요"
      >
        {billingIssues.length === 0 ? (
          <EmptyRow>결제 이슈 없음 — 모두 정상 상태입니다 👍</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">연락처</th>
                <th className="text-left px-5 py-3 font-medium">사유</th>
              </tr>
            </thead>
            <tbody>
              {billingIssues.map(({ admin, reasons }) => (
                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admins/${admin.id}`} className="hover:underline">
                      <div className="font-semibold text-t1">{displayAdmin(admin)}</div>
                      <div className="text-[11px] text-t3">{displayEmail(admin.email)}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-t2 whitespace-nowrap">{displayPhone(admin.phone)}</td>
                  <td className="px-5 py-3.5">
                    <ul className="space-y-1">
                      {reasons.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${r.severity === 'critical' ? 'bg-err' : 'bg-warn'}`} />
                          <div>
                            <span className={`font-bold text-xs ${r.severity === 'critical' ? 'text-err' : 'text-warn'}`}>{r.label}</span>
                            <span className="text-[11px] text-t3 ml-1.5">— {r.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 3. 가입 정체 관리자 */}
      <Section
        title="구독 미가입·온보딩 정체"
        countLabel={`${stalledAdmins.length}명`}
        accent={stalledAdmins.length > 0 ? 'warn' : 'ok'}
        hint="회원가입은 했으나 결제·빌라 등록을 마치지 못한 케이스. 환영 메일·온보딩 가이드 발송 권장."
      >
        {stalledAdmins.length === 0 ? (
          <EmptyRow>온보딩 정체 없음 — 모두 정상 가동 중입니다 👍</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">연락처</th>
                <th className="text-left px-5 py-3 font-medium">가입일</th>
                <th className="text-left px-5 py-3 font-medium">사유</th>
              </tr>
            </thead>
            <tbody>
              {stalledAdmins.map(({ admin, reasons }) => (
                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admins/${admin.id}`} className="hover:underline">
                      <div className="font-semibold text-t1">{displayAdmin(admin)}</div>
                      <div className="text-[11px] text-t3">{displayEmail(admin.email)}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-t2 whitespace-nowrap">{displayPhone(admin.phone)}</td>
                  <td className="px-5 py-3.5 text-t3 whitespace-nowrap">
                    {fmtDate(admin.created_at)}
                    <div className="text-[11px]">D+{daysBetween(admin.created_at)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {reasons.map((r, idx) => (
                      <div key={idx} className="text-xs">
                        <span className={`font-bold ${r.severity === 'critical' ? 'text-err' : 'text-warn'}`}>{r.label}</span>
                        <span className="text-t3 ml-1.5">— {r.detail}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 4. 장기 미접속 */}
      <Section
        title="장기 미접속 관리자 (30일+)"
        countLabel={`${staleAdmins.length}명`}
        accent={staleAdmins.length > 0 ? 'warn' : 'ok'}
        hint="마지막 로그인 30일 이상 — 이탈 위험. 안부 메일·재방문 유도 권장."
      >
        {staleAdmins.length === 0 ? (
          <EmptyRow>이탈 위험군 없음 — 모두 활발히 사용 중입니다 👍</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">관리자</th>
                <th className="text-left px-5 py-3 font-medium">연락처</th>
                <th className="text-left px-5 py-3 font-medium">마지막 로그인</th>
                <th className="text-left px-5 py-3 font-medium">경과</th>
              </tr>
            </thead>
            <tbody>
              {staleAdmins.slice(0, 20).map(({ admin, lastSignInAt, days }) => (
                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admins/${admin.id}`} className="hover:underline">
                      <div className="font-semibold text-t1">{displayAdmin(admin)}</div>
                      <div className="text-[11px] text-t3">{displayEmail(admin.email)}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-t2 whitespace-nowrap">{displayPhone(admin.phone)}</td>
                  <td className="px-5 py-3.5 text-t3">{fmtDate(lastSignInAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${days > 90 ? 'bg-errL text-err' : 'bg-warnL text-warn'}`}>
                      {days}일째
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {staleAdmins.length > 20 && (
          <FooterMore>상위 20건만 표시 · 전체 {staleAdmins.length}건</FooterMore>
        )}
      </Section>

      {/* 5. 본사 콘솔 접근로그 (감사) */}
      <Section
        title="본사 콘솔 접근 기록 (최근 30건)"
        countLabel={`${logRows.length}건`}
        accent="info"
        hint="본 콘솔 모든 페이지 진입은 개인정보보호법 제29조에 따라 1년+ 보관. 감사 시 활용."
      >
        {logRows.length === 0 ? (
          <EmptyRow>접근 기록이 없습니다</EmptyRow>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">시각</th>
                <th className="text-left px-5 py-3 font-medium">접근자</th>
                <th className="text-left px-5 py-3 font-medium">경로</th>
                <th className="text-left px-5 py-3 font-medium">IP</th>
                <th className="text-left px-5 py-3 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {logRows.map(l => {
                const revealed = l.payload?.reveal === true;
                const event = l.payload?.event;
                return (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-t3 text-xs whitespace-nowrap">{fmtDateTime(l.created_at)}</td>
                    <td className="px-5 py-3.5 text-t2 font-mono text-xs">{l.viewer_email ?? '(비로그인)'}</td>
                    <td className="px-5 py-3.5 text-t2 font-mono text-xs">{l.path}</td>
                    <td className="px-5 py-3.5 text-t3 font-mono text-xs">{l.ip ?? '-'}</td>
                    <td className="px-5 py-3.5">
                      {revealed && <span className="text-[11px] bg-warnL text-warn px-1.5 py-0.5 rounded font-semibold">PII 풀노출</span>}
                      {event && <span className="text-[11px] bg-priL text-priT px-1.5 py-0.5 rounded font-semibold ml-1">{event}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function KpiCard({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-[10px] p-4">
      <div className="text-[11px] text-t3 font-medium mb-1.5">{label}</div>
      <div className={`text-xl font-extrabold tracking-tight ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-t3 mt-1 leading-tight">{hint}</div>}
    </div>
  );
}

function Section({
  title,
  countLabel,
  accent,
  hint,
  children,
}: {
  title: string;
  countLabel: string;
  accent: 'err' | 'warn' | 'ok' | 'info';
  hint?: string;
  children: React.ReactNode;
}) {
  const accentColor = {
    err: 'text-err',
    warn: 'text-warn',
    ok: 'text-ok',
    info: 'text-t3',
  }[accent];
  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold flex items-center gap-2">
            {title}
            <span className={`text-xs font-bold ${accentColor}`}>{countLabel}</span>
          </h3>
          {hint && <p className="text-[11px] text-t3 mt-1">{hint}</p>}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="p-8 text-center text-t3 text-sm">{children}</div>;
}

function FooterMore({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-3 text-xs text-t3 text-center border-t border-border">{children}</div>;
}
