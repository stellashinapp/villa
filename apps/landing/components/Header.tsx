'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="text-xl font-black tracking-tight">빌라톡</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
          <Link href="/#features" className="hover:text-primary transition">기능</Link>
          <Link href="/#pricing" className="hover:text-primary transition">요금</Link>
          <Link href="/#faq" className="hover:text-primary transition">FAQ</Link>
        </nav>
        <Link
          href="/download"
          className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition shadow-sm"
        >
          앱 받기
        </Link>
      </div>
    </header>
  );
}
