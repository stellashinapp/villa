import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-t1">빌라톡</h1>
          <p className="text-sm text-t3 mt-2">빌라·다세대 공동관리</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/login"
            className="block bg-pri text-white rounded-2xl py-5 text-center font-bold text-base shadow-lg shadow-pri/20 active:scale-[.98] transition-transform"
          >
            <div>관리자로 시작</div>
            <div className="text-xs font-medium opacity-80 mt-1">빌라 건물주·관리 담당자</div>
          </Link>

          <Link
            href="/resident/login"
            className="block bg-white border-2 border-pri text-pri rounded-2xl py-5 text-center font-bold text-base active:scale-[.98] transition-transform"
          >
            <div>입주민으로 시작</div>
            <div className="text-xs font-medium opacity-80 mt-1">청구서·민원·공지 확인</div>
          </Link>
        </div>

        <div className="text-center mt-10 space-y-2 text-xs text-t3">
          <p>
            <Link href="/legal/terms" className="underline hover:text-t2">이용약관</Link>
            {' · '}
            <Link href="/legal/privacy" className="underline hover:text-t2">개인정보처리방침</Link>
          </p>
          <p>© 앤뉴 (ANDNEW)</p>
        </div>
      </div>
    </div>
  );
}
