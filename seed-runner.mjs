import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_KIM = '11111111-1111-1111-1111-111111111111';
const ADMIN_PARK = '22222222-2222-2222-2222-222222222222';
const ADMIN_LEE = '33333333-3333-3333-3333-333333333333';

const VILLA_SEONLEUNG = 'a1111111-1111-1111-1111-111111111111';
const VILLA_YEOKSAM = 'a2222222-2222-2222-2222-222222222222';
const VILLA_JAMSIL = 'b1111111-1111-1111-1111-111111111111';
const VILLA_GANGNAM = 'b2222222-2222-2222-2222-222222222222';
const VILLA_SEONGBUK = 'c1111111-1111-1111-1111-111111111111';

const SUB_KIM = '51111111-1111-1111-1111-111111111111';
const SUB_PARK = '52222222-2222-2222-2222-222222222222';
const SUB_LEE = '53333333-3333-3333-3333-333333333333';

const VILLA_IDS = [VILLA_SEONLEUNG, VILLA_YEOKSAM, VILLA_JAMSIL, VILLA_GANGNAM, VILLA_SEONGBUK];

const ymd = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

async function step(label, fn) {
  process.stdout.write(`▶ ${label}... `);
  try {
    const result = await fn();
    console.log(`✅ ${result ?? ''}`);
    return result;
  } catch (e) {
    console.log(`❌`);
    console.error(`  ${e.message ?? e}`);
    throw e;
  }
}

async function upsert(table, rows, conflict = 'id') {
  const { error } = await sb.from(table).upsert(rows, { onConflict: conflict, ignoreDuplicates: true });
  if (error) throw error;
  return `${rows.length} rows`;
}

(async () => {
  // 1. admins (auth_id null - 로그인 불가, 화면 검증용)
  await step('admins (3)', () => upsert('admins', [
    { id: ADMIN_KIM, auth_id: null, email: 'kim@villa.kr', name: '김철수', phone: '01012340001', role: 'admin', created_at: ymd(-90) },
    { id: ADMIN_PARK, auth_id: null, email: 'park@villa.kr', name: '박영희', phone: '01012340002', role: 'admin', created_at: ymd(-60) },
    { id: ADMIN_LEE, auth_id: null, email: 'lee@villa.kr', name: '이민호', phone: '01012340003', role: 'admin', created_at: ymd(-30) },
  ]));

  // 2. villas
  await step('villas (5)', () => upsert('villas', [
    { id: VILLA_SEONLEUNG, admin_id: ADMIN_KIM, name: '선릉파크빌', address: '서울 강남구 선릉로 123', total_units: 8, units_per_floor: 2, account_bank: '국민은행', account_number: '123-456-789012', account_holder: '김철수', status: 'active', created_at: ymd(-90) },
    { id: VILLA_YEOKSAM, admin_id: ADMIN_KIM, name: '역삼그린빌', address: '서울 강남구 역삼동 456', total_units: 12, units_per_floor: 2, account_bank: '신한은행', account_number: '110-987-654321', account_holder: '김철수', status: 'active', created_at: ymd(-60) },
    { id: VILLA_JAMSIL, admin_id: ADMIN_PARK, name: '잠실리버뷰', address: '서울 송파구 잠실동 789', total_units: 15, units_per_floor: 3, account_bank: '우리은행', account_number: '1002-456-7890', account_holder: '박영희', status: 'active', created_at: ymd(-60) },
    { id: VILLA_GANGNAM, admin_id: ADMIN_PARK, name: '강남힐스테이트', address: '서울 강남구 논현동 11', total_units: 20, units_per_floor: 2, account_bank: '하나은행', account_number: '234-567-890123', account_holder: '박영희', status: 'active', created_at: ymd(-30) },
    { id: VILLA_SEONGBUK, admin_id: ADMIN_LEE, name: '성북아트빌', address: '서울 성북구 성북동 88', total_units: 6, units_per_floor: 2, account_bank: '농협', account_number: '301-1234-5678', account_holder: '이민호', status: 'active', created_at: ymd(-20) },
  ]));

  // 3. units 자동 생성
  const villaSpecs = [
    { id: VILLA_SEONLEUNG, total: 8, perFloor: 2 },
    { id: VILLA_YEOKSAM, total: 12, perFloor: 2 },
    { id: VILLA_JAMSIL, total: 15, perFloor: 3 },
    { id: VILLA_GANGNAM, total: 20, perFloor: 2 },
    { id: VILLA_SEONGBUK, total: 6, perFloor: 2 },
  ];
  const unitsRows = [];
  for (const v of villaSpecs) {
    for (let i = 1; i <= v.total; i++) {
      const floor = Math.floor((i - 1) / v.perFloor) + 1;
      const unit = ((i - 1) % v.perFloor) + 1;
      const ho = `${floor}${String(unit).padStart(2, '0')}`;
      unitsRows.push({ villa_id: v.id, ho_number: ho, floor });
    }
  }
  await step(`units (${unitsRows.length})`, () => upsert('units', unitsRows, 'villa_id,ho_number'));

  // 4. residents (각 빌라 ho_number 기준 첫 4개)
  const residentNames = ['홍길동', '김순자', '이영자', '박철수'];
  const { data: allUnits, error: unitsErr } = await sb.from('units').select('id,villa_id,ho_number').in('villa_id', VILLA_IDS).order('ho_number');
  if (unitsErr) throw unitsErr;

  const residentsRows = [];
  let phoneCounter = 0;
  for (const villaId of VILLA_IDS) {
    const villaUnits = allUnits.filter(u => u.villa_id === villaId).sort((a, b) => a.ho_number.localeCompare(b.ho_number)).slice(0, 4);
    villaUnits.forEach((u, idx) => {
      phoneCounter++;
      residentsRows.push({
        unit_id: u.id,
        name: residentNames[idx] ?? '박철수',
        phone: `010${String(1000 + phoneCounter).padStart(4, '0')}${String(2000 + phoneCounter).padStart(4, '0')}`,
        is_owner: true,
        status: 'active',
      });
    });
  }
  await step(`residents (${residentsRows.length})`, () => upsert('residents', residentsRows, 'unit_id,phone'));

  // 5. subscriptions
  await step('subscriptions (3)', () => upsert('subscriptions', [
    { id: SUB_KIM, admin_id: ADMIN_KIM, status: 'active', billing_day: 15, current_period_start: ymd(-15), current_period_end: ymd(15), card_brand: '신한카드', card_last4: '4512' },
    { id: SUB_PARK, admin_id: ADMIN_PARK, status: 'active', billing_day: 1, current_period_start: ymd(-5), current_period_end: ymd(25), card_brand: '국민카드', card_last4: '1234' },
    { id: SUB_LEE, admin_id: ADMIN_LEE, status: 'trialing', billing_day: 28, current_period_start: ymd(0), current_period_end: ymd(30) },
  ]));

  // 6. subscription_items
  const subItemsRows = villaSpecs.map(v => {
    const adminId = [VILLA_SEONLEUNG, VILLA_YEOKSAM].includes(v.id) ? ADMIN_KIM : ([VILLA_JAMSIL, VILLA_GANGNAM].includes(v.id) ? ADMIN_PARK : ADMIN_LEE);
    const subId = adminId === ADMIN_KIM ? SUB_KIM : adminId === ADMIN_PARK ? SUB_PARK : SUB_LEE;
    const plan = v.total <= 8 ? 'small' : v.total <= 15 ? 'popular' : 'large';
    const price = v.total <= 8 ? 30000 : v.total <= 15 ? 50000 : 70000;
    return { subscription_id: subId, villa_id: v.id, plan, price };
  });
  await step(`subscription_items (${subItemsRows.length})`, () => upsert('subscription_items', subItemsRows, 'subscription_id,villa_id'));

  // 7. bill_months (a1, b1만)
  const ym = new Date().toISOString().slice(0, 7);
  const ymLabel = `${ym.slice(0, 4)}년 ${ym.slice(5, 7)}월`;
  const billRows = [
    { villa_id: VILLA_SEONLEUNG, year_month: ym, label: ymLabel, status: 'published', created_at: ymd(-5) },
    { villa_id: VILLA_JAMSIL, year_month: ym, label: ymLabel, status: 'published', created_at: ymd(-5) },
  ];
  const { data: insertedBills, error: billErr } = await sb.from('bill_months').upsert(billRows, { onConflict: 'villa_id,year_month', ignoreDuplicates: false }).select();
  if (billErr) throw billErr;
  console.log(`▶ bill_months (${insertedBills.length})... ✅`);

  // 8. bill_items
  const itemTemplate = [
    { name: '공용전기', amount: 180000 },
    { name: '상하수도', amount: 220000 },
    { name: '청소용역', amount: 150000 },
    { name: '소독/방역', amount: 50000 },
  ];
  const billItemsRows = [];
  for (const bm of insertedBills) {
    for (const it of itemTemplate) {
      billItemsRows.push({ bill_month_id: bm.id, ...it });
    }
  }
  // bill_items 중복방지 위해 일단 기존 삭제 후 재삽입 (UNIQUE 제약 없음)
  await step('bill_items 기존 정리', async () => {
    const { error } = await sb.from('bill_items').delete().in('bill_month_id', insertedBills.map(b => b.id));
    if (error) throw error;
    return 'cleaned';
  });
  await step(`bill_items (${billItemsRows.length})`, async () => {
    const { error } = await sb.from('bill_items').insert(billItemsRows);
    if (error) throw error;
    return `${billItemsRows.length} rows`;
  });

  // 9. payments (각 빌라 세대수로 분배, 60% 납부)
  const paymentsRows = [];
  for (const bm of insertedBills) {
    const villaUnits = allUnits.filter(u => u.villa_id === bm.villa_id);
    const totalAmount = itemTemplate.reduce((s, it) => s + it.amount, 0);
    const perUnit = Math.round(totalAmount / villaUnits.length);
    for (const u of villaUnits) {
      paymentsRows.push({
        bill_month_id: bm.id,
        unit_id: u.id,
        amount: perUnit,
        is_paid: Math.random() < 0.6,
      });
    }
  }
  await step(`payments (${paymentsRows.length})`, () => upsert('payments', paymentsRows, 'bill_month_id,unit_id'));

  // 10. notices
  await step('notices (3)', async () => {
    const rows = [
      { villa_id: VILLA_SEONLEUNG, title: '4월 정기 청소 안내', body: '4월 30일(수) 오전 9시부터 외부 정기 청소가 진행됩니다. 차량 이동 부탁드립니다.', is_pinned: true },
      { villa_id: VILLA_SEONLEUNG, title: '4월 관리비 청구', body: '4월 관리비가 청구되었습니다. 25일까지 납부 부탁드립니다.', is_pinned: false },
      { villa_id: VILLA_JAMSIL, title: '엘리베이터 정기점검', body: '5월 5일(월) 14:00~16:00 엘리베이터 정기점검이 예정되어 있습니다.', is_pinned: false },
    ];
    const { error } = await sb.from('notices').insert(rows);
    if (error) throw error;
    return `${rows.length} rows`;
  });

  // 11. messages (specific units lookup)
  const seonleungUnit101 = allUnits.find(u => u.villa_id === VILLA_SEONLEUNG && u.ho_number === '101');
  const jamsilUnit102 = allUnits.find(u => u.villa_id === VILLA_JAMSIL && u.ho_number === '102');
  await step('messages (2)', async () => {
    const rows = [
      { villa_id: VILLA_SEONLEUNG, unit_id: seonleungUnit101?.id ?? null, text: '복도 전등이 깜빡거립니다. 수리 부탁드립니다.', is_read: false, category: 'maintenance' },
      { villa_id: VILLA_JAMSIL, unit_id: jamsilUnit102?.id ?? null, text: '주차장 위층에서 물이 새는 것 같아요. 확인 부탁드립니다.', is_read: false, category: 'maintenance' },
    ];
    const { error } = await sb.from('messages').insert(rows);
    if (error) throw error;
    return `${rows.length} rows`;
  });

  // 12. subscription_payments
  await step('subscription_payments (4)', async () => {
    const rows = [
      { subscription_id: SUB_KIM, amount: 80000, status: 'success', toss_payment_key: 'toss_test_001', created_at: ymd(-15) },
      { subscription_id: SUB_KIM, amount: 80000, status: 'success', toss_payment_key: 'toss_test_002', created_at: ymd(-45) },
      { subscription_id: SUB_PARK, amount: 120000, status: 'success', toss_payment_key: 'toss_test_003', created_at: ymd(-5) },
      { subscription_id: SUB_PARK, amount: 120000, status: 'failed', toss_payment_key: null, created_at: ymd(-35) },
    ];
    const { error } = await sb.from('subscription_payments').insert(rows);
    if (error) throw error;
    return `${rows.length} rows`;
  });

  // 결과 요약
  console.log('\n========== 시딩 완료 ==========');
  for (const t of ['admins', 'villas', 'units', 'residents', 'subscriptions', 'subscription_items', 'bill_months', 'bill_items', 'payments', 'notices', 'messages', 'subscription_payments']) {
    const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t}: ${count}`);
  }
})().catch(e => { console.error('\n시딩 실패:', e.message ?? e); process.exit(1); });
