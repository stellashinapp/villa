'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 로그아웃 실패해도 어차피 cookie 만료 시 진입 차단됨
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="text-xs text-t3 hover:text-t1 px-2.5 py-1 rounded border border-border hover:border-t3 transition-colors disabled:opacity-50"
    >
      {busy ? '…' : '로그아웃'}
    </button>
  );
}
