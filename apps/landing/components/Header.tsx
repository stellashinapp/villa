'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  usePathname();
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-primary hover:opacity-80 transition">
          빌라톡
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
          <Link href="/#features" className="hover:text-primary transition">기능</Link>
          <Link href="/pricing" className="hover:text-primary transition">요금</Link>
          <Link href="/download" className="hover:text-primary transition">다운로드</Link>
          <Link href="/faq" className="hover:text-primary transition">FAQ</Link>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://villatolk-admin.vercel.app"
            target="_blank"
            rel="noopener"
            className="hidden md:inline text-sm font-semibold text-gray-600 hover:text-primary transition"
          >
            본사 로그인
          </a>
          <Link
            href="/download"
            className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition shadow-sm"
          >
            앱 받기
          </Link>
        </div>
      </div>
    </header>
  );
}
