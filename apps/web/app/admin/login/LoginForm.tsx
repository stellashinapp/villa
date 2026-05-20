'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">아이디</label>
        <input
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin"
          className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-4 py-3.5 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition"
        />
      </div>
      <div>
        <label className="block text-[13px] font-bold text-[#0F2242] mb-1.5">비밀번호</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-4 py-3.5 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition"
        />
      </div>
      {error && (
        <div className="bg-[#FEE8E7] text-[#FF3B30] border border-[#FF3B30]/20 rounded-2xl px-3 py-2.5 text-[13px]">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2B2BEE] text-white rounded-2xl py-3.5 text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition-colors"
      >
        {loading ? '확인 중…' : '로그인'}
      </button>
    </form>
  );
}
