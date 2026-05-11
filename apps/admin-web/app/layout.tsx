import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'ANDNEW Admin Console',
  description: 'ANDNEW 본사 관리 시스템',
};

// 민원·공지 는 별도 메뉴로 노출하지 않고 관리자 상세 (/admins/[id]) 안의
// 이슈/활동지표 섹션에 통합. 페이지 자체는 남겨두어 URL 직접 접근은 가능.
const NAV_ITEMS = [
  { href: '/', icon: '📊', label: '대시보드', group: 'OVERVIEW' },
  { href: '/admins', icon: '👤', label: '관리자 관리', group: 'MANAGEMENT' },
  { href: '/villas', icon: '🏘️', label: '빌라 관리', group: 'MANAGEMENT' },
  { href: '/residents', icon: '👥', label: '입주민', group: 'MANAGEMENT' },
  { href: '/subscriptions', icon: '📈', label: '구독·매출', group: 'REVENUE' },
  { href: '/payments', icon: '💳', label: '결제 내역', group: 'REVENUE' },
  { href: '/settings', icon: '⚙️', label: '설정', group: 'SYSTEM' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <html lang="ko">
      <body className={`${noto.variable} font-sans flex min-h-screen bg-bg text-t1`}>
        {/* 사이드바 - 네이비 다크 */}
        <aside className="w-60 bg-sidebarBg border-r border-sidebarBorder fixed top-0 left-0 bottom-0 overflow-y-auto z-10">
          <div className="px-5 pt-6 pb-5 border-b border-sidebarBorder">
            <h1 className="text-base font-extrabold text-white tracking-tight">ANDNEW</h1>
            <span className="text-[10px] text-sidebarTextMuted tracking-[2px] font-semibold">ADMIN CONSOLE</span>
          </div>

          <nav className="px-3 py-3">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-3">
                <div className="text-[10px] font-bold text-sidebarTextMuted tracking-[1.5px] px-2 pt-3 pb-2">
                  {group}
                </div>
                {items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebarText hover:bg-white/[.06] hover:text-sidebarTextActive transition-all"
                  >
                    <span className="w-[18px] text-center text-base">{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* 메인 콘텐츠 - 라이트 */}
        <main className="flex-1 ml-60 min-h-screen bg-bg">
          <header className="h-[60px] border-b border-border flex items-center justify-between px-7 bg-surface sticky top-0 z-5">
            <span className="text-[15px] font-bold text-t1">ANDNEW Admin</span>
            <input
              placeholder="관리자, 빌라명 검색..."
              className="bg-bg border border-border rounded-lg px-3.5 py-2 text-sm text-t1 w-60 outline-none focus:border-pri focus:bg-white transition-colors"
            />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
