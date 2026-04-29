import Link from 'next/link';

export const metadata = {
  title: '앱 다운로드 - 빌라톡',
  description: '관리자/입주민 모두 빌라톡 앱 하나로. iOS·Android 지원.',
};

export default function DownloadPage() {
  return (
    <>
      <section className="pt-20 pb-16 bg-gradient-to-b from-primary-light/40 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs font-bold text-primary tracking-widest mb-3">DOWNLOAD</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">앱 다운로드</h1>
          <p className="text-lg text-gray-600">관리자도, 입주민도 같은 앱 하나로 시작합니다.</p>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Google Play */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:border-primary/30 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <div className="text-xs font-bold text-gray-500">FOR ANDROID</div>
                  <div className="text-lg font-black">Google Play</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Play 스토어에서 "빌라톡"으로 검색하시거나 아래 버튼으로 이동하세요.
              </p>
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm"
              >
                심사 진행중 (출시 예정)
              </button>
            </div>

            {/* App Store */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 hover:border-primary/30 transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🍎</div>
                <div>
                  <div className="text-xs font-bold text-gray-500">FOR iOS</div>
                  <div className="text-lg font-black">App Store</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                App Store에서 "빌라톡"으로 검색하세요.
              </p>
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm"
              >
                심사 진행중 (출시 예정)
              </button>
            </div>
          </div>

          {/* Beta */}
          <div className="mt-10 p-7 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold">BETA</span>
              <span className="text-xs font-bold opacity-80">테스트 버전 사용 가능</span>
            </div>
            <h3 className="text-xl font-black mb-2">먼저 써보고 싶으신가요?</h3>
            <p className="text-sm text-white/90 mb-5 leading-relaxed">
              스토어 정식 출시 전 베타 테스터를 모집합니다.<br />
              아래 이메일로 연락 주시면 APK 직접 다운로드 링크를 보내드립니다.
            </p>
            <a
              href="mailto:villatolk@andnew.kr?subject=빌라톡%20베타테스트%20신청&body=빌라명%2C%20세대수%2C%20연락처를%20알려주세요"
              className="inline-flex px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-50 transition text-sm"
            >
              ✉ 베타 테스트 신청
            </a>
          </div>

          {/* Steps */}
          <div className="mt-16">
            <h3 className="text-xl font-black mb-6 text-center">설치 후 시작하기</h3>
            <div className="space-y-4">
              {[
                {
                  num: 1,
                  title: '관리자 / 입주민 선택',
                  desc: '빌라를 운영하는 분은 "관리자", 거주하시는 분은 "입주민"을 선택합니다.',
                },
                {
                  num: 2,
                  title: '관리자: 회원가입 → 빌라 등록',
                  desc: '이메일·비밀번호·이름 입력 후 빌라 정보(이름, 주소, 세대 수)를 등록합니다.',
                },
                {
                  num: 3,
                  title: '관리자: 입주민 등록',
                  desc: '세대별 입주민 이름과 휴대전화번호를 입력하시면 됩니다.',
                },
                {
                  num: 4,
                  title: '입주민: 같은 정보로 로그인',
                  desc: '관리자가 입력한 이름과 휴대전화번호로 입주민 앱에 로그인합니다.',
                },
              ].map((s) => (
                <div key={s.num} className="flex gap-4 items-start p-5 bg-white rounded-2xl border border-gray-200">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center">
                    {s.num}
                  </div>
                  <div className="flex-1">
                    <div className="font-black mb-1">{s.title}</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/faq" className="text-primary font-bold hover:underline text-sm">자주 묻는 질문 보기 →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
