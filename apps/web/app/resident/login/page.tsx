import Link from 'next/link';
import ResidentLoginForm from './ResidentLoginForm';

export const dynamic = 'force-dynamic';

export default function ResidentLoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">

      <div className="flex-1 flex flex-col justify-center px-5 pb-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-7">
            <h1 className="text-[26px] font-black text-[#0F2242]">입주민 로그인</h1>
            <p className="text-[15px] font-bold text-[#0F2242] mt-3">이름과 전화번호로 로그인하세요</p>
            <p className="text-[13px] text-[#6B7280] mt-1.5 leading-relaxed">
              관리자가 등록한 정보와 일치하면 자동으로<br />
              빌라·호수가 매칭됩니다.
            </p>
          </div>

          <ResidentLoginForm />

          <Link
            href="/resident/signup"
            className="block mt-3 bg-white border border-[#E8EBF0] text-[#0F2242] rounded-2xl py-3.5 text-center text-[15px] font-bold hover:bg-[#F9FAFB] transition"
          >
            입주 신청 (신규 입주민)
          </Link>

          <div className="mt-6 bg-[#E9E9FD] border border-[#2B2BEE]/15 rounded-2xl px-4 py-3 text-center">
            <p className="text-[12px] text-[#6B7280] mb-1">데모 계정</p>
            <p className="text-[13px] text-[#0F2242] font-bold">
              아이디: <span className="text-[#2B2BEE]">김테스트1</span>
              {' / '}
              비밀번호: <span className="text-[#2B2BEE]">010-9999-1111</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#9CA3AF] pb-5">ANDNEW · TheZoomWorks · 2026</p>
    </div>
  );
}
