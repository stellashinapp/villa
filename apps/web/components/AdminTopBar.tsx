import type { ReactNode } from 'react';

/**
 * 관리자 메인 페이지 공통 상단 헤더 — 입주민(ResidentPageHeader) 과 동일 스타일로 통일
 * - 흰 배경 + 하단 보더, px-5 pt-4 pb-4, max-w-screen-sm 정렬
 * - eyebrow(13px bold 블루) / 대제목(24px black) / 소제목(13px gray)
 * - 우측 액션(버튼 등)
 */
export default function AdminTopBar({
  title,
  subtitle,
  eyebrow,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
}) {
  return (
    <header
      className="bg-white px-5 pb-4 border-b border-[#F0F2F5]"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <div className="max-w-screen-sm mx-auto flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-[13px] font-bold text-[#2B2BEE] truncate">{eyebrow}</p>}
          <h1 className="text-[24px] font-black text-[#0F2242] mt-1 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[13px] text-[#6B7280] mt-1">{subtitle}</p>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}
