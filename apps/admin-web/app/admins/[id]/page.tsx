import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { getViewerEmail, canRevealPII, isSuperAdmin } from '@/lib/auth-context';
import { logAdminAccess } from '@/lib/access-log';
import { maskName, maskPhone, maskEmail } from '@/lib/mask';
import RevealToggle from '../../residents/RevealToggle';

export const dynamic = 'force-dynamic';

function maskAccountNumber(n: string | null | undefined): string {
  if (!n) return '';
  const d = String(n).replace(/[^0-9-]/g, '');
  if (d.length < 6) return d;
  // 마지막 4자리만 노출
  const tail = d.slice(-4);
  const head = d.slice(0, 3);
  return `${head}${'*'.repeat(Math.max(d.length - 7, 0))}${tail}`;
}

type Admin = {
  id: string;
  auth_id: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
};

type Subscription = {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'pending_cancel';
  billing_day: number;
  card_brand: string | null;
  card_last4: string | null;
  card_expiry_year: number | null;
  card_expiry_month: number | null;
  billing_key: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  created_at: string;
  subscription_items: { villa_id: string | null; plan: string; price: number }[] | null;
};

type Villa = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number;
  account_bank: string | null;
  account_number: string | null;
  status: string;
  created_at: string;
};

type Payment = {
  id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
  error_message: string | null;
};

const STATUS_STYLE: Record<Subscription['status'] | 'none', { label: string; cls: string }> = {
  trialing: { label: '무료체험', cls: 'bg-priL text-priT' },
  active: { label: '활성', cls: 'bg-okL text-ok' },
  past_due: { label: '결제실패', cls: 'bg-errL text-err' },
  pending_cancel: { label: '해지예정', cls: 'bg-warnL text-warn' },
  cancelled: { label: '해지됨', cls: 'bg-bg text-t3' },
  none: { label: '미가입', cls: 'bg-bg text-t3' },
};

const PLAN_KO: Record<string, string> = { small: '소형', medium: '중형', large: '대형', popular: '중형' };
const PLAN_PRICE: Record<string, number> = { small: 30000, medium: 50000, large: 70000 };

function fmtPhone(p: string | null) {
  const d = (p ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p ?? '-';
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR');
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
function daysBetween(from: string | Date, to: string | Date = new Date()) {
  const a = typeof from === 'string' ? new Date(from) : from;
  const b = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
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
function volumeDiscount(c: number) {
  if (c >= 10) return 0.15;
  if (c >= 5) return 0.1;
  if (c >= 3) return 0.05;
  return 0;
}

type Severity = 'critical' | 'warning' | 'info';
type Issue = { severity: Severity; title: string; detail: string };

const SEV_STYLE: Record<Severity, string> = {
  critical: 'bg-errL border-err/30 text-err',
  warning: 'bg-warnL border-warn/30 text-warn',
  info: 'bg-priL border-pri/30 text-priT',
};
const SEV_DOT: Record<Severity, string> = {
  critical: 'bg-err',
  warning: 'bg-warn',
  info: 'bg-pri',
};

export default async function AdminDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reveal?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await getViewerEmail();
  const reveal = canRevealPII(viewer, sp.reveal);
  const superAdmin = isSuperAdmin(viewer);

  await logAdminAccess({
    path: `/admins/${id}`,
    viewerEmail: viewer,
    payload: { reveal, target_admin_id: id },
  });

  const supabase = createServerClient();

  const { data: adminData, error: adminErr } = await supabase
    .from('admins')
    .select('id, auth_id, name, email, phone, role, created_at, avatar_url')
    .eq('id', id)
    .maybeSingle();
  if (adminErr) console.error('[admin-detail] admin lookup error:', adminErr);
  const admin = adminData as Admin | null;

  if (!admin) {
    return (
      <div>
        <Link href="/admins" className="text-pri text-sm hover:underline">← 관리자 목록</Link>
        <div className="mt-10 text-center text-t3">관리자를 찾을 수 없습니다 (ID: {id})</div>
      </div>
    );
  }

  const [
    { data: subData },
    { data: villasData },
    { data: noticesData },
    { data: billsData },
    { data: messagesData },
  ] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, status, billing_day, card_brand, card_last4, card_expiry_year, card_expiry_month, billing_key, current_period_start, current_period_end, trial_ends_at, created_at, subscription_items ( villa_id, plan, price )')
      .eq('admin_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('villas')
      .select('id, name, address, total_units, units_per_floor, account_bank, account_number, status, created_at')
      .eq('admin_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('notices')
      .select('id, title, created_at, villas!inner(admin_id)')
      .eq('villas.admin_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('bill_months')
      .select('id, year_month, label, status, created_at, villas!inner(admin_id)')
      .eq('villas.admin_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('messages')
      .select('id, text, created_at, villas!inner(admin_id, name), units(ho_number), message_replies(id, created_at)')
      .eq('villas.admin_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  const sub = subData as Subscription | null;
  const villas = (villasData ?? []) as Villa[];
  const recentNotices = (noticesData ?? []) as Array<{ id: string; title: string; created_at: string }>;
  const recentBills = (billsData ?? []) as Array<{ id: string; year_month: string; label: string | null; status: string; created_at: string }>;
  type MessageRow = {
    id: string;
    text: string;
    created_at: string;
    villas: { name: string } | null;
    units: { ho_number: string } | null;
    message_replies: { id: string; created_at: string }[] | null;
  };
  // PostgREST 가 nested join 을 array 로 추론 → 런타임은 객체. unknown 캐스트로 우회.
  const messages = (messagesData ?? []) as unknown as MessageRow[];
  const pendingInquiries = messages.filter(m => (m.message_replies?.length ?? 0) === 0);
  const resolvedInquiries = messages.filter(m => (m.message_replies?.length ?? 0) > 0);

  const activeVillas = villas.filter(v => v.status === 'active');
  const totalUnits = activeVillas.reduce((s, v) => s + (v.total_units ?? 0), 0);

  let payments: Payment[] = [];
  if (sub?.id) {
    const { data } = await supabase
      .from('subscription_payments')
      .select('id, amount, status, created_at, error_message')
      .eq('subscription_id', sub.id)
      .order('created_at', { ascending: false })
      .limit(12);
    payments = (data ?? []) as Payment[];
  }

  // auth.users 정보 (마지막 로그인) — 서비스롤 으로 직접 조회
  let lastSignInAt: string | null = null;
  let signupConfirmedAt: string | null = null;
  if (admin.auth_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.auth_id);
      lastSignInAt = userData?.user?.last_sign_in_at ?? null;
      signupConfirmedAt = userData?.user?.email_confirmed_at ?? null;
    } catch {
      // auth 조회 실패 시 무시
    }
  }

  // ===== 이슈/경고 자동 감지 =====
  const issues: Issue[] = [];
  const subStatus = sub?.status ?? 'none';

  // 구독 미가입
  if (!sub) {
    issues.push({
      severity: 'critical',
      title: '구독 미가입',
      detail: '결제 정보가 등록되지 않아 서비스 이용이 제한될 수 있습니다',
    });
  }

  // 결제 실패 상태
  if (subStatus === 'past_due') {
    issues.push({
      severity: 'critical',
      title: '정기결제 실패 (past_due)',
      detail: '카드 결제가 거절되었습니다. CS 연락 및 카드 재등록 안내 필요',
    });
  }

  // 무료체험 종료 임박
  if (sub?.trial_ends_at) {
    const tDays = daysBetween(new Date(), sub.trial_ends_at);
    if (subStatus === 'trialing') {
      if (tDays < 0) {
        issues.push({
          severity: 'critical',
          title: '무료체험 만료됨',
          detail: `${fmtDate(sub.trial_ends_at)} 종료. 카드 등록 안 되면 곧 차단`,
        });
      } else if (tDays <= 7) {
        issues.push({
          severity: 'warning',
          title: `무료체험 D-${tDays} 종료 임박`,
          detail: `${fmtDate(sub.trial_ends_at)} 종료. 카드 등록 안내 필요`,
        });
      }
    }
  }

  // 카드 미등록 (활성 또는 체험인데 카드 없는 상태)
  if (sub && !sub.card_brand && (subStatus === 'trialing' || subStatus === 'active')) {
    issues.push({
      severity: 'warning',
      title: '결제 수단 미등록',
      detail: '카드 등록 안 되어 다음 결제가 실패할 가능성 큼',
    });
  }

  // 카드 만료 임박
  if (sub?.card_expiry_year && sub?.card_expiry_month) {
    const expiry = new Date(sub.card_expiry_year, sub.card_expiry_month, 0, 23, 59, 59);
    const dExp = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dExp < 0) {
      issues.push({
        severity: 'critical',
        title: '카드 만료됨',
        detail: `${String(sub.card_expiry_month).padStart(2, '0')}/${String(sub.card_expiry_year).slice(-2)} — 즉시 재등록 필요`,
      });
    } else if (dExp <= 30) {
      issues.push({
        severity: 'warning',
        title: `카드 만료 D-${dExp}`,
        detail: `${String(sub.card_expiry_month).padStart(2, '0')}/${String(sub.card_expiry_year).slice(-2)} — 사용자에게 안내 권장`,
      });
    }
  }

  // 최근 30일 결제 실패 건수
  const since30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentFailed = payments.filter(p => p.status === 'failed' && new Date(p.created_at).getTime() >= since30);
  if (recentFailed.length > 0) {
    issues.push({
      severity: 'warning',
      title: `최근 30일 결제 실패 ${recentFailed.length}건`,
      detail: '재시도 또는 카드 변경 안내 필요',
    });
  }

  // 빌라 0개
  if (activeVillas.length === 0) {
    issues.push({
      severity: 'info',
      title: '등록된 빌라 없음',
      detail: '가입 후 빌라 미등록 상태. 온보딩 안내 필요할 수 있음',
    });
  }

  // 미답변 민원 누적
  if (pendingInquiries.length >= 10) {
    issues.push({
      severity: 'critical',
      title: `미답변 민원 ${pendingInquiries.length}건 누적`,
      detail: '입주민 불만 폭증 위험. CS 개입 필요',
    });
  } else if (pendingInquiries.length >= 5) {
    issues.push({
      severity: 'warning',
      title: `미답변 민원 ${pendingInquiries.length}건`,
      detail: '관리자가 입주민 민원에 답변 지연 중',
    });
  }

  // 오래된 미답변 민원 (7일 이상)
  const oldPending = pendingInquiries.filter(m => daysBetween(m.created_at) >= 7);
  if (oldPending.length > 0) {
    issues.push({
      severity: 'warning',
      title: `7일+ 미답변 민원 ${oldPending.length}건`,
      detail: '장기간 답변 지연. 입주민 이탈 위험',
    });
  }

  // 장기 미활동 (마지막 로그인 30일 초과)
  if (lastSignInAt) {
    const sinceLogin = daysBetween(lastSignInAt);
    if (sinceLogin > 90) {
      issues.push({
        severity: 'warning',
        title: `장기 미접속 (${sinceLogin}일)`,
        detail: `마지막 로그인 ${fmtDate(lastSignInAt)}. 이탈 위험`,
      });
    } else if (sinceLogin > 30) {
      issues.push({
        severity: 'info',
        title: `최근 미접속 (${sinceLogin}일)`,
        detail: `마지막 로그인 ${fmtDate(lastSignInAt)}`,
      });
    }
  } else if (admin.auth_id) {
    issues.push({
      severity: 'info',
      title: '로그인 기록 없음',
      detail: '가입 후 한 번도 로그인하지 않았을 수 있음',
    });
  }

  // ===== 활동 지표 =====
  const signupDays = daysBetween(admin.created_at);
  const lastLoginDays = lastSignInAt ? daysBetween(lastSignInAt) : null;
  const lastNoticeDays = recentNotices[0] ? daysBetween(recentNotices[0].created_at) : null;
  const lastBillDays = recentBills[0] ? daysBetween(recentBills[0].created_at) : null;

  // 빌라별 subscription_items 매핑
  const itemsByVilla = new Map<string, { plan: string; price: number }>();
  for (const it of (sub?.subscription_items ?? [])) {
    if (it.villa_id) itemsByVilla.set(it.villa_id, { plan: it.plan, price: it.price });
  }

  const items = sub?.subscription_items ?? [];
  const baseAmount = items.reduce((s, it) => s + (it.price ?? 0), 0);
  const discountRate = volumeDiscount(items.length);
  const discountAmount = Math.round(baseAmount * discountRate);
  const totalMRR = baseAmount - discountAmount;

  const cardExpiryDays = (sub?.card_expiry_year && sub?.card_expiry_month)
    ? Math.floor((new Date(sub.card_expiry_year, sub.card_expiry_month, 0, 23, 59, 59).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const subStyle = STATUS_STYLE[subStatus];

  const displayName = reveal ? (admin.name ?? '(이름 없음)') : (admin.name ? maskName(admin.name) : '(이름 없음)');
  const displayEmail = reveal ? admin.email : maskEmail(admin.email);
  const displayPhone = reveal ? fmtPhone(admin.phone) : maskPhone(admin.phone);
  const crumbName = reveal ? (admin.name ?? admin.email) : (admin.name ? maskName(admin.name) : maskEmail(admin.email));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm text-t3">
          <Link href="/admins" className="hover:text-t1 transition-colors">관리자 목록</Link>
          <span>/</span>
          <span className="text-t1 font-semibold">{crumbName}</span>
        </div>
        <RevealToggle reveal={reveal} canReveal={superAdmin} />
      </div>

      <div className="bg-priL/40 border border-pri/20 text-priT rounded-[10px] px-4 py-2.5 mb-4 text-xs">
        {reveal
          ? '🔓 PII 풀 노출 모드. 모든 열람은 1년 이상 보관되는 접근로그에 기록됩니다.'
          : '🔒 이름·이메일·연락처·계좌는 마스킹 처리됩니다. 슈퍼관리자는 우측 토글로 풀 노출 가능.'}
      </div>

      {/* 프로필 */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${subStyle.cls}`}>
                {subStyle.label}
              </span>
              {admin.role === 'super' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warnL text-warn">슈퍼관리자</span>
              )}
            </div>
            <p className="text-sm text-t3 mb-4">{displayEmail}</p>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <Info label="연락처" value={displayPhone || '-'} />
              <Info label="가입일" value={`${fmtDate(admin.created_at)} (D+${signupDays})`} />
              <Info label="관리 빌라" value={`${activeVillas.length}개`} valueCls="text-pri font-bold" />
              <Info label="총 세대" value={`${totalUnits}세대`} valueCls="text-[#4DA6FF] font-bold" />
            </div>
          </div>
        </div>
      </div>

      {/* 이슈/경고 — 발견된 게 있을 때만 표시 */}
      {issues.length > 0 && (
        <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold">
              <span className="text-warn">⚠ </span>이슈 / 경고
            </h3>
            <span className="text-xs text-t3">
              {issues.filter(i => i.severity === 'critical').length} critical · {issues.filter(i => i.severity === 'warning').length} warning · {issues.filter(i => i.severity === 'info').length} info
            </span>
          </div>
          <ul className="p-3 space-y-2">
            {issues.map((iss, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border ${SEV_STYLE[iss.severity]}`}
              >
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${SEV_DOT[iss.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold mb-0.5">{iss.title}</div>
                  <div className="text-xs opacity-80">{iss.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI 3개 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="월 구독료 (MRR)"
          value={`${totalMRR.toLocaleString()}원`}
          color="text-pri"
          hint={discountRate > 0 ? `정가 ${baseAmount.toLocaleString()} · 할인 ${Math.round(discountRate * 100)}%` : '할인 없음'}
        />
        <KpiCard
          label="결제 수단"
          value={sub?.card_brand ? `${sub.card_brand} ····${sub.card_last4 ?? ''}` : '미등록'}
          color={sub?.card_brand ? 'text-t1' : 'text-t3'}
          hint={
            cardExpiryDays !== null
              ? cardExpiryDays < 0
                ? '만료됨'
                : cardExpiryDays <= 30
                ? `D-${cardExpiryDays} 만료 임박`
                : `${String(sub?.card_expiry_month).padStart(2, '0')}/${String(sub?.card_expiry_year).slice(-2)} 만료`
              : '카드 정보 없음'
          }
        />
        <KpiCard
          label="다음 결제"
          value={sub?.current_period_end ? fmtDate(sub.current_period_end) : '미정'}
          color="text-warn"
          hint={sub?.billing_day ? `매월 ${sub.billing_day}일 자동결제` : '결제일 미설정'}
        />
      </div>

      {/* 활동 지표 (사용 빈도) */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <h3 className="text-sm font-bold mb-4">활동 지표 (사용 빈도)</h3>
        <div className="grid grid-cols-5 gap-4 text-sm">
          <ActivityCell
            label="마지막 로그인"
            primary={lastLoginDays !== null ? fmtRelative(lastSignInAt) : '기록 없음'}
            secondary={lastSignInAt ? fmtDate(lastSignInAt) : '-'}
            severity={
              lastLoginDays === null
                ? 'info'
                : lastLoginDays > 90
                ? 'critical'
                : lastLoginDays > 30
                ? 'warning'
                : 'ok'
            }
          />
          <ActivityCell
            label="가입 후 경과"
            primary={`${signupDays}일`}
            secondary={fmtDate(admin.created_at)}
            severity="ok"
          />
          <ActivityCell
            label="최근 공지 작성"
            primary={lastNoticeDays !== null ? fmtRelative(recentNotices[0].created_at) : '없음'}
            secondary={recentNotices[0]?.title ? `'${recentNotices[0].title.slice(0, 16)}'` : '-'}
            severity={lastNoticeDays === null ? 'info' : lastNoticeDays > 60 ? 'warning' : 'ok'}
          />
          <ActivityCell
            label="최근 청구서 발행"
            primary={lastBillDays !== null ? fmtRelative(recentBills[0].created_at) : '없음'}
            secondary={recentBills[0]?.year_month ? `${recentBills[0].year_month} (${recentBills[0].status})` : '-'}
            severity={lastBillDays === null ? 'info' : lastBillDays > 45 ? 'warning' : 'ok'}
          />
          <ActivityCell
            label="미답변 민원"
            primary={`${pendingInquiries.length}건`}
            secondary={pendingInquiries.length > 0 ? `최근 ${fmtRelative(pendingInquiries[0].created_at)}` : '깨끗함'}
            severity={
              pendingInquiries.length >= 10
                ? 'critical'
                : pendingInquiries.length >= 5
                ? 'warning'
                : pendingInquiries.length > 0
                ? 'info'
                : 'ok'
            }
          />
        </div>
      </div>

      {/* 구독 상세 */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <h3 className="text-sm font-bold mb-4">구독 상세</h3>
        {!sub ? (
          <div className="text-t3 text-sm py-4 text-center">구독 정보 없음</div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Info label="구독 상태" value={subStyle.label} valueCls={`font-semibold ${subStyle.cls.split(' ').filter(c => c.startsWith('text-')).join(' ')}`} />
            <Info label="구독 시작" value={fmtDate(sub.created_at)} />
            <Info label="현재 결제 주기" value={`${fmtDate(sub.current_period_start)} ~ ${fmtDate(sub.current_period_end)}`} />
            <Info label="결제일" value={`매월 ${sub.billing_day}일`} />
            {sub.trial_ends_at && (
              <Info label="무료체험 종료" value={fmtDate(sub.trial_ends_at)} valueCls="text-warn font-semibold" />
            )}
            {sub.billing_key && (
              <Info label="빌링키" value={sub.billing_key.slice(0, 12) + '…'} valueCls="font-mono text-xs text-t3" />
            )}
          </div>
        )}
      </div>

      {/* 관리 빌라 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">관리 빌라 목록</h3>
          <span className="text-xs text-t3">{activeVillas.length}개 · 총 {totalUnits}세대</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">빌라명</th>
                <th className="text-left px-5 py-3 font-medium">주소</th>
                <th className="text-right px-5 py-3 font-medium">세대수</th>
                <th className="text-left px-5 py-3 font-medium">플랜</th>
                <th className="text-right px-5 py-3 font-medium">월 가격</th>
                <th className="text-left px-5 py-3 font-medium">납부 계좌</th>
              </tr>
            </thead>
            <tbody>
              {activeVillas.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-t3">등록된 빌라가 없습니다</td></tr>
              ) : (
                activeVillas.map(v => {
                  const item = itemsByVilla.get(v.id);
                  const planKey = item?.plan ?? null;
                  const planLabel = planKey ? (PLAN_KO[planKey] ?? planKey) : '미설정';
                  const price = item?.price ?? (planKey ? PLAN_PRICE[planKey] : 0);
                  const accountNumber = reveal ? v.account_number : maskAccountNumber(v.account_number);
                  const account = [v.account_bank, accountNumber].filter(Boolean).join(' ');
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-t1">{v.name}</td>
                      <td className="px-5 py-3.5 text-t2">{v.address}</td>
                      <td className="px-5 py-3.5 text-right text-t2">{v.total_units}</td>
                      <td className="px-5 py-3.5">
                        {planKey ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-priL text-priT">{planLabel}</span>
                        ) : (
                          <span className="text-xs text-t3">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">{price ? `${price.toLocaleString()}원` : '-'}</td>
                      <td className="px-5 py-3.5 text-t2 text-xs">{account || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 결제 내역 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">최근 결제 내역</h3>
          <span className="text-xs text-t3">최근 12건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">결제일시</th>
                <th className="text-right px-5 py-3 font-medium">금액</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
                <th className="text-left px-5 py-3 font-medium">메모</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-t3">결제 내역 없음</td></tr>
              ) : (
                payments.map(p => {
                  const styleMap: Record<Payment['status'], string> = {
                    success: 'bg-okL text-ok',
                    failed: 'bg-errL text-err',
                    refunded: 'bg-warnL text-warn',
                  };
                  const labelMap: Record<Payment['status'], string> = {
                    success: '성공',
                    failed: '실패',
                    refunded: '환불',
                  };
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3.5 text-t2">{fmtDateTime(p.created_at)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">{(p.amount ?? 0).toLocaleString()}원</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styleMap[p.status]}`}>
                          {labelMap[p.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-t3">{p.error_message ?? ''}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입주민 민원 — 이 관리자가 받은 민원 */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">
            <span className={pendingInquiries.length > 0 ? 'text-warn' : 'text-t1'}>
              {pendingInquiries.length > 0 ? '⚠ ' : ''}
            </span>
            입주민 민원
          </h3>
          <span className="text-xs text-t3">
            미답변 {pendingInquiries.length}건 · 답변완료 {resolvedInquiries.length}건 · 총 {messages.length}건
          </span>
        </div>
        <div className="overflow-x-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-t3 text-sm">접수된 민원이 없습니다</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-t3 text-xs">
                  <th className="text-left px-5 py-3 font-medium">접수</th>
                  <th className="text-left px-5 py-3 font-medium">빌라</th>
                  <th className="text-left px-5 py-3 font-medium">호실</th>
                  <th className="text-left px-5 py-3 font-medium">내용</th>
                  <th className="text-left px-5 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {messages.slice(0, 15).map(m => {
                  const replyCount = m.message_replies?.length ?? 0;
                  const isResolved = replyCount > 0;
                  const days = daysBetween(m.created_at);
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3.5 text-t3 text-xs whitespace-nowrap">
                        {fmtRelative(m.created_at)}
                        {!isResolved && days >= 7 && (
                          <span className="ml-1 text-err font-bold">·{days}일째</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-t2">{m.villas?.name ?? '-'}</td>
                      <td className="px-5 py-3.5 text-t2">{m.units?.ho_number ?? '-'}</td>
                      <td className="px-5 py-3.5 text-t1 max-w-md truncate" title={m.text}>{m.text}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isResolved ? 'bg-okL text-ok' : 'bg-warnL text-warn'}`}>
                          {isResolved ? `답변 ${replyCount}건` : '대기중'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {messages.length > 15 && (
            <div className="px-5 py-3 text-xs text-t3 text-center border-t border-border">
              상위 15건만 표시 · 전체 {messages.length}건
            </div>
          )}
        </div>
      </div>

      {/* 최근 공지 + 청구 — 활동 디테일 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold">최근 공지 5건</h3>
          </div>
          <div className="p-5">
            {recentNotices.length === 0 ? (
              <div className="text-center text-t3 text-sm py-4">공지 없음</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentNotices.map(n => (
                  <li key={n.id} className="flex justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-t1 truncate flex-1">{n.title}</span>
                    <span className="text-t3 text-xs whitespace-nowrap">{fmtRelative(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold">최근 청구서 5건</h3>
          </div>
          <div className="p-5">
            {recentBills.length === 0 ? (
              <div className="text-center text-t3 text-sm py-4">청구서 없음</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentBills.map(b => (
                  <li key={b.id} className="flex justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-t1 truncate flex-1">
                      {b.label ?? b.year_month}
                      <span className="ml-2 text-xs text-t3">({b.status})</span>
                    </span>
                    <span className="text-t3 text-xs whitespace-nowrap">{fmtRelative(b.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 설정 / 디버그 정보 */}
      <details className="bg-card border border-border rounded-[10px] overflow-hidden">
        <summary className="px-5 py-4 cursor-pointer text-sm font-bold">설정 / 디버그 정보</summary>
        <div className="px-5 py-4 border-t border-border text-xs text-t3 font-mono space-y-1">
          <div>admin.id: {admin.id}</div>
          <div>admin.auth_id: {admin.auth_id ?? '(없음)'}</div>
          <div>admin.role: {admin.role}</div>
          <div>admin.email: {reveal ? admin.email : maskEmail(admin.email)}</div>
          <div>auth.last_sign_in_at: {lastSignInAt ?? '(없음)'}</div>
          <div>auth.email_confirmed_at: {signupConfirmedAt ?? '(없음)'}</div>
          <div>subscription.id: {sub?.id ?? '(없음)'}</div>
          <div>subscription.billing_key: {sub?.billing_key ?? '(없음)'}</div>
        </div>
      </details>
    </div>
  );
}

function Info({ label, value, valueCls }: { label: string; value: string; valueCls?: string }) {
  return (
    <div>
      <div className="text-t3 text-xs mb-1">{label}</div>
      <div className={valueCls ?? 'text-t1 font-semibold'}>{value}</div>
    </div>
  );
}

function KpiCard({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-[10px] p-5">
      <div className="text-xs text-t3 font-medium mb-2">{label}</div>
      <div className={`text-xl font-extrabold tracking-tight ${color}`}>{value}</div>
      {hint && <div className="text-[11px] text-t3 mt-1">{hint}</div>}
    </div>
  );
}

function ActivityCell({
  label,
  primary,
  secondary,
  severity,
}: {
  label: string;
  primary: string;
  secondary: string;
  severity: 'ok' | 'warning' | 'critical' | 'info';
}) {
  const color = {
    ok: 'text-t1',
    warning: 'text-warn',
    critical: 'text-err',
    info: 'text-t3',
  }[severity];
  return (
    <div className="bg-bg border border-border rounded-lg p-3">
      <div className="text-[11px] text-t3 font-medium mb-1">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{primary}</div>
      <div className="text-[11px] text-t3 mt-0.5 truncate" title={secondary}>{secondary}</div>
    </div>
  );
}
