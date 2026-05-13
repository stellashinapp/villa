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
    <div className="min-h-screen flex flex-col px-6">
      <div className="pt-12 pb-8">
        <Link href="/" className="text-sm text-t3 hover:text-t2">← 처음으로</Link>
      </div>

      <div className="flex-1 flex flex-col justify-center pb-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <p className="text-xs text-pri tracking-widest font-bold mb-1">VILLATOLK ADMIN</p>
            <h1 className="text-2xl font-extrabold text-t1">관리자 로그인</h1>
            <p className="text-sm text-t3 mt-2">이메일과 비밀번호로 로그인하세요</p>
          </div>

          <LoginForm next={sp.next ?? '/admin'} />

          <div className="text-center mt-6 text-sm">
            <span className="text-t3">아직 계정이 없으신가요? </span>
            <Link href="/admin/signup" className="text-pri font-semibold hover:underline">
              가입하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
