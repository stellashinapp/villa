'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ResidentSession = {
  id: string;
  name: string;
  phone: string;
  ho: string;
  villaName: string;
  villaAddress: string;
};

type VillaData = { villa?: { account?: string } | null };

export default function ResidentSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<ResidentSession | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    setSession(JSON.parse(raw) as ResidentSession);

    const dataRaw = sessionStorage.getItem('villatolk:resident-data');
    if (dataRaw) {
      try {
        const d = JSON.parse(dataRaw) as VillaData;
        const v = d.villa as { account?: string } | null | undefined;
        if (v?.account) setAccount(v.account);
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
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <p className="text-[11px] text-[#4263E8] font-bold tracking-[0.16em] mb-1.5">RESIDENT</p>
      <h1 className="text-[22px] font-black text-[#0F2242]">설정</h1>

      {/* 내 정보 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">내 정보</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Row label="이름" value={session?.name ?? '-'} />
        <Divider />
        <Row label="전화번호" value={session?.phone ?? '-'} />
        <Divider />
        <Row label="빌라" value={session?.villaName ?? '-'} />
        <Divider />
        <Row label="호실" value={session?.ho ?? '-'} />
      </div>

      {/* 관리비 입금 계좌 */}
      {account && (
        <>
          <h2 className="text-[13px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">관리비 입금 계좌</h2>
          <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#0F2242]">{account}</p>
          </div>
        </>
      )}

      {/* 약관 및 정책 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">약관 및 정책</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <LegalRow href="https://villtalk.store/legal/terms" label="이용약관" />
        <Divider />
        <LegalRow href="https://villtalk.store/legal/privacy" label="개인정보 처리방침" />
      </div>

      {/* 이사 신청 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">이사 관리</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Link
          href="/resident/moveout"
          className="flex justify-between items-center py-2.5"
        >
          <span className="text-sm font-semibold text-[#0F2242]">이사 신청</span>
          <span className="text-xl text-[#9CA3AF]">›</span>
        </Link>
      </div>

      {/* 앱 정보 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-5 mb-2.5 tracking-wider">앱 정보</h2>
      <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
        <Row label="앱 버전" value="v1.0.0" />
        <Divider />
        <Row label="고객센터" value="villatolk@andnew.kr" valueClassName="text-[#4263E8]" />
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 bg-[rgba(231,76,60,0.06)] border border-[rgba(231,76,60,0.12)] rounded-2xl py-4 text-[#E74C3C] text-[15px] font-bold"
      >
        로그아웃
      </button>

      <p className="text-center mt-5 text-[11px] text-[#9CA3AF]">ANDNEW 2026</p>
    </div>
  );
}

function Row({ label, value, valueClassName = '' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <span className={`text-[13px] font-semibold text-[#0F2242] ${valueClassName}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#E8EBF0] my-1.5" />;
}

function LegalRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex justify-between items-center py-2.5"
    >
      <span className="text-sm font-semibold text-[#0F2242]">{label}</span>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </a>
  );
}
