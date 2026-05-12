'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  // 홈 페이지는 figma 디자인의 자체 헤더 사용 (이미 sticky)
  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f2242] shadow-[0_2px_12px_rgba(15,34,66,0.18)]">
      <div className="h-[68px] flex items-center justify-between max-w-[1920px] mx-auto px-6 md:px-[244px]">
        <Link
          href="/"
          className="text-[28px] font-black tracking-tight text-white hover:text-[#3d54ff] transition-colors"
        >
          Villatolk
        </Link>
        <nav className="flex items-center gap-[24px] md:gap-[48px]">
          <Link
            href="/#features"
            className="text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors"
          >
            기능
          </Link>
          <Link
            href="/#pricing"
            className="text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors"
          >
            요금
          </Link>
          <Link
            href="/#faq"
            className="text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/download"
            className="ml-[8px] px-[20px] py-[10px] bg-[#1f63e9] text-[16px] font-bold text-white rounded-[10px] hover:bg-[#3d54ff] transition-colors"
          >
            앱 다운로드
          </Link>
        </nav>
      </div>
    </header>
  );
}
