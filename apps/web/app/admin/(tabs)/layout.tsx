'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';

// 탭 순서: 홈 / 빌라 / 메시지 / 설정 (빌라가 메시지보다 자주 쓰임 — 모바일 동일 의도)
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: '홈', icon: 'home' },
  { href: '/admin/villas', label: '빌라', icon: 'villa' },
  { href: '/admin/inbox', label: '메시지', icon: 'message' },
  { href: '/admin/settings', label: '설정', icon: 'settings' },
];

export default function AdminTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

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
    <div className="min-h-screen bg-[#F5F6FA] pb-[80px]">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8EBF0] z-50 h-[65px] pt-1.5 pb-2">
        <div className="max-w-screen-sm mx-auto h-full flex">
          {TABS.map(tab => {
            const active =
              tab.href === '/admin'
                ? pathname === '/admin'
                : pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1"
              >
                <Icon name={tab.icon} size={22} color={active ? '#4263E8' : '#9CA3AF'} filled={active} />
                <span
                  className={`text-[10px] font-bold ${active ? 'text-[#4263E8]' : 'text-[#9CA3AF]'}`}
                >
                  {tab.label}
                </span>
                {active && <span className="w-1 h-1 rounded-full bg-[#4263E8]" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
