'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminSignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError('이름과 전화번호를 입력해 주세요');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.replace(/\D/g, ''),
          },
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // signUp 성공 후 trigger 가 admins row 자동 생성. 본사 승인 대기 상태.
      setSuccess(true);
      setLoading(false);

      // 3초 후 로그인 페이지로
      setTimeout(() => {
        router.replace('/admin/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-priL/40 border border-pri/30 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-extrabold text-t1 mb-2">가입 신청 완료</h2>
        <p className="text-sm text-t2 leading-relaxed">
          본사 승인 후 로그인 가능합니다.<br />
          평일 기준 1일 이내 처리됩니다.
        </p>
        <p className="text-xs text-t3 mt-4">잠시 후 로그인 화면으로 이동합니다…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">이름</label>
        <input
          required
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 홍길동"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">전화번호</label>
        <input
          required
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="01012345678"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">이메일</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">비밀번호 (8자 이상)</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base text-t1 outline-none focus:border-pri"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">비밀번호 확인</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={e => setPasswordConfirm(e.target.value)}
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
        {loading ? '처리 중…' : '가입 신청'}
      </button>
      <p className="text-xs text-t3 text-center leading-relaxed">
        가입 시 <span className="underline">이용약관</span> 및 <span className="underline">개인정보처리방침</span> 에 동의합니다
      </p>
    </form>
  );
}
