import Link from 'next/link';

const features = [
  {
    icon: '🧾',
    title: '관리비 자동 청구',
    desc: '매월 자동으로 청구서 발행 + 입주민 푸시 알림. 미납 자동 추적.',
  },
  {
    icon: '💬',
    title: '실시간 민원·소통',
    desc: '입주민 채팅, 빌라 게시판, 즉시 응답. 분쟁 줄어듭니다.',
  },
  {
    icon: '📢',
    title: '단체 공지',
    desc: '엘리베이터 점검·소독·공사 등 모든 입주민에게 한 번에.',
  },
  {
    icon: '🚗',
    title: '주차 관리',
    desc: '세대별 차량 등록, 방문 차량은 별도 단순 관리.',
  },
  {
    icon: '💳',
    title: '카드 자동 결제',
    desc: '토스페이먼츠 연동. 카드 한 번 등록하면 매월 자동 청구.',
  },
  {
    icon: '🛡️',
    title: '본인인증·보안',
    desc: '다날 PASS 본인인증. 실명·실번호 검증된 입주민만.',
  },
];

const plans = [
  { name: '소형', range: '6~8세대', price: 30000, popular: false },
  { name: '중형', range: '9~15세대', price: 50000, popular: true },
  { name: '대형', range: '16~30세대', price: 70000, popular: false },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 mb-5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
              ✨ 첫 30일 무료체험
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6">
              빌라 관리,<br />
              <span className="text-primary">아직도 수기로</span> 하세요?
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              관리비 분쟁, 미납, 공지 전달, 민원, 주차 문제까지.<br />
              관리자와 입주민을 하나로 연결하는 빌라 전용 관리 플랫폼.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/download"
                className="px-7 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/30"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/pricing"
                className="px-7 py-4 bg-white text-gray-800 font-bold rounded-xl border-2 border-gray-200 hover:border-primary hover:text-primary transition"
              >
                요금제 보기
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              가입비·약정 없음 · 카드만 등록하면 시작 · 30일 안에 해지하면 무료
            </p>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-72 h-[540px] bg-gray-900 rounded-[44px] shadow-2xl border-8 border-gray-900 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-50 p-6 flex flex-col">
                <div className="text-xs text-gray-500 mb-4">📱 빌라톡 모바일</div>
                <div className="text-2xl font-black text-gray-900 mb-1">해피빌라</div>
                <div className="text-sm text-gray-500 mb-6">8세대 · 활성</div>
                <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">이번달 관리비</div>
                  <div className="text-xl font-black text-primary">450,000원</div>
                  <div className="text-xs text-gray-500 mt-1">납부 6/8 · 미납 2건</div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                  <div className="text-xs font-bold text-gray-700 mb-2">📢 최근 공지</div>
                  <div className="text-sm text-gray-900 mb-1">엘리베이터 점검 안내</div>
                  <div className="text-xs text-gray-400">5월 15일 (목)</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-gray-700 mb-2">💬 민원</div>
                  <div className="text-sm text-gray-900">3층 누수 문의…</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-primary text-sm font-bold mb-3 tracking-wide">FEATURES</div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              빌라 운영, 이제 한 화면에
            </h2>
            <p className="text-gray-600 text-lg">
              관리자도 입주민도 — 공동주택 운영에 필요한 모든 것
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-7 bg-white border border-gray-200 rounded-2xl hover:border-primary hover:shadow-lg transition"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-primary text-sm font-bold mb-3 tracking-wide">PRICING</div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              세대수에 따라 합리적으로
            </h2>
            <p className="text-gray-600 text-lg">
              매월 자동결제 · 30일 무료체험 · 언제든 해지 가능
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative bg-white rounded-2xl p-7 border-2 transition ${
                  p.popular
                    ? 'border-primary shadow-xl scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
                    인기
                  </div>
                )}
                <div className="text-xl font-black text-gray-900 mb-1">{p.name}</div>
                <div className="text-sm text-gray-500 mb-5">{p.range}</div>
                <div className="text-4xl font-black text-gray-900 mb-1">
                  {p.price.toLocaleString()}
                  <span className="text-base font-normal text-gray-500 ml-1">원/월</span>
                </div>
                <div className="text-xs text-gray-500 mb-6">VAT 별도 · 빌라당</div>
                <ul className="space-y-2 text-sm text-gray-700 mb-6">
                  <li>✓ 관리비 자동 청구</li>
                  <li>✓ 단체 공지 + 푸시</li>
                  <li>✓ 민원·주차 관리</li>
                  <li>✓ 카드 자동결제</li>
                  {p.name !== '소형' && <li>✓ 우선 고객지원</li>}
                </ul>
                <Link
                  href="/pricing"
                  className={`block text-center py-3 rounded-lg font-bold transition ${
                    p.popular
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  자세히 보기
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-sm text-gray-500">
            여러 빌라 운영 시 자동 볼륨 할인 — 3개+ 5%, 5개+ 10%, 10개+ 15%
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight">
            30일 무료, 카드 한 번 등록으로<br />
            지금 시작하세요
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            가입비 없음 · 약정 없음 · 30일 안에 해지하면 요금 0원
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/download"
              className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/30"
            >
              앱 다운로드
            </Link>
            <Link
              href="/faq"
              className="px-8 py-4 bg-white text-gray-800 font-bold rounded-xl border-2 border-gray-200 hover:border-primary hover:text-primary transition"
            >
              자주 묻는 질문
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
