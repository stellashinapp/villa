'use client';

import { useRouter } from 'next/navigation';

export default function ResidentPageHeader({
  villaName,
  title,
  ho,
  name,
}: {
  villaName: string;
  title: string;
  ho: string;
  name: string;
}) {
  const router = useRouter();

  function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try {
      sessionStorage.removeItem('villatolk:resident');
      sessionStorage.removeItem('villatolk:resident-data');
    } catch {}
    router.replace('/resident/login');
  }

  return (
    <header className="bg-white px-5 pt-4 pb-4 border-b border-[#F0F2F5]">
      <div className="max-w-screen-sm mx-auto flex items-start justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#2B2BEE]">{villaName}</p>
          <h1 className="text-[24px] font-black text-[#0F2242] mt-1 leading-tight">{title}</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">{ho} {name}님</p>
        </div>
        <button
          onClick={logout}
          className="bg-[#F5F6FA] text-[#6B7280] text-[12px] font-bold px-3 py-1.5 rounded-xl hover:bg-[#EEF0F4] transition"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
