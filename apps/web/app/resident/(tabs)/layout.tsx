'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { registerPush } from '@/lib/push';

type ResidentSession = {
  id: string; name: string; phone: string; ho: string;
  villaId: string; villaName: string; villaAddress: string;
};

type TabDef = { href: string; label: string; icon: IconName };

const TABS: TabDef[] = [
  { href: '/resident/bills', label: '관리비', icon: 'bills' },
  { href: '/resident/parking', label: '주차', icon: 'parking' },
  { href: '/resident/notices', label: '공지', icon: 'notice' },
  { href: '/resident/community', label: '커뮤니티', icon: 'residents' },
  { href: '/resident/report', label: '민원', icon: 'message' },
];

export default function ResidentTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('villatolk:resident');
      if (!raw) { router.replace('/resident/login'); setSession(null); return; }
      // 본인확인 게이트 강제 — verify 거치지 않고 직접 진입 차단
      if (sessionStorage.getItem('villatolk:resident-verified') !== '1') {
        router.replace('/resident/verify'); setSession(null); return;
      }
      const parsed = JSON.parse(raw) as ResidentSession;
      setSession(parsed);
      // 네이티브 앱이면 푸시 등록 (웹에선 무시)
      void registerPush({ type: 'resident', id: parsed.id });
    } catch {
      router.replace('/resident/login'); setSession(null);
    }
  }, [router]);

  if (session === undefined) {
    return <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center"><p className="text-[14px] text-[#9CA3AF]">불러오는 중…</p></div>;
  }
  if (session === null) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-[88px]">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F2F5] z-50 h-[72px] pt-2 pb-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-sm mx-auto h-full flex">
          {TABS.map(tab => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
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
