import Link from 'next/link';
import LogoutButton from './LogoutButton';

const NAV_ITEMS = [
  { href: '/', icon: '📊', label: '대시보드', group: 'OVERVIEW' },
  { href: '/admins', icon: '👤', label: '관리자 관리', group: 'MANAGEMENT' },
  { href: '/villas', icon: '🏘️', label: '빌라 관리', group: 'MANAGEMENT' },
  { href: '/residents', icon: '👥', label: '입주민', group: 'MANAGEMENT' },
  { href: '/subscriptions', icon: '📈', label: '구독·매출', group: 'REVENUE' },
  { href: '/payments', icon: '💳', label: '결제 내역', group: 'REVENUE' },
  { href: '/schema', icon: '🗄️', label: 'DB / API', group: 'SYSTEM' },
  { href: '/settings', icon: '⚙️', label: '설정', group: 'SYSTEM' },
];

export default function ChromeShell({
  children,
  viewer,
  superAdmin,
}: {
  children: React.ReactNode;
  viewer: string | null;
  superAdmin: boolean;
}) {
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
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
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebarText hover:bg-white/[.06] hover:text-sidebarTextActive transition-all"
                >
                  <span className="w-[18px] text-center text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 ml-60 min-h-screen bg-bg">
        <header className="h-[60px] border-b border-border flex items-center justify-between px-7 bg-surface sticky top-0 z-5">
          <span className="text-[15px] font-bold text-t1">ANDNEW Admin</span>
          <div className="flex items-center gap-3">
            {viewer && (
              <span className="text-xs text-t3">
                <span className="font-semibold text-t2">{viewer}</span>
                {superAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-warnL text-warn">슈퍼</span>
                )}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
