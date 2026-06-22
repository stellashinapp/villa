import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#EAEAFE] via-[#F2F2FE] to-white"
      style={{
        paddingTop: 'calc(2.5rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex-1 flex flex-col justify-between px-5 pb-8 w-full max-w-sm mx-auto">
        {/* Hero — 로고 + 일러스트 */}
        <div className="flex-1 flex flex-col items-center justify-center pb-8">
          {/* 빌라 일러스트 (브랜드 로고) */}
          <div className="mb-6">
            <Image
              src="/logo-source.png"
              alt="빌라톡"
              width={156}
              height={149}
              priority
              className="select-none w-[156px] h-auto block"
            />
          </div>

          {/* 로고 텍스트 */}
          <h1 className="text-[44px] font-black tracking-tight mb-3">
            <span className="text-[#0F2242]">Villa</span>
            <span className="text-[#2B2BEE] ml-2">Talk</span>
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
            className="block bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] text-white rounded-xl py-4 text-center shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="text-[16px] font-extrabold">관리자로 시작</span>
          </Link>

          <Link
            href="/resident/login"
            className="block bg-[#0F2242] text-white rounded-xl py-4 text-center shadow-md active:scale-[0.98] transition-transform"
          >
            <span className="text-[16px] font-extrabold">입주민으로 시작</span>
          </Link>

          {/* Footer */}
          <div className="text-center pt-4 text-[11px] text-[#9CA3AF] space-x-2">
            <a href="/legal/terms" target="_blank" rel="noreferrer" className="hover:text-[#6B7280]">이용약관</a>
            <span className="text-[#D1D5DB]">·</span>
            <a href="/legal/privacy" target="_blank" rel="noreferrer" className="hover:text-[#6B7280]">개인정보처리방침</a>
          </div>
          <p className="text-center text-[11px] text-[#9CA3AF]">© 주식회사 더줌웍스 (TheZoomWorks)</p>
        </div>
      </div>
    </div>
  );
}
