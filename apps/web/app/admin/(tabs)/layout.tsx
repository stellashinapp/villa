'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const TABS = [
  { href: '/admin', label: '홈', icon: '🏠' },
  { href: '/admin/inbox', label: '메시지', icon: '✉' },
  { href: '/admin/villas', label: '빌라', icon: '🏘' },
  { href: '/admin/settings', label: '설정', icon: '⚙' },
];

export default function AdminTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // auth 가드 — 미로그인 시 /admin/login 으로
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/admin/login?next=' + encodeURIComponent(pathname));
        return;
      }
      setAuthChecked(true);
    })();
  }, [pathname, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-[72px]">
      {children}

      {/* 하단 탭바 — 모바일 admin 동일 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8EBF0] z-50">
        <div className="max-w-screen-sm mx-auto flex">
          {TABS.map(tab => {
            // /admin 은 정확 매칭, 나머지는 prefix
            const active =
              tab.href === '/admin'
                ? pathname === '/admin'
                : pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <span
                  className={`text-xl leading-none ${active ? 'text-[#4263E8]' : 'text-[#9CA3AF]'}`}
                  aria-hidden="true"
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] font-bold ${active ? 'text-[#4263E8]' : 'text-[#9CA3AF]'}`}
                >
                  {tab.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-[#4263E8] -mt-1" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
