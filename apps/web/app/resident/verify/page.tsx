'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ResidentSession = {
  id: string; name: string; phone: string; ho: string;
  villaId: string; villaName: string; villaAddress: string;
};

export const dynamic = 'force-dynamic';

export default function ResidentVerifyPage() {
  const router = useRouter();
  const [s, setS] = useState<ResidentSession | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('villatolk:resident');
      if (!raw) { router.replace('/resident/login'); setS(null); return; }
      setS(JSON.parse(raw) as ResidentSession);
    } catch {
      router.replace('/resident/login'); setS(null);
    }
  }, [router]);

  function confirm() {
    try { sessionStorage.setItem('villatolk:resident-verified', '1'); } catch {}
    router.replace('/resident/bills');
  }

  function reject() {
    try {
      sessionStorage.removeItem('villatolk:resident');
      sessionStorage.removeItem('villatolk:resident-data');
      sessionStorage.removeItem('villatolk:resident-verified');
    } catch {}
    router.replace('/resident/login');
  }

  if (!s) {
    return <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center"><p className="text-[14px] text-[#9CA3AF]">불러오는 중…</p></div>;
  }

  const phoneFmt = s.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <header className="bg-white px-5 pt-4 pb-4 border-b border-[#F0F2F5]">
        <div className="max-w-screen-sm mx-auto flex items-center gap-3">
          <Link href="/resident/login" className="w-9 h-9 rounded-2xl bg-[#F5F6FA] flex items-center justify-center text-[16px] text-[#0F2242]">←</Link>
          <h1 className="text-[18px] font-extrabold text-[#0F2242]">본인 확인</h1>
        </div>
      </header>

      <div className="flex-1 px-5 pt-6 max-w-screen-sm mx-auto w-full">
        <div className="bg-gradient-to-br from-[#2B2BEE] to-[#6B6BF5] rounded-2xl px-6 py-7 text-white text-center shadow-md">
          <p className="text-[15px] font-bold opacity-90">{s.villaName}</p>
          <p className="text-[12px] opacity-70 mt-1">{s.villaAddress}</p>
          <p className="text-[42px] font-black mt-4 leading-none">{s.ho}</p>
          <p className="text-[15px] font-bold mt-5">{s.name}님</p>
          <p className="text-[13px] opacity-80 mt-1">{phoneFmt}</p>
        </div>

        <div className="text-center mt-7">
          <p className="text-[16px] font-extrabold text-[#0F2242]">본인이 맞으신가요?</p>
          <p className="text-[13px] text-[#6B7280] mt-1.5">위 정보가 맞으면 입장해주세요.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-7">
          <button
            onClick={reject}
            className="bg-white border border-[#E8EBF0] text-[#0F2242] rounded-2xl py-3.5 text-[15px] font-bold hover:bg-[#F9FAFB] transition"
          >
            아니요
          </button>
          <button
            onClick={confirm}
            className="bg-[#2B2BEE] text-white rounded-2xl py-3.5 text-[15px] font-bold hover:bg-[#1C1CC9] transition"
          >
            네, 맞습니다
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#9CA3AF] py-5">ANDNEW · TheZoomWorks · 2026</p>
    </div>
  );
}
