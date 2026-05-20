'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Candidate = { id: string; name: string; address: string };

export default function ResidentSignupForm() {
  const router = useRouter();
  const [villaName, setVillaName] = useState('');
  const [ho, setHo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCandidates(null);
    if (!villaName.trim() || !ho.trim() || !name.trim() || !phone.trim()) {
      setError('모든 항목을 입력해 주세요');
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('submit-resident-application', {
        body: { villaName: villaName.trim(), ho: ho.trim(), name: name.trim(), phone: phone.replace(/\D/g, '') },
      });

      const ctxErr = (fnErr as unknown as { context?: { json?: { error?: { code?: string; message?: string; candidates?: Candidate[] } } } })?.context?.json?.error;
      const fnError = (data as { error?: { code?: string; message?: string; candidates?: Candidate[] } })?.error;
      const err = ctxErr ?? fnError;

      if (err) {
        if (err.code === 'MULTIPLE_VILLA' && err.candidates) {
          setCandidates(err.candidates);
          setError(err.message ?? '여러 빌라가 매칭됩니다');
        } else {
          setError(err.message ?? '신청 실패');
        }
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-5">📮</div>
        <h2 className="text-xl font-extrabold text-t1 mb-3">신청 완료</h2>
        <p className="text-sm text-t2 leading-relaxed mb-6">
          관리자가 확인 후 승인하면 로그인 가능해집니다.<br />
          승인되면 푸시 알림으로 알려드립니다.
        </p>
        <button
          onClick={() => router.replace('/resident/login')}
          className="w-full bg-pri text-white rounded-xl py-3.5 font-bold"
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">빌라명</label>
        <input
          required
          autoFocus
          value={villaName}
          onChange={e => setVillaName(e.target.value)}
          placeholder="예: 행복빌라, 그린파크"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri"
        />
        <p className="text-[13px] text-t3 mt-1.5">관리자가 등록한 정확한 빌라명을 입력하세요</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">호실</label>
        <input
          required
          value={ho}
          onChange={e => setHo(e.target.value)}
          placeholder="예: 101 (호 없이)"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-t3 mb-1.5">이름</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="실명 입력"
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri"
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
          className="w-full bg-white border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-pri"
        />
      </div>

      {error && (
        <div className="bg-errL text-err border border-err/30 rounded-xl px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {candidates && (
        <div className="bg-warnL border border-warn/30 rounded-xl px-3 py-3 text-xs">
          <p className="font-bold mb-2">동일한 이름의 빌라 후보:</p>
          <ul className="space-y-1">
            {candidates.map(c => (
              <li key={c.id} className="text-t2">• {c.name} <span className="text-t3">— {c.address}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-t3">정확한 빌라명을 입력하고 다시 시도해 주세요</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pri text-white rounded-xl py-3.5 text-base font-bold hover:bg-pri/90 disabled:opacity-50"
      >
        {loading ? '신청 중…' : '입주 신청'}
      </button>

      <p className="text-[13px] text-t3 text-center leading-relaxed pt-2">
        신청 시 빌라 관리자에게 알림이 전송됩니다.<br />
        승인되면 푸시 알림으로 알려드립니다.
      </p>
    </form>
  );
}
