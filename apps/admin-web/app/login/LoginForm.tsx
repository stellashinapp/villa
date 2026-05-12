'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ next, error: initialError }: { next: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? '로그인 실패');
        setLoading(false);
        return;
      }
      router.replace(next || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">이메일</label>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">비밀번호</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-t1 outline-none focus:border-pri"
        />
      </div>
      {error && (
        <div className="bg-errL text-err border border-err/30 rounded-lg px-3 py-2 text-xs">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pri text-white rounded-lg py-2.5 text-sm font-bold hover:bg-pri/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '확인 중…' : '로그인'}
      </button>
    </form>
  );
}
