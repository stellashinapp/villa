import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col px-6 py-10 sm:py-16">
      <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pri text-white text-3xl font-extrabold mb-5 shadow-primary">
            V
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-t1">빌라톡</h1>
          <p className="text-sm text-t2 mt-2 leading-relaxed">빌라·다세대 공동관리 서비스</p>
        </div>

        {/* Role select */}
        <div className="space-y-3 mb-10">
          <Link
            href="/admin/login"
            className="block bg-pri text-white rounded-2xl py-5 px-6 shadow-primary active:scale-[.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold">관리자로 시작</div>
                <div className="text-xs font-medium opacity-80 mt-1">건물주·관리 담당자</div>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </Link>

          <Link
            href="/resident/login"
            className="block bg-white border border-border rounded-2xl py-5 px-6 shadow-card active:scale-[.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold text-t1">입주민으로 시작</div>
                <div className="text-xs font-medium text-t3 mt-1">청구서·민원·공지 확인</div>
              </div>
              <span className="text-2xl text-t3">→</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 text-xs text-t3">
          <p className="space-x-2">
            <Link href="/legal/terms" className="hover:text-t2">이용약관</Link>
            <span className="text-t3/40">·</span>
            <Link href="/legal/privacy" className="hover:text-t2">개인정보처리방침</Link>
          </p>
          <p>© 앤뉴 (ANDNEW)</p>
        </div>
      </div>
    </div>
  );
}
