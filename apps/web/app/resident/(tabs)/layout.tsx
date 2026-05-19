'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';

type ResidentSession = {
  id: string;
  name: string;
  phone: string;
  ho: string;
  villaId: string;
  villaName: string;
  villaAddress: string;
};

type TabDef = {
  href: string;
  label: string;
  icon: IconName;
};

// 모바일 (resident)/_layout.tsx 와 동일한 순서·라벨·아이콘
const TABS: TabDef[] = [
  { href: '/resident/bills', label: '관리비', icon: 'bills' },
  { href: '/resident/parking', label: '주차', icon: 'parking' },
  { href: '/resident/notices', label: '공지', icon: 'notice' },
  { href: '/resident/community', label: '커뮤니티', icon: 'community' },
  { href: '/resident/report', label: '신고', icon: 'report' },
  { href: '/resident/settings', label: '설정', icon: 'settings' },
];

export default function ResidentTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('villatolk:resident');
      if (!raw) {
        router.replace('/resident/login');
        setSession(null);
        return;
      }
      setSession(JSON.parse(raw) as ResidentSession);
    } catch {
      router.replace('/resident/login');
      setSession(null);
    }
  }, [router]);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">불러오는 중…</p>
      </div>
    );
  }
  if (session === null) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-[80px]">
      {children}

      {/* 하단 탭바 — 모바일 동일 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8EBF0] z-50 h-[65px] pt-1.5 pb-2">
        <div className="max-w-screen-sm mx-auto h-full flex">
          {TABS.map(tab => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1"
              >
                <Icon
                  name={tab.icon}
                  size={22}
                  color={active ? '#4263E8' : '#9CA3AF'}
                  filled={active}
                />
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
