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
export interface CreateVillaFloor {
  label: string; // '1', '2', 'B1' 등 — 호수 prefix
  units: Array<{ name: string }>; // 호실 이름 목록 (예: '101호', 'B101호')
}

export async function createVilla(params: {
  name: string;
  address: string;
  totalUnits: number;
  unitsPerFloor: number;
  /** 사용자가 직접 구성한 층/호수 — 있으면 이걸 우선 사용 (자동생성 X) */
  floorPlan?: CreateVillaFloor[];
  accountBank?: string;
  accountNumber?: string;
  accountHolder?: string;
}) {
  console.log('[createVilla] start', { name: params.name, units: params.totalUnits, floorPlan: !!params.floorPlan });
  const admin = await getMyAdmin();
  if (!admin) {
    console.error('[createVilla] no admin (not logged in)');
    throw new Error('로그인이 필요합니다');
  }
  console.log('[createVilla] admin:', admin.id);

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

  if (villaError) {
    console.error('[createVilla] villa insert failed:', villaError);
    throw new Error(`빌라 INSERT 실패: ${villaError.message}`);
  }
  console.log('[createVilla] villa inserted:', villa.id);

  // 2) 세대 — floorPlan 이 있으면 사용자 구성 그대로, 없으면 자동 생성
  const unitsToInsert: Array<{ villa_id: string; ho_number: string; floor: number | null }> = [];
  if (params.floorPlan && params.floorPlan.length > 0) {
    params.floorPlan.forEach((fl) => {
      // floor 숫자: 'B1' → -1, '1' → 1, '옥탑' 같은 텍스트 → null
      const floorNum = fl.label.startsWith('B')
        ? -parseInt(fl.label.slice(1), 10) || null
        : parseInt(fl.label, 10) || null;
      fl.units.forEach((u) => {
        unitsToInsert.push({
          villa_id: villa.id,
          ho_number: u.name,
          floor: floorNum,
        });
      });
    });
  } else {
    for (let i = 0; i < params.totalUnits; i++) {
      const floor = Math.floor(i / params.unitsPerFloor) + 1;
      const num = (i % params.unitsPerFloor) + 1;
      unitsToInsert.push({
        villa_id: villa.id,
        ho_number: `${floor}${String(num).padStart(2, '0')}호`,
        floor,
      });
    }
  }

  const { error: unitsError } = await supabase.from('units').insert(unitsToInsert);
  if (unitsError) {
    console.error('[createVilla] units insert failed:', unitsError);
    throw new Error(`세대 INSERT 실패: ${unitsError.message}`);
  }
  console.log('[createVilla] units inserted:', unitsToInsert.length);

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
    } else {
      console.log('[createVilla] subscription_items inserted');
    }
  } else {
    console.warn('[createVilla] no active subscription found — subscription_items 미생성');
  }
  console.log('[createVilla] done — returning villa', villa.id);

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
