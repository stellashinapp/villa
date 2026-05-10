import { supabase } from './supabase';
import { getMyAdmin } from './auth';
import { planFor } from '@villatolk/shared';

/**
 * 내 빌라 목록 조회
 */
export async function getMyVillas() {
  const { data, error } = await supabase
    .from('villas')
    .select('*, units(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 빌라 상세 조회 (세대, 입주민 포함)
 */
export async function getVillaDetail(villaId: string) {
  const { data, error } = await supabase
    .from('villas')
    .select(`
      *,
      units(*, residents(*)),
      bill_months(*, bill_items(*)),
      notices(*),
      messages(*, message_replies(*)),
      parking(*)
    `)
    .eq('id', villaId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 빌라 등록 + 세대 자동 생성 + 구독 아이템 추가
 */
export async function createVilla(params: {
  name: string;
  address: string;
  totalUnits: number;
  unitsPerFloor: number;
  accountBank?: string;
  accountNumber?: string;
  accountHolder?: string;
}) {
  const admin = await getMyAdmin();
  if (!admin) throw new Error('로그인이 필요합니다');

  // 1) 빌라 생성
  const { data: villa, error: villaError } = await supabase
    .from('villas')
    .insert({
      admin_id: admin.id,
      name: params.name,
      address: params.address,
      total_units: params.totalUnits,
      units_per_floor: params.unitsPerFloor,
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      account_holder: params.accountHolder,
    })
    .select()
    .single();

  if (villaError) throw new Error(villaError.message);

  // 2) 세대 자동 생성
  const units = [];
  for (let i = 0; i < params.totalUnits; i++) {
    const floor = Math.floor(i / params.unitsPerFloor) + 1;
    const num = (i % params.unitsPerFloor) + 1;
    units.push({
      villa_id: villa.id,
      ho_number: `${floor}${String(num).padStart(2, '0')}호`,
      floor,
    });
  }

  const { error: unitsError } = await supabase.from('units').insert(units);
  if (unitsError) throw new Error(unitsError.message);

  // 3) 구독 아이템 추가 (기존 구독이 있으면)
  // .maybeSingle() 사용 — 다중 row / 0 row 모두 throw 없이 처리.
  // 구독이 없거나 RLS race 로 못 찾아도 빌라 생성 자체는 성공시킨다.
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('admin_id', admin.id)
    .in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription) {
    const plan = planFor(params.totalUnits);
    const { error: itemError } = await supabase.from('subscription_items').insert({
      subscription_id: subscription.id,
      villa_id: villa.id,
      plan: plan.plan,
      price: plan.price,
    });
    if (itemError) {
      // subscription_items 누락은 빌라 표시에 직접적 영향 없음 (sync 가 left join).
      // 단 결제 갱신 시 가격 계산이 빠질 수 있으므로 경고 로그.
      console.warn('[createVilla] subscription_items insert failed:', itemError.message);
    }
  } else {
    console.warn('[createVilla] no active subscription found — subscription_items 미생성');
  }

  return villa;
}

/**
 * 빌라 정보 수정
 */
export async function updateVilla(villaId: string, updates: {
  name?: string;
  address?: string;
  account_bank?: string;
  account_number?: string;
  account_holder?: string;
}) {
  const { data, error } = await supabase
    .from('villas')
    .update(updates)
    .eq('id', villaId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
