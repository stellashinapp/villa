import Link from 'next/link';

const FEATURES = [
  { icon: '💰', title: '관리비 자동화', desc: '매월 항목 입력 한 번이면 전 세대 청구·발송·납부 확인까지 자동.' },
  { icon: '📢', title: '공지/민원', desc: '공지 발송하면 입주민 폰으로 즉시 알림. 민원도 카카오톡처럼 1:1 대화.' },
  { icon: '🅿️', title: '주차 관리', desc: '입주민 차량·방문 차량 등록·만료 알림으로 주차 갈등 끝.' },
  { icon: '🏘️', title: '커뮤니티', desc: '같은 빌라 이웃과 소통. 재활용 안내, 동호회, 분실물까지.' },
  { icon: '💳', title: '간편 결제', desc: '토스페이먼츠 연동. 카드·계좌이체로 입주민이 직접 납부.' },
  { icon: '🔔', title: '실시간 알림', desc: '공지, 청구, 납부, 답변 모든 이벤트가 푸시 알림으로.' },
];

const STATS = [
  { value: '8~30', label: '세대', sub: '소형부터 대형까지' },
  { value: '30분', label: '셋업', sub: '회원가입~빌라등록까지' },
  { value: '0원', label: '첫달', sub: '30일 무료체험' },
  { value: '24/7', label: '운영', sub: '클라우드 안정성' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-light/30 to-primary-light pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
              🎉 첫 1개월 완전 무료
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
              빌라 관리,<br />
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">엑셀과 단체톡 그만</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              관리비 청구, 공지 발송, 민원 응대, 주차 관리, 결제까지<br className="hidden md:block" />
              빌라톡 앱 하나로 30분 만에 시작합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/download" className="inline-flex items-center gap-2 px-7 py-4 bg-primary text-white text-base font-bold rounded-xl hover:bg-primary-dark transition shadow-lg shadow-primary/30">
                무료로 시작하기 →
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-7 py-4 bg-white border border-gray-200 text-base font-bold rounded-xl hover:border-primary hover:text-primary transition">
                요금제 보기
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-5">
                  <div className="text-2xl md:text-3xl font-black text-primary">{s.value}</div>
                  <div className="text-sm font-bold text-gray-800 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-primary tracking-widest mb-2">CORE FEATURES</div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">관리에 필요한 것, 다 들어있어요</h2>
            <p className="text-gray-600">관리자 앱과 입주민 앱이 따로. 기능은 자동으로 동기화.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="group relative p-6 rounded-2xl border border-gray-200 hover:border-primary/40 hover:shadow-xl transition-all bg-white">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-black mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-primary tracking-widest mb-2">HOW IT WORKS</div>
            <h2 className="text-3xl md:text-4xl font-black">3단계로 시작</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: '앱 다운로드 & 회원가입', desc: '관리자 정보 입력 후 첫 빌라를 등록하세요. 30일 무료체험 자동 시작.' },
              { step: '02', title: '입주민 등록', desc: '세대별로 이름·전화번호 입력. 입주민은 본인 폰에서 같은 정보로 로그인.' },
              { step: '03', title: '관리비 발행', desc: '항목 입력 → 발행 한 번 누르면 전 세대에 알림 + 결제 가능 상태.' },
            ].map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-2xl border border-gray-200 p-6">
                <div className="absolute -top-4 -left-2 w-12 h-12 bg-primary text-white font-black text-xl rounded-2xl rotate-[-6deg] flex items-center justify-center shadow-lg">
                  {s.step}
                </div>
                <div className="pt-6">
                  <h3 className="text-lg font-black mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-primary tracking-widest mb-2">PRICING</div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">세대 수만큼만 내세요</h2>
            <p className="text-gray-600">첫 1개월 무료 · 언제든 해지 가능</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { name: '소형', units: '8세대 이하', price: '30,000', highlight: false },
              { name: '인기', units: '9~15세대', price: '50,000', highlight: true },
              { name: '대형', units: '16~30세대', price: '70,000', highlight: false },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border-2 p-7 transition ${p.highlight ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-105' : 'border-gray-200 bg-white hover:border-primary/30'}`}>
                {p.highlight && <div className="text-xs font-bold mb-2 inline-block px-2 py-0.5 bg-white text-primary rounded">가장 인기</div>}
                <div className="text-2xl font-black mb-1">{p.name}</div>
                <div className={`text-sm mb-5 ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>{p.units}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>원/월</span>
                </div>
                <div className={`text-xs ${p.highlight ? 'text-white/70' : 'text-gray-500'}`}>VAT 별도</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/pricing" className="text-primary font-bold hover:underline">전체 요금제 자세히 보기 →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-dark opacity-90" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">지금 시작하세요</h2>
          <p className="text-lg text-white/80 mb-8">설치 5분, 셋업 30분. 첫 1개월은 카드 등록도 필요 없습니다.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/download" className="px-7 py-4 bg-white text-primary text-base font-bold rounded-xl hover:bg-gray-50 transition shadow-xl">
              📱 앱 다운로드
            </Link>
            <a href="mailto:villatolk@andnew.kr" className="px-7 py-4 bg-white/10 backdrop-blur border border-white/20 text-base font-bold rounded-xl hover:bg-white/20 transition">
              ✉ 도입 상담
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
