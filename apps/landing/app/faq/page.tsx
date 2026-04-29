const FAQ = [
  {
    q: '무료체험은 어떻게 시작하나요?',
    a: '앱 다운로드 후 회원가입만 하시면 자동으로 30일 무료체험이 시작됩니다. 카드 등록은 무료체험이 끝나기 전까지 하지 않아도 됩니다.',
  },
  {
    q: '카드 등록 안 하면 어떻게 되나요?',
    a: '30일 무료체험이 끝나는 시점에 카드를 등록하지 않으면 서비스가 일시 정지됩니다. 데이터는 그대로 남아 있으며, 언제든지 카드를 등록하면 다시 사용할 수 있습니다.',
  },
  {
    q: '입주민도 요금을 내나요?',
    a: '입주민은 빌라톡 이용료를 내지 않습니다. 관리비를 토스로 결제할 때 토스페이먼츠의 표준 수수료만 발생합니다 (계좌이체로 납부 시 무료).',
  },
  {
    q: '빌라가 여러 개인데 어떻게 하나요?',
    a: '한 계정으로 여러 빌라를 등록할 수 있고, 빌라가 많아질수록 자동으로 할인됩니다 (3개 5%, 5개 10%, 10개 15%).',
  },
  {
    q: '관리비는 어떻게 정산되나요?',
    a: '입주민이 토스로 납부하면 관리자가 등록한 계좌로 입금됩니다. 빌라톡은 결제 처리만 중계하며, 자금은 회사를 거치지 않습니다.',
  },
  {
    q: '구독 해지하면 데이터는 어떻게 되나요?',
    a: '해지 후에도 데이터는 30일간 보관되며, 그 기간 내에 재구독하시면 그대로 복원됩니다. 30일 이후에는 영구 삭제됩니다.',
  },
  {
    q: '입주민이 앱을 못 깔거나 안 쓰면 어떻게 하나요?',
    a: '관리자가 대신 결제 확인을 입력하실 수 있습니다. 공지는 SMS 발송 기능이 향후 추가될 예정입니다.',
  },
  {
    q: '관리비 항목을 어떻게 입력하나요?',
    a: '관리자 앱에서 "빌라 → 관리비" 메뉴로 들어가 항목별로 입력합니다. 예: 공용전기 18만원, 청소용역 20만원. 발행 버튼을 누르면 모든 세대에 동일한 금액이 청구됩니다.',
  },
  {
    q: '데이터가 안전한가요?',
    a: 'Supabase(미국 AWS 인프라) 클라우드에 암호화되어 저장됩니다. 비밀번호는 단방향 해시로 저장되며, 결제 정보는 토스페이먼츠가 PCI-DSS 인증 환경에서 처리합니다.',
  },
  {
    q: '문의 어디로 하나요?',
    a: 'villatolk@andnew.kr 로 메일 주시면 영업일 기준 1~2일 내 답변드립니다.',
  },
];

export const metadata = {
  title: 'FAQ - 빌라톡',
  description: '빌라톡 자주 묻는 질문 모음',
};

export default function FaqPage() {
  return (
    <>
      <section className="pt-20 pb-12 bg-gradient-to-b from-primary-light/40 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs font-bold text-primary tracking-widest mb-3">FAQ</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">자주 묻는 질문</h1>
          <p className="text-gray-600">필요한 답이 없으면 villatolk@andnew.kr로 문의해 주세요.</p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-6 space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-primary/30 transition">
              <summary className="cursor-pointer list-none p-5 flex items-start justify-between gap-4 hover:bg-gray-50">
                <h3 className="font-black text-base flex-1">{item.q}</h3>
                <span className="text-primary text-xl font-black group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
