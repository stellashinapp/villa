import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * 약관/정책 문서 공통 레이아웃 (이용약관·개인정보·환불규정 공용)
 */
export default function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <header
        className="bg-white px-5 pb-4 border-b border-[#F0F2F5]"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="max-w-screen-sm mx-auto">
          <h1 className="text-[22px] font-black text-[#0F2242] leading-tight">{title}</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-1">시행일 {updatedAt}</p>
        </div>
      </header>

      <div className="max-w-screen-sm mx-auto px-5 py-6">
        <article className="bg-white rounded-xl border border-[#F0F2F5] shadow-sm p-5 text-[14px] text-[#374151] leading-[1.8] legal-body">
          {children}
        </article>

        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-5 text-[12px] text-[#9CA3AF]">
          <Link href="/legal/terms" className="hover:text-[#2B2BEE]">이용약관</Link>
          <Link href="/legal/privacy" className="hover:text-[#2B2BEE]">개인정보 처리방침</Link>
          <Link href="/legal/refund" className="hover:text-[#2B2BEE]">환불규정</Link>
        </div>
        <p className="text-center text-[11px] text-[#9CA3AF] mt-3">주식회사 더줌웍스 (ANDNEW) · 2026</p>
      </div>
    </div>
  );
}
