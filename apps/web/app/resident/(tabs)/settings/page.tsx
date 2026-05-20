'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ResidentSession = {
  id: string; name: string; phone: string; ho: string;
  villaName: string; villaAddress: string;
};

type VillaData = { villa?: { account_bank?: string; account_number?: string } | null };

export default function ResidentSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null>(null);
  const [accountBank, setAccountBank] = useState<string | null>(null);
  const [accountNum, setAccountNum] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    setSession(JSON.parse(raw) as ResidentSession);
    const dataRaw = sessionStorage.getItem('villatolk:resident-data');
    if (dataRaw) {
      try {
        const d = JSON.parse(dataRaw) as VillaData;
        setAccountBank(d.villa?.account_bank ?? null);
        setAccountNum(d.villa?.account_number ?? null);
      } catch {}
    }
  }, []);

  function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    sessionStorage.removeItem('villatolk:resident');
    sessionStorage.removeItem('villatolk:resident-data');
    router.replace('/');
  }

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <header className="bg-white px-5 pt-3 pb-3 sticky top-0 z-30 border-b border-[#F0F2F5]">
        <p className="text-[10px] font-bold text-[#9CA3AF] tracking-widest">{session?.villaName}</p>
        <h1 className="text-[18px] font-extrabold text-[#0F2242] mt-0.5">내정보</h1>
      </header>

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {/* 프로필 카드 */}
        <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-2xl p-5 text-white shadow-md mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-[24px] font-black">
              {session?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-black">{session?.name ?? '-'}</p>
              <p className="text-[12px] opacity-80 mt-0.5">{session?.villaName} {session?.ho}</p>
            </div>
          </div>
        </div>

        {/* 내 정보 카드 */}
        <Section title="내 정보">
          <Row label="이름" value={session?.name ?? '-'} />
          <Row label="전화번호" value={session?.phone ?? '-'} />
          <Row label="빌라" value={session?.villaName ?? '-'} />
          <Row label="호실" value={session?.ho ?? '-'} />
        </Section>

        {/* 입금 계좌 */}
        {(accountBank || accountNum) && (
          <Section title="관리비 입금 계좌">
            <div className="flex items-center">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] mr-3 bg-[#E9E9FD]">💳</span>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#0F2242]">{accountBank} {accountNum}</p>
              </div>
            </div>
          </Section>
        )}

        {/* 이사하기 — 강조 액션 카드 */}
        <Link href="/resident/moveout" className="block bg-white border border-[#F0F2F5] rounded-2xl p-4 shadow-sm mb-4 active:scale-[0.99] transition">
          <div className="flex items-center">
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] mr-3 bg-[#FFF0E6]">📦</span>
            <div className="flex-1">
              <p className="text-[15px] font-extrabold text-[#0F2242]">이사 신청</p>
              <p className="text-[12px] text-[#6B7280] mt-0.5">이사 예정일과 정산 정보를 관리자에게 전송</p>
            </div>
            <span className="text-[#9CA3AF] text-xl">›</span>
          </div>
        </Link>

        {/* 약관 */}
        <Section title="약관 및 정책">
          <ExternalRow href="https://villtalk.store/legal/terms" label="이용약관" />
          <ExternalRow href="https://villtalk.store/legal/privacy" label="개인정보 처리방침" />
        </Section>

        {/* 앱 정보 */}
        <Section title="앱 정보">
          <Row label="앱 버전" value="v1.0.0" />
          <Row label="고객센터" value="villatolk@andnew.kr" valueClassName="text-[#2B2BEE]" />
        </Section>

        <button onClick={handleLogout}
          className="w-full mt-2 bg-white border border-[#FEE8E7] rounded-2xl py-4 text-[#FF3B30] text-[15px] font-bold">
          로그아웃
        </button>

        <p className="text-center mt-5 text-[11px] text-[#9CA3AF]">ANDNEW 2026</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-bold text-[#6B7280] mb-2 px-1 tracking-wider">{title}</h2>
      <div className="bg-white border border-[#F0F2F5] rounded-2xl p-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#F5F6FA] last:border-b-0">
      <span className="text-[14px] text-[#6B7280]">{label}</span>
      <span className={`text-[14px] font-semibold text-[#0F2242] ${valueClassName}`}>{value}</span>
    </div>
  );
}

function ExternalRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex justify-between items-center py-2.5 border-b border-[#F5F6FA] last:border-b-0">
      <span className="text-[14px] font-semibold text-[#0F2242]">{label}</span>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </a>
  );
}
