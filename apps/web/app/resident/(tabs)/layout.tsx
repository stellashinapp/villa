'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  iconOutline: string;
  iconFilled: string;
};

const TABS: TabDef[] = [
  { href: '/resident/bills', label: '관리비', iconOutline: '₩', iconFilled: '₩' },
  { href: '/resident/parking', label: '주차', iconOutline: '🅿', iconFilled: '🅿' },
  { href: '/resident/notices', label: '공지', iconOutline: '📢', iconFilled: '📢' },
  { href: '/resident/community', label: '커뮤니티', iconOutline: '💬', iconFilled: '💬' },
  { href: '/resident/report', label: '신고', iconOutline: '⚠', iconFilled: '⚠' },
  { href: '/resident/settings', label: '설정', iconOutline: '⚙', iconFilled: '⚙' },
];

export default function ResidentTabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null | undefined>(undefined);

  // 세션 가드: sessionStorage 에 villatolk:resident 없으면 로그인으로
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
    <div className="min-h-screen bg-[#F5F6FA] pb-[72px]">
      {children}

      {/* 하단 탭바 — 모바일 앱과 동일 디자인 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8EBF0] z-50">
        <div className="max-w-screen-sm mx-auto flex">
          {TABS.map(tab => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <span
                  className={`text-xl leading-none ${
                    active ? 'text-[#4263E8]' : 'text-[#9CA3AF]'
                  }`}
                  aria-hidden="true"
                >
                  {active ? tab.iconFilled : tab.iconOutline}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    active ? 'text-[#4263E8]' : 'text-[#9CA3AF]'
                  }`}
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
