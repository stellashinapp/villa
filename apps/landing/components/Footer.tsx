'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-32">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="text-xl font-black text-primary mb-3 tracking-tight">Villatolk</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              빌라·다세대 공동관리의 모든 것.<br />
              관리비부터 입주민 소통까지.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">서비스</h4>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><Link href="/#features" className="hover:text-primary">기능</Link></li>
              <li><Link href="/#pricing" className="hover:text-primary">요금제</Link></li>
              <li><Link href="/download" className="hover:text-primary">앱 다운로드</Link></li>
              <li><Link href="/#faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">고객지원</h4>
            <ul className="space-y-2 text-xs text-gray-600">
              <li><a href="mailto:villatolk@andnew.kr" className="hover:text-primary">villatolk@andnew.kr</a></li>
              <li><Link href="/legal/terms" className="hover:text-primary">이용약관</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-primary">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3">사업자 정보</h4>
            <ul className="space-y-1 text-xs text-gray-500 leading-relaxed">
              <li>앤뉴 (ANDNEW)</li>
              <li>대표: 신경아</li>
              <li>주소: 서울특별시 송파구 송파대로 111</li>
              <li>사업자등록번호: 296-86-02637</li>
              <li>이메일: villatolk@andnew.kr</li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between gap-3 text-xs text-gray-500">
          <span>© 2026 ANDNEW. All rights reserved.</span>
          <span>본사 관리자 → <a href="https://villatolk-admin.vercel.app" className="text-primary hover:underline">villatolk-admin.vercel.app</a></span>
        </div>
      </div>
    </footer>
  );
}
