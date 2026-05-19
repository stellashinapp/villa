'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { type IconName } from '@/components/Icon';

type ResidentSession = {
  id: string; name: string; phone: string; ho: string;
  villaId: string; villaName: string; villaAddress: string;
};

type TabDef = { href: string; label: string; icon: IconName };

const TABS: TabDef[] = [
  { href: '/resident/bills', label: '관리비', icon: 'bills' },
  { href: '/resident/notices', label: '공지', icon: 'notice' },
  { href: '/resident/community', label: '커뮤니티', icon: 'community' },
  { href: '/resident/parking', label: '주차', icon: 'parking' },
  { href: '/resident/settings', label: '내정보', icon: 'settings' },
];

export default function ResidentTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('villatolk:resident');
      if (!raw) { router.replace('/resident/login'); setSession(null); return; }
      setSession(JSON.parse(raw) as ResidentSession);
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

      {/* 하단 탭바 — 아파트아이 스타일 (5개) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F2F5] z-50 h-[72px] pt-2 pb-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-sm mx-auto h-full flex">
          {TABS.map(tab => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center justify-center gap-1">
                <Icon name={tab.icon} size={24} color={active ? '#3766EE' : '#9CA3AF'} filled={active} />
                <span className={`text-[11px] font-bold ${active ? 'text-[#3766EE]' : 'text-[#9CA3AF]'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 신고/민원은 떠있는 FAB (아파트아이 + 버튼 스타일) */}
      <Link
        href="/resident/report"
        className="fixed bottom-[88px] right-5 z-40 w-14 h-14 rounded-full bg-[#3766EE] text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        aria-label="신고/민원"
      >
        <Icon name="report" size={26} color="white" filled />
      </Link>
    </div>
  );
}
