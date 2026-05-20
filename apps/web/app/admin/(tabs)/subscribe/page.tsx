'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminTopBar from '@/components/AdminTopBar';
import { registerBillingKey, isTossLive } from '@/lib/payments';
import { planFor, calcMRR, calcRawTotal, discountRate, formatKRW, TRIAL_DAYS } from '@villatolk/shared';

type Villa = { id: string; name: string; total_units: number };
type Subscription = {
  id: string; status: string; billing_key: string | null;
  card_brand: string | null; card_last4: string | null; trial_ends_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  trialing: '무료체험 중', active: '구독 중', past_due: '결제 실패', cancelled: '해지됨', pending_cancel: '해지 예정',
};

export default function AdminSubscribePage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [villas, setVillas] = useState<Villa[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/admin/login'); return; }
    const { data: a } = await supabase.from('admins').select('id, name').eq('auth_id', user.id).maybeSingle();
    if (!a) { router.replace('/admin/login'); return; }
    const aid = (a as { id: string; name: string | null }).id;
    setAdminId(aid);
    setAdminName((a as { name: string | null }).name ?? '');

    const [{ data: vs }, { data: s }] = await Promise.all([
      supabase.from('villas').select('id, name, total_units').eq('admin_id', aid).eq('status', 'active').order('created_at'),
      supabase.from('subscriptions').select('id, status, billing_key, card_brand, card_last4, trial_ends_at')
        .eq('admin_id', aid).in('status', ['trialing', 'active', 'past_due', 'pending_cancel'])
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setVillas((vs ?? []) as Villa[]);
    setSub((s ?? null) as Subscription | null);
    setLoading(false);
  }

  // 빌라별 플랜 + 합계
  const items = villas.map(v => ({ villa: v, ...planFor(v.total_units) }));
  const rawTotal = calcRawTotal(items.map(i => ({ price: i.price })));
  const mrr = calcMRR(items.map(i => ({ price: i.price })));
  const discount = discountRate(villas.length);

  // 카드 등록 → 무료체험 시작 (구독 + 항목 생성)
  async function startTrial() {
    if (!adminId) return;
    if (villas.length === 0) { alert('먼저 빌라를 1개 이상 등록해주세요.'); return; }
    setProcessing(true);
    try {
      const bk = await registerBillingKey({ residentId: adminId, customerName: adminName });
      if (!bk.ok || !bk.billingKey) { alert('카드 등록 실패: ' + (bk.message ?? '')); setProcessing(false); return; }

      const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString();
      const { data: subRow, error: subErr } = await supabase.from('subscriptions').insert({
        admin_id: adminId, status: 'trialing',
        billing_key: bk.billingKey, card_brand: bk.cardCompany, card_last4: bk.cardLast4,
        trial_ends_at: trialEnds,
      }).select('id').single();
      if (subErr || !subRow) { alert('구독 생성 실패: ' + (subErr?.message ?? '')); setProcessing(false); return; }
      const subId = (subRow as { id: string }).id;

      const rows = items.map(i => ({ subscription_id: subId, villa_id: i.villa.id, plan: i.plan, price: i.price }));
      await supabase.from('subscription_items').insert(rows);

      if (bk.stub) {
        alert(`✓ 카드 등록 완료 (테스트 모드)\n\n${TRIAL_DAYS}일 무료 체험이 시작되었습니다.\n체험 종료 후 매월 ${formatKRW(mrr)}이 자동 결제됩니다.\n(운영키 셋업 후 실제 카드 등록)`);
      }
      await load();
    } catch (e) {
      alert('처리 중 오류: ' + (e instanceof Error ? e.message : ''));
    }
    setProcessing(false);
  }

  async function changeCard() {
    if (!adminId || !sub) return;
    setProcessing(true);
    const bk = await registerBillingKey({ residentId: adminId, customerName: adminName });
    if (bk.ok && bk.billingKey) {
      await supabase.from('subscriptions').update({
        billing_key: bk.billingKey, card_brand: bk.cardCompany, card_last4: bk.cardLast4,
      }).eq('id', sub.id);
      await load();
    }
    setProcessing(false);
  }

  async function cancelSub() {
    if (!sub) return;
    if (!confirm('구독을 해지하시겠습니까?\n현재 결제 주기까지는 이용 가능하며, 이후 자동 결제가 중단됩니다.')) return;
    await supabase.from('subscriptions').update({ status: 'pending_cancel', cancelled_at: new Date().toISOString() }).eq('id', sub.id);
    await load();
  }

  const trialDays = sub?.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000)) : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[14px] text-[#9CA3AF]">불러오는 중…</div>;

  return (
    <>
      <AdminTopBar title="구독" subtitle={sub ? STATUS_LABEL[sub.status] ?? sub.status : '카드 등록하고 무료로 시작하세요'} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {/* 현재 상태 카드 */}
        {sub ? (
          <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-md mb-4">
            <p className="text-[12px] font-bold opacity-80">{STATUS_LABEL[sub.status] ?? sub.status}{sub.status === 'trialing' && trialDays !== null ? ` · D-${trialDays}` : ''}</p>
            <p className="text-[26px] font-black mt-1">{formatKRW(mrr)}<span className="text-[14px] font-bold opacity-80"> / 월</span></p>
            {discount > 0 && <p className="text-[12px] opacity-85 mt-1">{villas.length}개 빌라 · {Math.round(discount * 100)}% 볼륨 할인 적용</p>}
            {sub.card_last4 && <p className="text-[12px] opacity-90 mt-2">{sub.card_brand} ····{sub.card_last4}</p>}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-xl p-5 text-white shadow-md mb-4 text-center">
            <p className="text-[13px] font-bold opacity-85">{TRIAL_DAYS}일 무료 체험</p>
            <p className="text-[22px] font-black mt-1">카드 등록하고 바로 시작</p>
            <p className="text-[12px] opacity-85 mt-1.5">체험 기간 중에는 요금이 청구되지 않습니다.</p>
          </div>
        )}

        {/* 빌라별 자동 배치된 구독 상품 */}
        <h2 className="text-[15px] font-extrabold text-[#0F2242] mb-2">빌라별 구독 상품</h2>
        <p className="text-[13px] text-[#6B7280] mb-3">세대 수에 따라 자동으로 상품이 배치됩니다.</p>
        <div className="space-y-2 mb-3">
          {items.length === 0 ? (
            <div className="bg-white border border-[#F0F2F5] rounded-xl p-6 text-center text-[14px] text-[#9CA3AF]">
              등록된 빌라가 없습니다
            </div>
          ) : items.map(i => (
            <div key={i.villa.id} className="bg-white border border-[#F0F2F5] rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-[#0F2242] truncate">{i.villa.name}</p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">{i.name} · {i.villa.total_units}세대 ({i.range})</p>
              </div>
              <p className="text-[15px] font-bold text-[#2B2BEE] ml-3 whitespace-nowrap">{formatKRW(i.price)}</p>
            </div>
          ))}
        </div>

        {/* 합계 */}
        {items.length > 0 && (
          <div className="bg-white border border-[#F0F2F5] rounded-xl p-4 shadow-sm mb-4">
            <div className="flex justify-between text-[14px] text-[#6B7280]">
              <span>상품 합계</span><span>{formatKRW(rawTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[14px] text-[#2B2BEE] mt-1">
                <span>볼륨 할인 ({Math.round(discount * 100)}%)</span><span>-{formatKRW(rawTotal - mrr)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-[#F0F2F5]">
              <span className="text-[15px] font-bold text-[#0F2242]">월 결제액</span>
              <span className="text-[18px] font-black text-[#2B2BEE]">{formatKRW(mrr)}</span>
            </div>
          </div>
        )}

        {!isTossLive && <p className="text-[12px] text-[#2B2BEE] mb-3 text-center">⚠ 현재 테스트 모드 — 운영키 셋업 후 실제 카드 등록·결제됩니다.</p>}

        {/* 액션 */}
        {!sub ? (
          <button onClick={startTrial} disabled={processing || villas.length === 0}
            className="w-full bg-[#2B2BEE] text-white py-4 rounded-xl text-[16px] font-extrabold hover:bg-[#1C1CC9] disabled:opacity-50 transition">
            {processing ? '처리 중…' : `카드 등록하고 ${TRIAL_DAYS}일 무료 시작`}
          </button>
        ) : (
          <div className="space-y-2">
            <button onClick={changeCard} disabled={processing}
              className="w-full bg-white border border-[#E8EBF0] text-[#2B2BEE] py-3 rounded-xl text-[15px] font-bold disabled:opacity-50">
              결제 카드 변경
            </button>
            {sub.status !== 'pending_cancel' && (
              <button onClick={cancelSub}
                className="w-full bg-white border border-[#E8EBF0] text-[#6B7280] py-3 rounded-xl text-[15px] font-bold">
                구독 해지
              </button>
            )}
          </div>
        )}

        <p className="text-[12px] text-[#9CA3AF] text-center mt-4 leading-relaxed">
          빌라를 추가하면 해당 세대 수에 맞는 상품이 자동 추가되어 월 결제액에 합산됩니다.<br />
          요금·환불 정책은 <a href="/legal/refund" className="text-[#2B2BEE] underline">구독 상품 안내 및 환불규정</a> 참고.
        </p>
      </div>
    </>
  );
}
