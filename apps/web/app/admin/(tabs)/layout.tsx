'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { registerPush } from '@/lib/push';
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
      // 네이티브 앱이면 푸시 등록 (웹에선 무시)
      void registerPush({ type: 'admin', authId: user.id });
    })();
  }, [pathname, router]);

  if (!authChecked) {
    return <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center"><p className="text-[14px] text-[#9CA3AF]">불러오는 중…</p></div>;
  }

  return (
    <div
      className="min-h-screen bg-[#F5F6FA]"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 52px)',
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
      }}
    >
      {/* 고정 브랜드 헤더 — 모든 관리자 탭 페이지에 항상 좌측 빌라톡 노출 */}
      <header
        className="fixed top-0 left-0 right-0 bg-white z-40 border-b border-[#F0F2F5]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-screen-sm mx-auto h-[52px] px-5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-1.5">
            <span className="text-[#2B2BEE] text-[20px] font-black leading-none">✦</span>
            <span className="text-[18px] font-black text-[#0F2242] leading-none">빌라톡</span>
          </Link>
        </div>
      </header>

      {children}

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F2F5] z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-screen-sm mx-auto h-[72px] pt-2 pb-3 flex">
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
