import Link from 'next/link';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">

      <div className="flex-1 flex flex-col justify-center px-5 pb-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-7">
            <h1 className="text-[26px] font-black text-[#0F2242]">관리자 로그인</h1>
            <p className="text-[14px] text-[#6B7280] mt-2">빌라 관리자 계정으로 로그인하세요</p>
          </div>

          <LoginForm next={sp.next ?? '/admin'} />

          <Link
            href="/admin/signup"
            className="block mt-3 bg-white border border-[#E8EBF0] text-[#0F2242] rounded-xl py-3.5 text-center text-[15px] font-bold hover:bg-[#F9FAFB] transition"
          >
            회원가입 (관리자 전용)
          </Link>

        </div>
      </div>

      <p className="text-center text-[11px] text-[#9CA3AF] pb-5">TheZoomWorks · 빌라톡 · 2026</p>
    </div>
  );
}
