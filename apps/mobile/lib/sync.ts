// Supabase ↔ store.ts 동기화 레이어
// store.ts의 객체 구조를 유지하면서 Supabase 데이터로 덮어쓴다.
// 각 screen은 store 접근 패턴을 유지하고, 실제 저장/조회는 여기서 처리.
//
// 페이지네이션 정책 (10만 사용자 대비):
// - bill_months: 최근 6개월만 (이전 데이터는 누적 통계 view 로 별도 조회)
// - notices/messages/posts: 최근 50건만 (오래된 글은 Realtime 푸시로만 추가)
import { supabase } from './supabase';
import { store, notify, type Villa, type Resident, type SubStatus } from './store';

// 최근 N개월 cutoff (year_month 'YYYY-MM' 형식) — bill_months 페이지네이션용
const RECENT_MONTHS_WINDOW = 6;
function recentMonthsCutoffYM(): string {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (RECENT_MONTHS_WINDOW - 1), 1);
  return `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;
}

// 빌라당 최근 N건만 (notices/messages/posts) — supabase-js 의 nested limit
// PostgREST 11+ 는 per-parent 적용, 그 이하면 글로벌이지만 어쨌든 상한이 걸림
const RECENT_LIST_LIMIT = 50;

const MONTH_LABEL = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
};

const FMT_DATE = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const IS_NEW = (iso: string) => Date.now() - new Date(iso).getTime() < 3 * 24 * 60 * 60 * 1000;

const PLAN_KO: Record<string, string> = { small: '소형', popular: '중형', large: '대형' };

type VillaRaw = {
  id: string; name: string; address: string;
  total_units: number; units_per_floor: number;
  account_bank: string | null; account_number: string | null;
  units: Array<{ id: string; ho_number: string; floor: number | null; residents: Array<{ name: string; phone: string; status: string }> }>;
  bill_months: Array<{ id: string; year_month: string; label: string | null; status: 'draft' | 'published' | 'closed'; bill_items: Array<{ name: string; amount: number }> }>;
  notices: Array<{ id: string; title: string; body: string; created_at: string; is_pinned?: boolean }>;
  messages: Array<{ id: string; text: string; is_read: boolean; created_at: string; unit_id: string | null; resident_id: string | null; message_replies: Array<{ text: string; author_type: string; author_name: string | null; created_at: string }> }>;
  parking: Array<{ id: string; plate_number: string; vehicle_type: 'resident' | 'visitor'; memo: string | null; unit_id: string | null; expires_at?: string | null }>;
  posts?: Array<{ id: string; title: string | null; body: string; likes: number; created_at: string; resident_id: string | null; comments: Array<{ text: string; created_at: string; resident_id: string | null }> }>;
  subscription_items: Array<{ plan: string; price: number }>;
};

function toVilla(v: VillaRaw, paymentMap: Map<string, Set<string>>): Villa {
  const unitIdToHo = new Map<string, string>();
  const units = (v.units ?? []).map((u) => {
    unitIdToHo.set(u.id, u.ho_number);
    const active = u.residents?.find((r) => r.status === 'active');
    return {
      ho: u.ho_number,
      floor: u.floor ?? 0,
      name: active?.name ?? '',
      phone: active?.phone ?? '',
    };
  });

  // 최근 6개월만 — 서버 nested 필터는 supabase-js v2 에서 LEFT JOIN 시
  // 의도와 다르게 동작할 수 있어 클라이언트에서 처리.
  const cutoffYM = recentMonthsCutoffYM();
  const billMonths = (v.bill_months ?? []).filter((b) => b.year_month >= cutoffYM).map((b) => {
    const paidHos = paymentMap.get(b.id) ?? new Set<string>();
    const paid: Record<string, boolean> = {};
    paidHos.forEach((ho) => { paid[ho] = true; });
    return {
      id: b.id,
      yearMonth: b.year_month,
      label: b.label ?? MONTH_LABEL(b.year_month),
      status: b.status,
      items: (b.bill_items ?? []).map((i) => ({ name: i.name, amount: i.amount })),
      paid,
    };
  }).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));

  const notices = (v.notices ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    date: FMT_DATE(n.created_at),
    isNew: IS_NEW(n.created_at),
    isPinned: !!n.is_pinned,
  })).sort((a, b) => {
    if (!!b.isPinned !== !!a.isPinned) return Number(!!b.isPinned) - Number(!!a.isPinned);
    return b.id.localeCompare(a.id);
  });

  const messages = (v.messages ?? []).map((m) => ({
    id: m.id,
    from: unitIdToHo.get(m.unit_id ?? '') ?? '',
    fromName: '',
    text: m.text,
    date: FMT_DATE(m.created_at),
    read: m.is_read,
    replies: (m.message_replies ?? []).map((r) => ({
      text: r.text,
      from: r.author_name ?? (r.author_type === 'admin' ? '관리자' : '입주민'),
      date: FMT_DATE(r.created_at),
    })),
  })).sort((a, b) => b.id.localeCompare(a.id));

  const parking = (v.parking ?? []).map((p) => ({
    id: p.id,
    ho: unitIdToHo.get(p.unit_id ?? '') ?? '방문',
    plate: p.plate_number,
    type: p.vehicle_type,
    memo: p.memo ?? undefined,
    expiresAt: p.expires_at ?? undefined,
  }));

  const community = (v.posts ?? []).map((p) => ({
    id: p.id,
    from: '',
    fromName: '',
    title: p.title ?? '',
    body: p.body,
    date: FMT_DATE(p.created_at),
    likes: p.likes,
    comments: (p.comments ?? []).map((c) => ({
      from: '',
      fromName: '',
      text: c.text,
      date: FMT_DATE(c.created_at),
    })),
  }));

  const item = v.subscription_items?.[0];
  const plan = item ? PLAN_KO[item.plan] ?? item.plan : '';
  const price = item?.price ?? 0;

  return {
    id: v.id,
    name: v.name,
    address: v.address,
    totalUnits: v.total_units,
    unitsPerFloor: v.units_per_floor,
    account: [v.account_bank, v.account_number].filter(Boolean).join(' '),
    plan, price,
    units, billMonths, notices, messages, parking, community,
  };
}

export async function syncAdminFromSupabase() {
  console.log('[sync] start');

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) console.warn('[sync] auth.getUser error:', userErr.message);
  if (!user) {
    console.log('[sync] no auth user');
    return false;
  }
  console.log('[sync] auth user:', user.id);

  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .select('id, name, phone, email')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (adminErr) console.warn('[sync] admin lookup error:', adminErr.message);
  if (!admin) {
    console.warn('[sync] admin row not found for auth_id', user.id);
    return false;
  }
  console.log('[sync] admin:', admin.id);

  store.admin = { id: admin.id, name: admin.name ?? '관리자', phone: admin.phone ?? '', email: admin.email ?? '' };

  // 구독 — 다중 row 가능성 회피 위해 limit(1) 명시
  const { data: subRows, error: subErr } = await supabase
    .from('subscriptions')
    .select('id, status, card_brand, card_last4, billing_day, current_period_start, current_period_end')
    .eq('admin_id', admin.id)
    .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
    .order('created_at', { ascending: false })
    .limit(1);
  if (subErr) console.warn('[sync] subscription lookup error:', subErr.message);
  const sub = subRows?.[0];
  console.log('[sync] subscription:', sub?.id ?? '(none)', sub?.status ?? '');

  if (sub) {
    store.subscription = {
      status: sub.status as SubStatus,
      cardBrand: sub.card_brand ?? '',
      cardLast4: sub.card_last4 ?? '',
      billingDay: sub.billing_day ?? 1,
      nextBilling: sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('ko-KR') : '',
      startDate: sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString('ko-KR') : '',
    };
  }

  // 단순 빌라 쿼리 — nested join 실패 시에도 무조건 villa 는 잡힘.
  const { data: simpleVillas, error: villaErr } = await supabase
    .from('villas')
    .select('id, name, address, total_units, units_per_floor, account_bank, account_number')
    .eq('admin_id', admin.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (villaErr) {
    console.error('[sync] villas query error:', villaErr.message);
    notify();
    return false;
  }
  console.log('[sync] villas (simple):', simpleVillas?.length ?? 0);

  if (!simpleVillas || simpleVillas.length === 0) {
    store.villas = [];
    notify();
    return true;
  }

  const villaIds = simpleVillas.map((v) => v.id);

  // 관련 리소스 병렬 fetch — 한 쿼리가 실패해도 다른 데이터는 살림.
  const [
    unitsRes,
    billMonthsRes,
    noticesRes,
    messagesRes,
    parkingRes,
    postsRes,
    subItemsRes,
  ] = await Promise.all([
    supabase
      .from('units')
      .select('id, villa_id, ho_number, floor, residents ( name, phone, status )')
      .in('villa_id', villaIds),
    supabase
      .from('bill_months')
      .select('id, villa_id, year_month, label, status, bill_items ( name, amount )')
      .in('villa_id', villaIds),
    supabase
      .from('notices')
      .select('id, villa_id, title, body, created_at, is_pinned')
      .in('villa_id', villaIds)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT * villaIds.length),
    supabase
      .from('messages')
      .select('id, villa_id, text, is_read, created_at, unit_id, resident_id, message_replies ( text, author_type, author_name, created_at )')
      .in('villa_id', villaIds)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT * villaIds.length),
    supabase
      .from('parking')
      .select('id, villa_id, plate_number, vehicle_type, memo, unit_id, expires_at')
      .in('villa_id', villaIds),
    supabase
      .from('posts')
      .select('id, villa_id, title, body, likes, created_at, resident_id, comments ( text, created_at, resident_id )')
      .in('villa_id', villaIds)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIST_LIMIT * villaIds.length),
    sub
      ? supabase
          .from('subscription_items')
          .select('villa_id, plan, price')
          .eq('subscription_id', sub.id)
      : Promise.resolve({ data: [] as Array<{ villa_id: string; plan: string; price: number }>, error: null }),
  ]);

  if (unitsRes.error) console.warn('[sync] units error:', unitsRes.error.message);
  if (billMonthsRes.error) console.warn('[sync] bill_months error:', billMonthsRes.error.message);
  if (noticesRes.error) console.warn('[sync] notices error:', noticesRes.error.message);
  if (messagesRes.error) console.warn('[sync] messages error:', messagesRes.error.message);
  if (parkingRes.error) console.warn('[sync] parking error:', parkingRes.error.message);
  if (postsRes.error) console.warn('[sync] posts error:', postsRes.error.message);
  if (subItemsRes.error) console.warn('[sync] subscription_items error:', subItemsRes.error.message);

  console.log(
    '[sync] related counts —',
    'units:', unitsRes.data?.length ?? 0,
    'bill_months:', billMonthsRes.data?.length ?? 0,
    'notices:', noticesRes.data?.length ?? 0,
    'messages:', messagesRes.data?.length ?? 0,
    'parking:', parkingRes.data?.length ?? 0,
    'posts:', postsRes.data?.length ?? 0,
    'sub_items:', subItemsRes.data?.length ?? 0,
  );

  // villa_id 기준으로 그룹핑
  type UnitRow = { id: string; villa_id: string; ho_number: string; floor: number | null; residents: Array<{ name: string; phone: string; status: string }> };
  type BMRow = { id: string; villa_id: string; year_month: string; label: string | null; status: 'draft'|'published'|'closed'; bill_items: Array<{ name: string; amount: number }> };
  type NoticeRow = { id: string; villa_id: string; title: string; body: string; created_at: string; is_pinned?: boolean };
  type MsgRow = { id: string; villa_id: string; text: string; is_read: boolean; created_at: string; unit_id: string | null; resident_id: string | null; message_replies: Array<{ text: string; author_type: string; author_name: string | null; created_at: string }> };
  type ParkRow = { id: string; villa_id: string; plate_number: string; vehicle_type: 'resident'|'visitor'; memo: string | null; unit_id: string | null; expires_at: string | null };
  type PostRow = { id: string; villa_id: string; title: string | null; body: string; likes: number; created_at: string; resident_id: string | null; comments: Array<{ text: string; created_at: string; resident_id: string | null }> };

  const groupBy = <T extends { villa_id: string }>(arr: T[] | null | undefined): Record<string, T[]> => {
    const m: Record<string, T[]> = {};
    (arr ?? []).forEach((row) => {
      (m[row.villa_id] = m[row.villa_id] ?? []).push(row);
    });
    return m;
  };

  const unitsByVilla = groupBy(unitsRes.data as UnitRow[] | null);
  const bmByVilla = groupBy(billMonthsRes.data as BMRow[] | null);
  const noticesByVilla = groupBy(noticesRes.data as NoticeRow[] | null);
  const msgsByVilla = groupBy(messagesRes.data as MsgRow[] | null);
  const parkByVilla = groupBy(parkingRes.data as ParkRow[] | null);
  const postsByVilla = groupBy(postsRes.data as PostRow[] | null);

  const subItemByVilla: Record<string, { plan: string; price: number }> = {};
  (subItemsRes.data ?? []).forEach((it: { villa_id: string; plan: string; price: number }) => {
    subItemByVilla[it.villa_id] = { plan: it.plan, price: it.price };
  });

  const villaList: VillaRaw[] = simpleVillas.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    total_units: v.total_units,
    units_per_floor: v.units_per_floor,
    account_bank: v.account_bank,
    account_number: v.account_number,
    units: unitsByVilla[v.id] ?? [],
    bill_months: bmByVilla[v.id] ?? [],
    notices: noticesByVilla[v.id] ?? [],
    messages: msgsByVilla[v.id] ?? [],
    parking: parkByVilla[v.id] ?? [],
    posts: postsByVilla[v.id] ?? [],
    subscription_items: subItemByVilla[v.id] ? [subItemByVilla[v.id]] : [],
  }));

  const billMonthIds = villaList.flatMap((v) => (v.bill_months ?? []).map((b) => b.id));
  const paymentMap = new Map<string, Set<string>>();
  if (billMonthIds.length > 0) {
    const { data: payments } = await supabase
      .from('payments')
      .select('bill_month_id, is_paid, units!inner(ho_number)')
      .in('bill_month_id', billMonthIds)
      .eq('is_paid', true);
    // supabase-js 가 N:1 관계를 배열로 잘못 추론 — 런타임은 객체 1개. as any 로 우회.
    (payments ?? []).forEach((p: any) => {
      const set = paymentMap.get(p.bill_month_id) ?? new Set<string>();
      set.add(p.units.ho_number);
      paymentMap.set(p.bill_month_id, set);
    });
  }

  store.villas = villaList.map((v) => toVilla(v, paymentMap));
  console.log('[sync] done — store.villas:', store.villas.length);
  notify();
  return true;
}

export async function syncResidentFromSupabase(phone: string, name: string): Promise<Resident | null> {
  const normalized = phone.replace(/\D/g, '');
  const { data: residents } = await supabase
    .from('residents')
    .select('id, name, phone, unit_id, units!inner(id, ho_number, villas!inner(id, name))')
    .eq('phone', normalized)
    .eq('name', name)
    .eq('status', 'active');

  const first = residents?.[0] as
    | { id: string; name: string; phone: string; units: { ho_number: string; villas: { id: string; name: string } } }
    | undefined;
  if (!first) return null;

  const villaId = first.units.villas.id;
  const resident: Resident = {
    name: first.name,
    phone: first.phone,
    ho: first.units.ho_number,
    villaId,
    villaName: first.units.villas.name,
  };
  store.loggedResident = resident;
  store.loggedVillaId = villaId;

  try {
    const { saveResidentPushToken } = await import('./notifications');
    await saveResidentPushToken(first.id);
  } catch {}

  const { data: villaRaw } = await supabase
    .from('villas')
    .select(`
      id, name, address, total_units, units_per_floor, account_bank, account_number,
      units ( id, ho_number, floor, residents ( name, phone, status ) ),
      bill_months ( id, year_month, label, status, bill_items ( name, amount ) ),
      notices ( id, title, body, created_at, is_pinned ),
      messages ( id, text, is_read, created_at, unit_id, resident_id, message_replies ( text, author_type, author_name, created_at ) ),
      parking ( id, plate_number, vehicle_type, memo, unit_id ),
      posts ( id, title, body, likes, created_at, resident_id, comments ( text, created_at, resident_id ) )
    `)
    .eq('id', villaId)
    .order('created_at', { ascending: false, referencedTable: 'notices' })
    .limit(RECENT_LIST_LIMIT, { referencedTable: 'notices' })
    .order('created_at', { ascending: false, referencedTable: 'messages' })
    .limit(RECENT_LIST_LIMIT, { referencedTable: 'messages' })
    .order('created_at', { ascending: false, referencedTable: 'posts' })
    .limit(RECENT_LIST_LIMIT, { referencedTable: 'posts' })
    .single();

  if (villaRaw) {
    const billMonthIds = (villaRaw as unknown as { bill_months: { id: string }[] }).bill_months?.map((b) => b.id) ?? [];
    const paymentMap = new Map<string, Set<string>>();
    if (billMonthIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('bill_month_id, is_paid, units!inner(ho_number)')
        .in('bill_month_id', billMonthIds)
        .eq('is_paid', true);
      // supabase-js 가 N:1 관계를 배열로 잘못 추론 — 런타임은 객체 1개. as any 로 우회.
    (payments ?? []).forEach((p: any) => {
        const set = paymentMap.get(p.bill_month_id) ?? new Set<string>();
        set.add(p.units.ho_number);
        paymentMap.set(p.bill_month_id, set);
      });
    }
    store.villas = [toVilla({ ...(villaRaw as unknown as VillaRaw), subscription_items: [] }, paymentMap)];
  }

  notify();
  return resident;
}

export async function clearStore() {
  store.villas = [];
  store.loggedResident = null;
  store.loggedVillaId = null;
  store.admin = {
    id: '',
    name: '',
    phone: '',
    email: '',
  };
  store.subscription = {
    status: 'none',
    cardBrand: '',
    cardLast4: '',
    billingDay: 1,
    nextBilling: '',
    startDate: '',
  };
  notify();
}
