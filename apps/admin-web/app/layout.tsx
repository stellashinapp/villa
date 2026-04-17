import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ANDNEW Admin Console',
  description: 'ANDNEW 본사 관리 시스템',
};

const NAV_ITEMS = [
  { href: '/', icon: '📊', label: '대시보드', group: 'OVERVIEW' },
  { href: '/admins', icon: '👤', label: '관리자 관리', group: 'MANAGEMENT' },
  { href: '/villas', icon: '🏘️', label: '빌라 관리', group: 'MANAGEMENT' },
  { href: '/residents', icon: '👥', label: '입주민', group: 'MANAGEMENT' },
  { href: '/subscriptions', icon: '📈', label: '구독·매출', group: 'REVENUE' },
  { href: '/payments', icon: '💳', label: '결제 내역', group: 'REVENUE' },
  { href: '/inquiries', icon: '💬', label: '관리자 문의', group: 'SUPPORT' },
  { href: '/notices', icon: '📢', label: '공지 발송', group: 'SUPPORT' },
  { href: '/settings', icon: '⚙️', label: '설정', group: 'SYSTEM' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 그룹별 네비게이션 정리
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <html lang="ko">
      <body className={`${font.className} flex min-h-screen`}>
        {/* 사이드바 */}
        <aside className="w-60 bg-surface border-r border-border fixed top-0 left-0 bottom-0 overflow-y-auto z-10">
          <div className="px-5 pt-5 pb-5 border-b border-border">
            <h1 className="text-base font-extrabold text-pri">ANDNEW</h1>
            <span className="text-[10px] text-t3 tracking-widest">ADMIN CONSOLE</span>
          </div>

          <nav className="px-3 py-2">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-2">
                <div className="text-[10px] font-bold text-t3 tracking-[1.5px] px-2 pt-3 pb-1.5">
                  {group}
                </div>
                {items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-t2 hover:bg-white/[.04] hover:text-t1 transition-all"
                  >
                    <span className="w-[18px] text-center text-sm">{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 ml-60 min-h-screen">
          <header className="h-[60px] border-b border-border flex items-center justify-between px-7 bg-surface sticky top-0 z-5">
            <span className="text-[15px] font-bold">ANDNEW Admin</span>
            <input
              placeholder="관리자, 빌라명 검색..."
              className="bg-bg border border-border rounded-lg px-3.5 py-2 text-sm text-t1 w-60 outline-none focus:border-pri"
            />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
