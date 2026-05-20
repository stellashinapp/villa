import LegalDoc from '@/components/LegalDoc';
import { PLAN_PRICES, PLAN_LABELS, PLAN_UNIT_RANGES, DISCOUNT_TIERS } from '@villatolk/shared';

export const metadata = { title: '환불규정 · 빌라톡' };

const PLANS = (['small', 'popular', 'large'] as const).map(k => ({
  key: k,
  label: PLAN_LABELS[k],
  price: PLAN_PRICES[k],
  range: PLAN_UNIT_RANGES[k],
}));

function fmt(n: number) { return n.toLocaleString('ko-KR'); }

export default function RefundPage() {
  return (
    <LegalDoc title="구독 상품 안내 및 환불규정" updatedAt="2026.05.01">
      <h2>1. 구독 상품 안내</h2>
      <p>빌라톡 관리자 서비스는 관리하는 빌라의 세대 규모에 따라 월 단위 구독으로 제공됩니다. (부가세 별도)</p>
      <table className="w-full my-3 text-[13px] border-collapse">
        <thead>
          <tr className="border-b-2 border-[#E8EBF0] text-[#0F2242]">
            <th className="text-left py-2">상품</th>
            <th className="text-left py-2">세대 규모</th>
            <th className="text-right py-2">월 요금</th>
          </tr>
        </thead>
        <tbody>
          {PLANS.map(p => (
            <tr key={p.key} className="border-b border-[#F0F2F5]">
              <td className="py-2 font-bold text-[#0F2242]">{p.label}</td>
              <td className="py-2 text-[#6B7280]">{p.range.min}~{p.range.max}세대</td>
              <td className="py-2 text-right font-bold text-[#2B2BEE]">{fmt(p.price)}원</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[13px] text-[#6B7280]">※ 신규 가입 시 <strong>30일 무료 체험</strong>이 제공됩니다. 체험 기간 중에는 요금이 청구되지 않습니다.</p>

      <h2>2. 다수 빌라 볼륨 할인</h2>
      <p>한 관리자가 여러 빌라를 운영하는 경우 아래 기준으로 할인이 적용됩니다.</p>
      <ul className="list-disc pl-5 my-2 text-[13px]">
        {DISCOUNT_TIERS.filter(t => t.rate > 0).map(t => (
          <li key={t.minVillas}>{t.minVillas}개 빌라 이상 운영 시 <strong>{Math.round(t.rate * 100)}% 할인</strong></li>
        ))}
      </ul>

      <h2>3. 결제 및 갱신</h2>
      <p>① 구독은 등록된 결제수단으로 매월 자동 결제·갱신됩니다.<br />
      ② 결제일은 최초 구독 시작일을 기준으로 하며, 세대 수 변동 시 다음 결제 주기부터 변경된 요금이 적용됩니다.</p>

      <h2>4. 청약철회 및 환불</h2>
      <p>① <strong>무료 체험 기간</strong> 중에는 요금이 청구되지 않으므로 환불 대상이 아닙니다.<br />
      ② 유료 결제 후 <strong>7일 이내</strong>이고 서비스의 핵심 기능(관리비 고지·입주민 관리 등)을 실질적으로 이용하지 않은 경우 전액 환불이 가능합니다.<br />
      ③ 서비스를 이용한 경우, 결제한 구독 기간 중 <strong>잔여 일수에 해당하는 금액을 일할 계산</strong>하여 환불합니다. (이미 제공된 기간은 환불에서 제외)<br />
      ④ 회사의 귀책사유로 서비스를 이용하지 못한 경우 해당 기간만큼 전액 환불 또는 이용 기간 연장으로 보상합니다.</p>

      <h2>5. 환불 신청 방법</h2>
      <p>환불은 villatolk@andnew.kr 로 가입 이메일·환불 사유와 함께 신청하실 수 있습니다. 접수 후 영업일 기준 3일 이내 처리하며, 결제수단으로의 환불은 카드사·결제대행사 정책에 따라 추가 영업일이 소요될 수 있습니다.</p>

      <h2>6. 구독 해지</h2>
      <p>구독은 언제든지 해지할 수 있으며, 해지 시 다음 결제일부터 요금이 청구되지 않습니다. 해지 후에도 이미 결제된 구독 기간 동안에는 서비스를 계속 이용할 수 있습니다.</p>

      <h2>문의</h2>
      <p>주식회사 더줌웍스 (ANDNEW)<br />
      서울특별시 송파구 송파대로 111 · villatolk@andnew.kr</p>
    </LegalDoc>
  );
}
