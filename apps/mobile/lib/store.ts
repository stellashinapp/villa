/**
 * 전역 Mock 데이터 스토어
 * Supabase 연동 전까지 앱 전체가 이 데이터를 공유합니다.
 * 관리자가 수정하면 → 입주민 화면에 반영
 */
import { supabase as _supabase } from './supabase';

let listeners: (() => void)[] = [];
export function subscribe(fn: () => void) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }
export function notify() { listeners.forEach(fn => fn()); }

// 개발 편의: Supabase 연결 실패 시에도 UI가 동작하도록 백그라운드 write 유지
function bgWrite<T>(label: string, p: Promise<T>): Promise<T | null> {
  return p.catch((err) => {
    console.warn(`[store:${label}]`, err?.message ?? err);
    return null;
  });
}

// ============================================================
// 구독 상태
// ============================================================
export type SubStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled';
export const store = {
  // 관리자
  admin: {
    id: 'admin-1',
    name: '관리자',
    phone: '010-9999-0000',
    email: 'admin@test.com',
  },

  // 구독
  subscription: {
    status: 'none' as SubStatus,
    cardBrand: '',
    cardLast4: '',
    billingDay: 1,
    nextBilling: '',
    startDate: '',
  },

  // 빌라 목록
  villas: [] as Villa[],

  // 현재 로그인된 입주민
  loggedResident: null as Resident | null,
  loggedVillaId: null as string | null,
};

// ============================================================
// 타입
// ============================================================
export interface Villa {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  unitsPerFloor: number;
  account: string;
  plan: string;
  price: number;
  units: Unit[];
  billMonths: BillMonth[];
  notices: Notice[];
  messages: Message[];
  parking: ParkingItem[];
  community: Post[];
}

export interface Unit {
  ho: string;
  floor: number;
  name: string;
  phone: string;
}

export interface BillMonth {
  id: string;
  yearMonth: string;
  label: string;
  status: 'draft' | 'published' | 'closed';
  items: { name: string; amount: number }[];
  paid: Record<string, boolean>; // ho → paid
  paidInfo?: Record<string, { method?: string; paidAt?: string }>; // ho → 납부 메타
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  date: string;
  isNew: boolean;
  isPinned?: boolean;
}

export interface Message {
  id: string;
  from: string; // ho
  fromName: string;
  text: string;
  date: string;
  read: boolean;
  replies: { text: string; from: string; date: string }[];
}

export interface ParkingItem {
  id: string;
  ho: string;
  plate: string;
  type: 'resident' | 'visitor';
  memo?: string;
  expiresAt?: string; // ISO timestamp; 방문차량 자동 만료 처리에 사용
}

export interface Post {
  id: string;
  from: string;
  fromName: string;
  title: string;
  body: string;
  date: string;
  likes: number;
  comments: { from: string; fromName: string; text: string; date: string }[];
}

export interface Resident {
  name: string;
  phone: string;
  ho: string;
  villaId: string;
  villaName: string;
}

// ============================================================
// 액션
// ============================================================
const now = () => {
  const d = new Date();
  return `${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')}`;
};
let nextId = 100;
const genId = () => String(nextId++);

// 구독 등록
export function activateSubscription() {
  store.subscription = {
    status: 'trialing',
    cardBrand: '등록카드',
    cardLast4: '0000',
    billingDay: 1,
    nextBilling: '2026.05.01',
    startDate: '2026.' + now(),
  };
  notify();
}

// 빌라 추가
export function addVilla(params: { name: string; address: string; totalUnits: number; unitsPerFloor: number; account: string }) {
  const plan = params.totalUnits <= 8 ? '소형' : params.totalUnits <= 15 ? '인기' : '대형';
  const price = params.totalUnits <= 8 ? 30000 : params.totalUnits <= 15 ? 50000 : 70000;
  const units: Unit[] = [];
  for (let i = 0; i < params.totalUnits; i++) {
    const floor = Math.floor(i / params.unitsPerFloor) + 1;
    const num = (i % params.unitsPerFloor) + 1;
    units.push({ ho: `${floor}${String(num).padStart(2, '0')}호`, floor, name: '', phone: '' });
  }
  const villa: Villa = {
    id: genId(),
    ...params,
    plan,
    price,
    units,
    billMonths: [],
    notices: [],
    messages: [],
    parking: [],
    community: [],
  };
  store.villas.push(villa);
  if (store.subscription.status === 'none') {
    activateSubscription();
  }
  notify();
  return villa;
}

// 입주민 등록 (로컬 즉시 반영 + Supabase 영속화)
export function registerResident(villaId: string, ho: string, name: string, phone: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const unit = villa.units.find(u => u.ho === ho);
  if (!unit) return;
  unit.name = name;
  unit.phone = phone;
  notify();
  bgWrite('registerResident', (async () => {
    const { supabase } = await import('./supabase');
    const normalizedPhone = phone.replace(/\D/g, '');
    const { data: unitRow } = await supabase
      .from('units')
      .select('id')
      .eq('villa_id', villaId)
      .eq('ho_number', ho)
      .maybeSingle();
    if (!unitRow) return;
    const { data: existing } = await supabase
      .from('residents')
      .select('id')
      .eq('unit_id', unitRow.id)
      .eq('phone', normalizedPhone)
      .maybeSingle();
    if (existing) {
      await supabase.from('residents').update({ name, status: 'active' }).eq('id', existing.id);
    } else {
      await supabase.from('residents').insert({
        unit_id: unitRow.id,
        name,
        phone: normalizedPhone,
        status: 'active',
        is_owner: false,
      });
    }
  })());
}

// 관리비 월 생성
export function createBillMonth(villaId: string, yearMonth: string, label: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  if (villa.billMonths.find(b => b.yearMonth === yearMonth)) return;
  const localId = genId();
  villa.billMonths.push({ id: localId, yearMonth, label, status: 'draft', items: [], paid: {} });
  notify();
  bgWrite('createBillMonth', (async () => {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.from('bill_months').insert({
      villa_id: villaId,
      year_month: yearMonth,
      label,
      status: 'draft',
    }).select().single();
    if (data) {
      const m = villa.billMonths.find(x => x.id === localId);
      if (m) { m.id = data.id; notify(); }
    }
  })());
}

// 전월 항목 복사 (관리자 노가다 방지)
export function copyBillItemsFromPrevious(villaId: string, monthId: string): number {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return 0;
  const target = villa.billMonths.find(m => m.id === monthId);
  if (!target) return 0;
  // 대상 월보다 이전 + 항목이 있는 가장 최근 월
  const prev = [...villa.billMonths]
    .filter(m => m.id !== monthId && m.items.length > 0 && m.yearMonth < target.yearMonth)
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))[0];
  if (!prev) return 0;
  // 이미 항목이 있으면 덮어쓰지 않음
  if (target.items.length > 0) return 0;
  prev.items.forEach(it => addBillItem(villaId, monthId, it.name, it.amount));
  return prev.items.length;
}

// 관리비 항목 추가
export function addBillItem(villaId: string, monthId: string, name: string, amount: number) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const month = villa.billMonths.find(m => m.id === monthId);
  if (!month) return;
  month.items.push({ name, amount });
  notify();
  bgWrite('addBillItem', (async () => {
    const { supabase } = await import('./supabase');
    if (monthId.length < 32) return; // local-only id, skip
    await supabase.from('bill_items').insert({
      bill_month_id: monthId,
      name,
      amount,
    });
  })());
}

// 관리비 항목 삭제
export function removeBillItem(villaId: string, monthId: string, idx: number) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const month = villa.billMonths.find(m => m.id === monthId);
  if (!month) return;
  const removed = month.items[idx];
  month.items.splice(idx, 1);
  notify();
  bgWrite('removeBillItem', (async () => {
    const { supabase } = await import('./supabase');
    if (monthId.length < 32 || !removed) return;
    await supabase.from('bill_items')
      .delete()
      .eq('bill_month_id', monthId)
      .eq('name', removed.name)
      .eq('amount', removed.amount);
  })());
}

// 관리비 발행
export function publishBill(villaId: string, monthId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const month = villa.billMonths.find(m => m.id === monthId);
  if (!month) return;
  month.status = 'published';
  const total = month.items.reduce((s, i) => s + i.amount, 0);
  const perUnit = villa.units.length > 0 ? Math.round(total / villa.units.length) : 0;
  villa.notices.unshift({
    id: genId(),
    title: `${month.label} 관리비 고지`,
    body: `${month.label} 관리비가 고지되었습니다.\n세대별 ${perUnit.toLocaleString()}원\n\n납부계좌: ${villa.account}\n※ 기한 내 납부 부탁드립니다.`,
    date: now(),
    isNew: true,
  });
  notify();
  bgWrite('publishBill', (async () => {
    const { supabase } = await import('./supabase');
    if (monthId.length < 32) return;
    await supabase.from('bill_months').update({
      status: 'published',
      notification_sent_at: new Date().toISOString(),
    }).eq('id', monthId);

    const { data: units } = await supabase
      .from('units')
      .select('id')
      .eq('villa_id', villaId);
    if (units && units.length > 0) {
      const payments = units.map((u: { id: string }) => ({
        bill_month_id: monthId,
        unit_id: u.id,
        amount: perUnit,
        is_paid: false,
      }));
      await supabase.from('payments').insert(payments);
    }
  })());
}

// 관리비 월 마감 (published → closed)
export function closeBillMonth(villaId: string, monthId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const month = villa.billMonths.find(m => m.id === monthId);
  if (!month) return;
  month.status = 'closed';
  notify();
  bgWrite('closeBillMonth', (async () => {
    const { supabase } = await import('./supabase');
    if (monthId.length < 32) return;
    await supabase.from('bill_months').update({ status: 'closed' }).eq('id', monthId);
  })());
}

// 납부 처리
export function confirmPayment(villaId: string, monthId: string, ho: string, method: string = 'bank_transfer') {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const month = villa.billMonths.find(m => m.id === monthId);
  if (!month) return;
  month.paid[ho] = true;
  if (!month.paidInfo) month.paidInfo = {};
  month.paidInfo[ho] = { method, paidAt: new Date().toISOString() };
  notify();
  bgWrite('confirmPayment', (async () => {
    const { supabase } = await import('./supabase');
    if (monthId.length < 32) return;
    const { data: unitRow } = await supabase
      .from('units')
      .select('id')
      .eq('villa_id', villaId)
      .eq('ho_number', ho)
      .maybeSingle();
    if (!unitRow) return;
    await supabase.from('payments').update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      method,
      confirmed_by: store.admin.name ?? 'admin',
    }).eq('bill_month_id', monthId).eq('unit_id', unitRow.id);
  })());
}

// 입주민 이사 처리 (호실은 유지하고 이름/전화 비움 + Supabase status='moved_out')
export function moveOutResident(villaId: string, ho: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const unit = villa.units.find(u => u.ho === ho);
  if (!unit) return;
  const prevPhone = unit.phone;
  const prevName = unit.name;
  unit.name = '';
  unit.phone = '';
  notify();
  bgWrite('moveOutResident', (async () => {
    const { supabase } = await import('./supabase');
    const normalized = (prevPhone ?? '').replace(/\D/g, '');
    if (!normalized) return;
    const { data: unitRow } = await supabase
      .from('units')
      .select('id')
      .eq('villa_id', villaId)
      .eq('ho_number', ho)
      .maybeSingle();
    if (!unitRow) return;
    await supabase
      .from('residents')
      .update({
        status: 'moved_out',
        move_out_date: new Date().toISOString().slice(0, 10),
      })
      .eq('unit_id', unitRow.id)
      .eq('phone', normalized)
      .eq('name', prevName);
  })());
}

// 공지 추가
export function addNotice(villaId: string, title: string, body: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const localId = genId();
  villa.notices.unshift({ id: localId, title, body, date: now(), isNew: true, isPinned: false });
  notify();
  bgWrite('addNotice', (async () => {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.from('notices').insert({ villa_id: villaId, title, body }).select().single();
    if (data) {
      const n = villa.notices.find(x => x.id === localId);
      if (n) { n.id = data.id; notify(); }
    }
  })());
}

// 공지 수정
export function updateNotice(villaId: string, noticeId: string, title: string, body: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const n = villa.notices.find(x => x.id === noticeId);
  if (!n) return;
  n.title = title;
  n.body = body;
  notify();
  bgWrite('updateNotice', (async () => {
    const { supabase } = await import('./supabase');
    if (noticeId.length < 32) return;
    await supabase.from('notices').update({ title, body }).eq('id', noticeId);
  })());
}

// 공지 삭제
export function removeNotice(villaId: string, noticeId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  villa.notices = villa.notices.filter(x => x.id !== noticeId);
  notify();
  bgWrite('removeNotice', (async () => {
    const { supabase } = await import('./supabase');
    if (noticeId.length < 32) return;
    await supabase.from('notices').delete().eq('id', noticeId);
  })());
}

// 공지 고정/해제 토글
export function togglePinNotice(villaId: string, noticeId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const n = villa.notices.find(x => x.id === noticeId);
  if (!n) return;
  n.isPinned = !n.isPinned;
  // 고정 공지는 위로 정렬
  villa.notices.sort((a, b) => {
    if (!!b.isPinned !== !!a.isPinned) return Number(!!b.isPinned) - Number(!!a.isPinned);
    return 0;
  });
  notify();
  bgWrite('togglePinNotice', (async () => {
    const { supabase } = await import('./supabase');
    if (noticeId.length < 32) return;
    await supabase.from('notices').update({ is_pinned: n.isPinned ?? false }).eq('id', noticeId);
  })());
}

// 메시지 보내기 (입주민 → 관리자)
export function sendMessage(villaId: string, ho: string, fromName: string, text: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const localId = genId();
  villa.messages.unshift({ id: localId, from: ho, fromName, text, date: now(), read: false, replies: [] });
  notify();
  bgWrite('sendMessage', (async () => {
    const { supabase } = await import('./supabase');
    const unit = villa.units.find(u => u.ho === ho);
    let unitId: string | null = null;
    let residentId: string | null = null;
    if (unit) {
      const { data: unitRow } = await supabase.from('units').select('id').eq('villa_id', villaId).eq('ho_number', ho).maybeSingle();
      if (unitRow) {
        unitId = unitRow.id;
        const { data: r } = await supabase.from('residents').select('id').eq('unit_id', unitId).eq('name', unit.name).maybeSingle();
        if (r) residentId = r.id;
      }
    }
    const { data } = await supabase.from('messages').insert({
      villa_id: villaId,
      unit_id: unitId,
      resident_id: residentId,
      text,
      is_read: false,
    }).select().single();
    if (data) {
      const m = villa.messages.find(x => x.id === localId);
      if (m) { m.id = data.id; notify(); }
    }
  })());
}

// 메시지 답변 (관리자 → 입주민)
export function replyMessage(villaId: string, msgId: string, text: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const msg = villa.messages.find(m => m.id === msgId);
  if (!msg) return;
  msg.replies.push({ text, from: '관리자', date: now() });
  msg.read = true;
  notify();
  bgWrite('replyMessage', (async () => {
    const { supabase } = await import('./supabase');
    if (msgId.length < 32) return;
    await supabase.from('message_replies').insert({
      message_id: msgId,
      text,
      author_type: 'admin',
      author_name: store.admin.name,
    });
    await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
  })());
}

// 입주민 추가 답글 (입주민 → 관리자, 같은 thread)
export function addResidentReply(villaId: string, msgId: string, text: string, fromName: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const msg = villa.messages.find(m => m.id === msgId);
  if (!msg) return;
  msg.replies.push({ text, from: fromName, date: now() });
  msg.read = false; // 관리자가 다시 확인해야 함
  notify();
  bgWrite('addResidentReply', (async () => {
    const { supabase } = await import('./supabase');
    if (msgId.length < 32) return;
    await supabase.from('message_replies').insert({
      message_id: msgId,
      text,
      author_type: 'resident',
      author_name: fromName,
    });
    await supabase.from('messages').update({ is_read: false }).eq('id', msgId);
  })());
}

// 주차 등록
export function addParking(
  villaId: string,
  ho: string,
  plate: string,
  type: 'resident' | 'visitor',
  memo?: string,
  expiresAt?: string,
) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const localId = genId();
  villa.parking.push({ id: localId, ho, plate, type, memo, expiresAt });
  notify();
  bgWrite('addParking', (async () => {
    const { supabase } = await import('./supabase');
    const { data: unitRow } = await supabase.from('units').select('id').eq('villa_id', villaId).eq('ho_number', ho).maybeSingle();
    const { data } = await supabase.from('parking').insert({
      villa_id: villaId,
      unit_id: unitRow?.id ?? null,
      plate_number: plate,
      vehicle_type: type,
      memo: memo ?? null,
      expires_at: expiresAt ?? null,
    }).select().single();
    if (data) {
      const p = villa.parking.find(x => x.id === localId);
      if (p) { p.id = data.id; notify(); }
    }
  })());
}

// 주차 삭제
export function removeParking(villaId: string, parkingId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  villa.parking = villa.parking.filter(p => p.id !== parkingId);
  notify();
  bgWrite('removeParking', (async () => {
    const { supabase } = await import('./supabase');
    await supabase.from('parking').delete().eq('id', parkingId);
  })());
}

// 커뮤니티 글 등록
export function addPost(villaId: string, from: string, fromName: string, title: string, body: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const localId = genId();
  villa.community.unshift({ id: localId, from, fromName, title, body, date: now(), likes: 0, comments: [] });
  notify();
  bgWrite('addPost', (async () => {
    let unitId: string | null = null;
    let residentId: string | null = null;
    if (from) {
      const { data: unitRow } = await _supabase
        .from('units')
        .select('id')
        .eq('villa_id', villaId)
        .eq('ho_number', from)
        .maybeSingle();
      if (unitRow) {
        unitId = unitRow.id;
        const resident = store.loggedResident;
        if (resident && resident.ho === from) {
          const normalized = resident.phone.replace(/\D/g, '');
          const { data: r } = await _supabase
            .from('residents')
            .select('id')
            .eq('unit_id', unitId)
            .eq('phone', normalized)
            .eq('name', resident.name)
            .maybeSingle();
          if (r) residentId = r.id;
        }
      }
    }
    const { data } = await _supabase.from('posts').insert({
      villa_id: villaId,
      unit_id: unitId,
      resident_id: residentId,
      title,
      body,
      likes: 0,
    }).select().single();
    if (data) {
      const p = villa.community.find(x => x.id === localId);
      if (p) { p.id = data.id; notify(); }
    }
  })());
}

// 커뮤니티 댓글
export function addComment(villaId: string, postId: string, from: string, fromName: string, text: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const post = villa.community.find(p => p.id === postId);
  if (!post) return;
  post.comments.push({ from, fromName, text, date: now() });
  notify();
  bgWrite('addComment', (async () => {
    if (postId.length < 32) return; // local-only id, skip
    let unitId: string | null = null;
    let residentId: string | null = null;
    if (from) {
      const { data: unitRow } = await _supabase
        .from('units')
        .select('id')
        .eq('villa_id', villaId)
        .eq('ho_number', from)
        .maybeSingle();
      if (unitRow) {
        unitId = unitRow.id;
        const resident = store.loggedResident;
        if (resident && resident.ho === from) {
          const normalized = resident.phone.replace(/\D/g, '');
          const { data: r } = await _supabase
            .from('residents')
            .select('id')
            .eq('unit_id', unitId)
            .eq('phone', normalized)
            .eq('name', resident.name)
            .maybeSingle();
          if (r) residentId = r.id;
        }
      }
    }
    await _supabase.from('comments').insert({
      post_id: postId,
      unit_id: unitId,
      resident_id: residentId,
      text,
    });
  })());
}

// 좋아요
export function likePost(villaId: string, postId: string) {
  const villa = store.villas.find(v => v.id === villaId);
  if (!villa) return;
  const post = villa.community.find(p => p.id === postId);
  if (!post) return;
  post.likes++;
  notify();
  bgWrite('likePost', (async () => {
    if (postId.length < 32) return; // local-only id, skip
    await _supabase.from('posts').update({ likes: post.likes }).eq('id', postId);
  })());
}

// 입주민 로그인
export function residentLogin(name: string, phone: string): Resident | null {
  for (const villa of store.villas) {
    const unit = villa.units.find(u => u.name === name && u.phone === phone);
    if (unit) {
      const resident: Resident = { name, phone, ho: unit.ho, villaId: villa.id, villaName: villa.name };
      store.loggedResident = resident;
      store.loggedVillaId = villa.id;
      notify();
      return resident;
    }
  }
  return null;
}

// ============================================================
// 데모 초기 데이터 (빌라 1개 + 입주민 8명 + 관리비 + 공지 + 메시지)
// ============================================================
export function loadDemoData() {
  store.subscription = {
    status: 'active',
    cardBrand: '신한카드',
    cardLast4: '4512',
    billingDay: 1,
    nextBilling: '2026.05.01',
    startDate: '2026.01.01',
  };

  const villa: Villa = {
    id: 'demo-1',
    name: '해피빌라',
    address: '서울 마포구 연남동 123-4',
    totalUnits: 8,
    unitsPerFloor: 2,
    account: '국민 123-456-789012',
    plan: '소형',
    price: 30000,
    units: [
      { ho: '101호', floor: 1, name: '김민수', phone: '010-1234-5678' },
      { ho: '102호', floor: 1, name: '이서희', phone: '010-2345-6789' },
      { ho: '201호', floor: 2, name: '박준영', phone: '010-3456-7890' },
      { ho: '202호', floor: 2, name: '최수연', phone: '010-4567-8901' },
      { ho: '301호', floor: 3, name: '정다은', phone: '010-5678-9012' },
      { ho: '302호', floor: 3, name: '강하준', phone: '010-6789-0123' },
      { ho: '401호', floor: 4, name: '오지훈', phone: '010-7890-1234' },
      { ho: '402호', floor: 4, name: '윤서영', phone: '010-8901-2345' },
    ],
    billMonths: [
      {
        id: 'bill-1', yearMonth: '2026-03', label: '2026년 3월', status: 'published',
        items: [
          { name: '공용전기', amount: 189000 }, { name: '상하수도', amount: 234000 },
          { name: '건물보험', amount: 124000 }, { name: '청소용역', amount: 200000 },
          { name: '소독/방역', amount: 80000 }, { name: '수선충당금', amount: 50000 },
        ],
        paid: { '102호': true, '202호': true, '302호': true, '402호': true },
      },
      {
        id: 'bill-2', yearMonth: '2026-02', label: '2026년 2월', status: 'closed',
        items: [
          { name: '공용전기', amount: 201000 }, { name: '상하수도', amount: 218000 },
          { name: '건물보험', amount: 124000 }, { name: '청소용역', amount: 200000 },
          { name: '수선충당금', amount: 50000 },
        ],
        paid: { '101호': true, '102호': true, '201호': true, '202호': true, '301호': true, '302호': true, '401호': true, '402호': true },
      },
    ],
    notices: [
      { id: 'n1', title: '3월 관리비 정산 안내', body: '3월 관리비가 정산되었습니다. 세대별 109,625원이며, 25일까지 납부 부탁드립니다.\n\n납부계좌: 국민 123-456-789012', date: '03.08', isNew: true, isPinned: false },
      { id: 'n2', title: '외벽 도색 공사 안내', body: '3/15~3/20 외벽 도색 공사가 진행됩니다.\n공사 시간: 오전 9시 ~ 오후 6시', date: '03.05', isNew: false, isPinned: false },
    ],
    messages: [
      { id: 'm1', from: '301호', fromName: '정다은', text: '3층 복도 전등이 깜빡여요. 수리 부탁드립니다.', date: '03.09', read: false, replies: [] },
      { id: 'm2', from: '102호', fromName: '이서희', text: '관리비 계좌 확인 부탁드립니다.', date: '03.07', read: true, replies: [{ text: '국민 123-456-789012 입니다.', from: '관리자', date: '03.07' }] },
    ],
    parking: [
      { id: 'p1', ho: '101호', plate: '12가 3456', type: 'resident' },
      { id: 'p2', ho: '201호', plate: '34나 7890', type: 'resident' },
      { id: 'p3', ho: '방문', plate: '56다 1234', type: 'visitor', memo: '102호 손님' },
    ],
    community: [
      { id: 'c1', from: '201호', fromName: '박준영', title: '이번 주말 장터 바비큐 하실 분?', body: '토요일 저녁 6시쯤 장터에서 고기 구울려고 합니다. 참여하실 분~', date: '03.10', likes: 5, comments: [{ from: '302호', fromName: '강하준', text: '참여합니다!', date: '03.10' }] },
    ],
  };

  store.villas = [villa];
  notify();
}

// 실서비스: 데모 데이터 자동 로드 비활성화 (로그인 시 Supabase sync로 채워짐)
// 필요 시 콘솔에서 loadDemoData() 수동 호출
