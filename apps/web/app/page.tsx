import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E8EEFF] via-[#F0F4FF] to-white">
      <div className="flex-1 flex flex-col justify-between px-5 pt-16 pb-8 w-full max-w-sm mx-auto">
        {/* Hero — 로고 + 일러스트 */}
        <div className="flex-1 flex flex-col items-center justify-center pb-8">
          {/* 빌라 일러스트 (SVG) */}
          <div className="mb-6">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* 왼쪽 빌라 */}
              <path d="M16 100 L16 56 L40 36 L40 100 Z" fill="#7B95F5" stroke="#3766EE" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M16 56 L40 36 L48 42 L24 62 Z" fill="#A5B8F8" stroke="#3766EE" strokeWidth="2" strokeLinejoin="round"/>
              <rect x="22" y="64" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="22" y="78" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="30" y="70" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="30" y="84" width="6" height="10" fill="#3766EE" rx="1"/>

              {/* 가운데 빌라 (큰) */}
              <path d="M40 100 L40 44 L76 16 L76 100 Z" fill="#3766EE" stroke="#1F3DC2" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M40 44 L76 16 L86 24 L50 52 Z" fill="#5B86FF" stroke="#1F3DC2" strokeWidth="2" strokeLinejoin="round"/>
              <rect x="48" y="56" width="8" height="10" fill="white" rx="1"/>
              <rect x="60" y="56" width="8" height="10" fill="white" rx="1"/>
              <rect x="48" y="72" width="8" height="10" fill="white" rx="1"/>
              <rect x="60" y="72" width="8" height="10" fill="white" rx="1"/>
              <rect x="54" y="86" width="8" height="14" fill="white" rx="1"/>

              {/* 오른쪽 빌라 */}
              <path d="M76 100 L76 60 L100 40 L100 100 Z" fill="#7B95F5" stroke="#3766EE" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M76 60 L100 40 L108 46 L84 66 Z" fill="#A5B8F8" stroke="#3766EE" strokeWidth="2" strokeLinejoin="round"/>
              <rect x="82" y="68" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="82" y="82" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="90" y="74" width="6" height="8" fill="#3766EE" rx="1"/>
              <rect x="90" y="88" width="6" height="10" fill="#3766EE" rx="1"/>

              {/* 말풍선 */}
              <circle cx="92" cy="22" r="8" fill="#3766EE"/>
              <path d="M88 28 L86 32 L90 30 Z" fill="#3766EE"/>
              <circle cx="89" cy="22" r="1" fill="white"/>
              <circle cx="92" cy="22" r="1" fill="white"/>
              <circle cx="95" cy="22" r="1" fill="white"/>
            </svg>
          </div>

          {/* 로고 텍스트 */}
          <h1 className="text-[44px] font-black tracking-tight mb-3">
            <span className="text-[#0F2242]">Villa</span>
            <span className="text-[#3766EE] ml-2">Talk</span>
          </h1>

          {/* 서브 카피 */}
          <p className="text-[13px] text-[#6B7280] text-center leading-relaxed">
            관리자와 입주민 모두를 위한
          </p>
          <p className="text-[15px] font-bold text-[#0F2242] text-center mt-0.5">
            스마트 공동 관리 서비스
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="space-y-3">
          <Link
            href="/admin/login"
            className="block bg-gradient-to-br from-[#3766EE] to-[#5B86FF] text-white rounded-2xl py-4 text-center shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="text-[16px] font-extrabold">관리자로 시작</span>
          </Link>

          <Link
            href="/resident/login"
            className="block bg-[#0F2242] text-white rounded-2xl py-4 text-center shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="text-[16px] font-extrabold">입주민으로 시작</span>
          </Link>

          {/* Footer */}
          <div className="text-center pt-4 text-[11px] text-[#9CA3AF] space-x-2">
            <a href="https://villtalk.store/legal/terms" target="_blank" rel="noreferrer" className="hover:text-[#6B7280]">이용약관</a>
            <span className="text-[#D1D5DB]">·</span>
            <a href="https://villtalk.store/legal/privacy" target="_blank" rel="noreferrer" className="hover:text-[#6B7280]">개인정보처리방침</a>
          </div>
          <p className="text-center text-[11px] text-[#9CA3AF]">© 앤뉴 (ANDNEW)</p>
        </div>
      </div>
    </div>
  );
}
