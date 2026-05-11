import { createServerClient } from '@/lib/supabase-server';
import VillasTable from './VillasTable';

type VillaRow = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  status: string;
  admins: { name: string | null; email: string } | null;
  units: { id: string }[] | null;
  residents_count?: number;
};

export const dynamic = 'force-dynamic';

/**
 * 주소 문자열을 도/광역시(province) + 구/시/군(district) 으로 분리.
 *
 * 예시:
 *   '서울특별시 강남구 역삼동 123' → { province: '서울', district: '강남구' }
 *   '서울 송파구 잠실동 789'        → { province: '서울', district: '송파구' }
 *   '인천 남동구 만경로8번길 3'     → { province: '인천', district: '남동구' }
 *   '경기 부천시 소사구 범안로 50'  → { province: '경기', district: '부천시 소사구' }
 *   '경기 성남시 중원구 자혜로 14'  → { province: '경기', district: '성남시 중원구' }
 *   '경기 성남시 자혜로 14'          → { province: '경기', district: '성남시' }
 */
function parseRegion(address: string | null | undefined): { province: string; district: string } {
  if (!address) return { province: '-', district: '-' };
  const parts = address.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { province: '-', district: '-' };

  // 1차: province 정규화 — 서울특별시/부산광역시/세종특별자치시/경기도 → 서울/부산/세종/경기
  let province = parts[0]
    .replace(/특별자치도$/, '')
    .replace(/특별자치시$/, '')
    .replace(/특별시$/, '')
    .replace(/광역시$/, '')
    .replace(/도$/, '');
  if (!province) province = parts[0];

  // 2차: district — parts[1] 기준, OO시 OO구 패턴이면 두 단어 결합
  let district = parts[1] ?? '-';
  if (parts.length >= 3 && parts[1]?.endsWith('시') && parts[2]?.endsWith('구')) {
    district = `${parts[1]} ${parts[2]}`;
  }

  return { province, district };
}

export default async function VillasPage() {
  const supabase = createServerClient();

  const { data: villas, error } = await supabase
    .from('villas')
    .select(`
      id, name, address, total_units, status,
      admins:admin_id ( name, email ),
      units ( id )
    `)
    .order('created_at', { ascending: false })
    .returns<VillaRow[]>();

  if (error) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-5">빌라 관리</h2>
        <div className="bg-errL text-err border border-err/30 rounded-[10px] p-5 text-sm">
          조회 실패: {error.message}
        </div>
      </div>
    );
  }

  const rows = villas ?? [];

  const unitIds = rows.flatMap((v) => (v.units ?? []).map((u) => u.id));

  const [{ data: residents }, { data: items }, { data: payments }, { data: overdueRows }] = await Promise.all([
    unitIds.length > 0
      ? supabase.from('residents').select('unit_id').in('unit_id', unitIds).eq('status', 'active')
      : Promise.resolve({ data: [] as { unit_id: string }[] }),
    supabase.from('subscription_items').select('villa_id, plan, price'),
    unitIds.length > 0
      ? supabase.from('payments').select('unit_id, is_paid, bill_month_id, bill_months!inner(villa_id)').in('unit_id', unitIds)
      : Promise.resolve({ data: [] as Array<{ unit_id: string; is_paid: boolean; bill_months: { villa_id: string } }> }),
    supabase
      .from('villa_overdue_summary')
      .select('villa_id, overdue_amount_total, overdue_unit_count, overdue_bill_count')
      .returns<Array<{ villa_id: string; overdue_amount_total: number; overdue_unit_count: number; overdue_bill_count: number }>>(),
  ]);

  const residentsByUnit = new Map<string, number>();
  (residents ?? []).forEach((r) => {
    residentsByUnit.set(r.unit_id, (residentsByUnit.get(r.unit_id) ?? 0) + 1);
  });

  const planByVilla = new Map<string, { plan: string; price: number }>();
  (items ?? []).forEach((it) => {
    planByVilla.set(it.villa_id, { plan: it.plan, price: it.price });
  });

  const payRateByVilla = new Map<string, number>();
  const payCountByVilla = new Map<string, { paid: number; total: number }>();
  (payments ?? []).forEach((p) => {
    const villaId = (p as unknown as { bill_months: { villa_id: string } }).bill_months.villa_id;
    const cur = payCountByVilla.get(villaId) ?? { paid: 0, total: 0 };
    cur.total++;
    if (p.is_paid) cur.paid++;
    payCountByVilla.set(villaId, cur);
  });
  payCountByVilla.forEach((v, k) => {
    payRateByVilla.set(k, v.total > 0 ? Math.round((v.paid / v.total) * 100) : 0);
  });

  const PLAN_KO: Record<string, string> = { small: '소형', popular: '중형', large: '대형' };

  const overdueByVilla = new Map<string, { amount: number; units: number; bills: number }>();
  (overdueRows ?? []).forEach((r) => {
    overdueByVilla.set(r.villa_id, {
      amount: r.overdue_amount_total ?? 0,
      units: r.overdue_unit_count ?? 0,
      bills: r.overdue_bill_count ?? 0,
    });
  });

  const enriched = rows.map((v) => {
    const units = v.units?.length ?? v.total_units ?? 0;
    const residentCount = (v.units ?? []).reduce((s, u) => s + (residentsByUnit.get(u.id) ?? 0), 0);
    const planInfo = planByVilla.get(v.id);
    const payRate = payRateByVilla.get(v.id) ?? 0;
    const overdue = overdueByVilla.get(v.id) ?? { amount: 0, units: 0, bills: 0 };
    const region = parseRegion(v.address);
    return {
      id: v.id,
      name: v.name,
      address: v.address,
      admin: v.admins?.name ?? v.admins?.email ?? '-',
      units,
      plan: planInfo ? PLAN_KO[planInfo.plan] ?? planInfo.plan : '-',
      price: planInfo?.price ?? 0,
      payRate,
      residents: residentCount,
      province: region.province,
      district: region.district,
      overdueAmount: overdue.amount,
      overdueUnits: overdue.units,
    };
  });

  return <VillasTable villas={enriched} />;
}
