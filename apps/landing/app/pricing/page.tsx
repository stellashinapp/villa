import Link from 'next/link';

const PLANS = [
  {
    name: '소형',
    units: '8세대 이하',
    price: 30000,
    highlight: false,
    features: [
      '관리비 청구·발송',
      '입주민 공지/알림',
      '민원 1:1 응대',
      '주차 관리',
      '커뮤니티 게시판',
      '카드/계좌 결제',
    ],
  },
  {
    name: '중형',
    units: '9~15세대',
    price: 50000,
    highlight: true,
    badge: '가장 인기',
    features: [
      '소형 플랜 모든 기능',
      '자동 청구서 발행',
      '수납 현황 대시보드',
      '문자 알림 (예정)',
      '입주민 회원관리',
      '우선 고객지원',
    ],
  },
  {
    name: '대형',
    units: '16~30세대',
    price: 70000,
    highlight: false,
    features: [
      '중형 플랜 모든 기능',
      '다중 빌라 통합관리',
      '월별 정산 리포트',
      'CSV 데이터 내보내기',
      '전담 매니저 (예정)',
      'API 액세스 (예정)',
    ],
  },
];

const VOLUME_DISCOUNT = [
  { count: '3개~', discount: '5%' },
  { count: '5개~', discount: '10%' },
  { count: '10개~', discount: '15%' },
];

export const metadata = {
  title: '요금제 - 빌라톡',
  description: '빌라 세대 수에 맞춰 월 30,000원부터. 첫 1개월 무료체험.',
};

export default function PricingPage() {
  return (
    <>
      <section className="pt-20 pb-12 bg-gradient-to-b from-primary-light/40 to-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-xs font-bold text-primary tracking-widest mb-3">PRICING</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">간단하고 합리적인 요금</h1>
          <p className="text-lg text-gray-600">첫 1개월 무료 · 약정 없음 · 언제든 플랜 변경</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl border-2 p-8 transition ${
                  p.highlight
                    ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 md:scale-105'
                    : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-xl'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-md">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-2xl font-black mb-1">{p.name}</h3>
                <p className={`text-sm mb-6 ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>{p.units}</p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-black">{p.price.toLocaleString()}</span>
                  <span className={`text-sm font-semibold ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>원/월</span>
                </div>
                <p className={`text-xs mb-6 ${p.highlight ? 'text-white/70' : 'text-gray-400'}`}>VAT 별도</p>

                <Link
                  href="/download"
                  className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition ${
                    p.highlight ? 'bg-white text-primary hover:bg-gray-50' : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  무료체험 시작
                </Link>

                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 ${p.highlight ? 'text-white' : 'text-primary'}`}>✓</span>
                      <span className={p.highlight ? 'text-white/95' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Volume discount */}
          <div className="mt-16 max-w-3xl mx-auto bg-gradient-to-br from-primary-light/50 to-white border border-primary/20 rounded-2xl p-8">
            <h3 className="text-xl font-black mb-1">📦 다수 빌라 운영자 할인</h3>
            <p className="text-sm text-gray-600 mb-5">2개 이상 빌라를 등록하면 자동으로 할인이 적용됩니다.</p>
            <div className="grid grid-cols-3 gap-4">
              {VOLUME_DISCOUNT.map((v) => (
                <div key={v.count} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">{v.count} 빌라</div>
                  <div className="text-2xl font-black text-primary">-{v.discount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-12 max-w-3xl mx-auto bg-gray-50 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
            <p className="font-bold text-gray-800 mb-3">📌 안내사항</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>모든 플랜은 첫 1개월 완전 무료입니다 (카드 등록 시점 기준).</li>
              <li>요금은 매월 등록된 카드로 자동 결제됩니다.</li>
              <li>구독 해지 시 다음 결제일부터 청구가 중단됩니다.</li>
              <li>입주민 결제 수수료는 별도 (토스페이먼츠 표준 요율).</li>
              <li>기업 도입·맞춤 견적은 villatolk@andnew.kr로 문의해 주세요.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black mb-3">시작은 0원</h2>
          <p className="text-gray-600 mb-8">카드 등록 없이도 30일간 모든 기능을 사용할 수 있습니다.</p>
          <Link href="/download" className="inline-flex px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-xl shadow-primary/30">
            무료로 시작하기 →
          </Link>
        </div>
      </section>
    </>
  );
}
