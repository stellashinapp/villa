'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: '홈', icon: 'home' },
  { href: '/admin/villas', label: '빌라', icon: 'villa' },
  { href: '/admin/inbox', label: '메시지', icon: 'message' },
  { href: '/admin/settings', label: '내정보', icon: 'settings' },
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
    return <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center"><p className="text-[14px] text-[#9CA3AF]">불러오는 중…</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-[88px]">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F2F5] z-50 h-[72px] pt-2 pb-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-sm mx-auto h-full flex">
          {TABS.map(tab => {
            const active = tab.href === '/admin' ? pathname === '/admin' : pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center justify-center gap-1">
                <Icon name={tab.icon} size={24} color={active ? '#2B2BEE' : '#A8B1C2'} filled={active} />
                <span className={`text-[11px] font-bold ${active ? 'text-[#2B2BEE]' : 'text-[#A8B1C2]'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
