'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function RevealToggle({ reveal, canReveal }: { reveal: boolean; canReveal: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  if (!canReveal) {
    return (
      <span className="text-[11px] text-t3 px-2.5 py-1 rounded-full border border-border bg-bg">
        🔒 마스킹 모드 (슈퍼관리자만 해제 가능)
      </span>
    );
  }

  function toggle() {
    const next = new URLSearchParams(sp.toString());
    if (reveal) next.delete('reveal');
    else next.set('reveal', '1');
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  return (
    <button
      onClick={toggle}
      className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-colors ${
        reveal
          ? 'border-warn/40 bg-warnL text-warn hover:bg-warn/20'
          : 'border-border bg-bg text-t3 hover:bg-card'
      }`}
    >
      {reveal ? '🔓 풀 노출 — 클릭하여 마스킹' : '🔒 마스킹 — 클릭하여 풀 노출 (기록됨)'}
    </button>
  );
}
