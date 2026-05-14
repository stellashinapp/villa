import Link from 'next/link';
import ResidentSignupForm from './ResidentSignupForm';

export const dynamic = 'force-dynamic';

export default function ResidentSignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-navy text-white px-6 pt-12 pb-10">
        <Link href="/resident/login" className="text-xs text-white/60 hover:text-white">← 로그인으로</Link>
        <p className="text-xs text-white/40 tracking-widest font-bold mt-6 mb-1">입주 신청</p>
        <h1 className="text-2xl font-extrabold leading-tight">{'살고 있는 빌라·호실로\n신청해 주세요'}</h1>
        <p className="text-xs text-white/50 mt-3 leading-relaxed">
          신청 후 빌라 관리자가 확인·승인하면 로그인 가능해집니다 (보통 1일 이내)
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-12">
        <div className="w-full max-w-sm mx-auto">
          <ResidentSignupForm />
        </div>
      </div>
    </div>
  );
}
