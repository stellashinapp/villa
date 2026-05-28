'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 페이지 전환 즉각 시각피드백 — 상단에 3px 진행바.
 * 탭/Link 클릭하면 즉시 바가 채워지기 시작해서 '눌렀다' 는 감각을 즉시 줌.
 * pathname 변경을 감지 → 0%→60%→90%→100% 단계로 진행 후 페이드아웃.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // pathname 변경 = 새 페이지 도착 = 완료
    setWidth(100);
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 220);
    return () => clearTimeout(hide);
  }, [pathname]);

  // 라우터의 Link 클릭 즉시 바를 표시하기 위해 클릭 이벤트도 후킹
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const start = (e: MouseEvent) => {
      // a 태그/Link 클릭 시 즉시 시작
      const t = e.target as HTMLElement | null;
      const a = t?.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      // 같은 origin · http(s) 만
      if (!href.startsWith('/') && !href.startsWith(window.location.origin)) return;
      // 같은 페이지 anchor 는 무시
      if (href.startsWith('#')) return;
      // 새 탭 열기 무시
      if ((a as HTMLAnchorElement).target === '_blank') return;
      setVisible(true);
      setWidth(0);
      // 다음 tick 에 60%, 0.3s 후 90% — pathname 변경되면 useEffect 가 100% 처리
      requestAnimationFrame(() => setWidth(60));
      setTimeout(() => setWidth(90), 400);
    };
    document.addEventListener('click', start, { capture: true });
    return () => document.removeEventListener('click', start, { capture: true });
  }, []);

  if (!visible && width >= 100) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top)',
        left: 0,
        width: `${width}%`,
        height: 3,
        background: 'linear-gradient(90deg, #2B2BEE 0%, #6B6BF5 100%)',
        boxShadow: '0 0 8px #2B2BEE88',
        transition: width === 0 ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
        opacity: visible ? 1 : 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
}
