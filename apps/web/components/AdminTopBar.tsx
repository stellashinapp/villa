import type { ReactNode } from 'react';

/**
 * 관리자 메인 페이지 공통 상단바 — 보라 헤더 밴드
 * - 정제된 굵기(extrabold) + 흰색 제목/소제목
 * - 우측 액션은 흰 배경 + 보라 텍스트
 * - 양옆 px-5 / max-w-screen-sm 정렬 통일
 */
export default function AdminTopBar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="bg-[#2B2BEE] rounded-b-[24px]">
      <div className="max-w-screen-sm mx-auto px-5 pt-7 pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-extrabold text-white leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[13px] text-white/80 mt-1">{subtitle}</p>}
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      </div>
    </header>
  );
}
