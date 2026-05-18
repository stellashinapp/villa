'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ⚠️ TEMP — REMOVE BEFORE PRODUCTION
// 테스트 편의용 빠른 로그인. 운영 전 fillTestCredentials 함수와 호출 버튼 모두 제거할 것.
const TEST_ADMIN = { email: 'skathezoom@gmail.com', password: 'gogo707070^^' };

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillTestCredentials() {
    setEmail(TEST_ADMIN.email);
    setPassword(TEST_ADMIN.password);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr || !data.session) {
        setError(signInErr?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다');
        setLoading(false);
        return;
      }

      // login_logs 자동 기록 (실패해도 로그인 차단 X)
      supabase.rpc('record_admin_login', { p_ip: null, p_device_info: navigator.userAgent.slice(0, 200) }).then(() => {});

      router.replace(next);
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
          placeholder="example@email.com"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
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
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      {error && (
        <div className="bg-errL text-err border border-err/30 rounded-xl px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pri text-white rounded-xl py-3.5 text-base font-bold hover:bg-pri/90 disabled:opacity-50 transition-colors"
      >
        {loading ? '확인 중…' : '로그인'}
      </button>

      {/* ⚠️ TEMP — REMOVE BEFORE PRODUCTION (테스트용 빠른 로그인 버튼) */}
      <button
        type="button"
        onClick={fillTestCredentials}
        className="w-full bg-amber-50 text-amber-700 border-2 border-dashed border-amber-300 rounded-xl py-2.5 text-xs font-bold hover:bg-amber-100 transition-colors"
      >
        🧪 테스트 관리자 계정 자동입력
      </button>
    </form>
  );
}
