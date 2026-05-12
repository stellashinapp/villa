'use client';

import { useState } from 'react';

export type FaqItem = { q: string; a: string };

export default function FaqList({
  items,
  initialOpen = 0,
}: {
  items: FaqItem[];
  initialOpen?: number;
}) {
  const [openIdx, setOpenIdx] = useState<number>(initialOpen);

  function toggle(i: number) {
    setOpenIdx((prev) => (prev === i ? -1 : i));
  }

  return (
    <div className="content-stretch flex flex-col gap-[25px] items-start relative shrink-0">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            onClick={() => toggle(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(i);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            className={`bg-white border border-[#ebebeb] border-solid drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-col items-start px-[29px] relative rounded-[15px] shrink-0 w-[1116px] cursor-pointer hover:border-[#1f63e9] transition-colors ${
              isOpen
                ? 'gap-[25px] py-[27px]'
                : 'gap-0 py-[27px] justify-center'
            }`}
          >
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <p className="font-semibold leading-[50px] not-italic text-[#0f2242] text-[25px] tracking-[-0.375px] flex-1 pr-4">
                {item.q}
              </p>
              <span
                className={`shrink-0 inline-flex items-center justify-center size-[28px] text-[#1f63e9] text-[32px] font-light leading-none transition-transform duration-200 ${
                  isOpen ? 'rotate-45' : ''
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </div>
            {isOpen && (
              <>
                <div className="h-px bg-[#ebebeb] w-full" />
                <p
                  className="font-normal leading-[32px] not-italic text-[#0f2242] text-[22px] tracking-[-0.44px] w-full whitespace-pre-line"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.a}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
