'use client';

import { useEffect } from 'react';

/**
 * 모바일 키보드 노출 시 fixed bottom 탭바가 본문과 겹치지 않게 자동 숨김.
 *
 * 동작:
 * - visualViewport.height < innerHeight 의 85% 이하 → 키보드 열렸다고 판단
 * - <html data-keyboard-open="1"> 설정 → globals.css 의 [data-tabbar] 자동 숨김
 *
 * 키보드 닫히면 즉시 복원.
 */
export default function KeyboardWatcher() {
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    function onResize() {
      const root = document.documentElement;
      if (!vv) return;
      const ratio = vv.height / window.innerHeight;
      root.dataset.keyboardOpen = ratio < 0.85 ? '1' : '0';
    }
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  return null;
}
