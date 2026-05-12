import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-t1">빌라톡 어드민</h1>
          <p className="text-xs text-t3 tracking-[2px] font-semibold mt-1">VILLATOLK ADMIN</p>
        </div>
        <div className="bg-card border border-border rounded-[10px] p-7">
          <h2 className="text-base font-bold mb-5">본사 콘솔 로그인</h2>
          <LoginForm next={sp.next ?? '/'} error={sp.error} />
          <p className="text-[11px] text-t3 mt-5 leading-relaxed">
            본 시스템은 빌라톡(앤뉴) 본사 직원 전용입니다.
            <br />접근 기록은 개인정보보호법 제29조에 따라 1년 이상 보관됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
