import Link from 'next/link';
import ResidentLoginForm from './ResidentLoginForm';

export const dynamic = 'force-dynamic';

export default function ResidentLoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-navy text-white px-6 pt-12 pb-10">
        <Link href="/" className="text-xs text-white/60 hover:text-white">← 처음으로</Link>
        <p className="text-xs text-white/40 tracking-widest font-bold mt-6 mb-1">입주민 로그인</p>
        <h1 className="text-2xl font-extrabold leading-tight">{'이름과 전화번호로\n로그인하세요'}</h1>
        <p className="text-xs text-white/50 mt-3 leading-relaxed">
          관리자가 등록한 정보와 일치하면 자동으로 빌라·호실이 매칭됩니다
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10">
        <div className="w-full max-w-sm mx-auto">
          <ResidentLoginForm />

          <div className="mt-8 bg-priL/40 border border-pri/15 rounded-xl px-4 py-3 text-xs text-t2 leading-relaxed">
            💡 입주민은 이메일 가입이 필요 없습니다. 관리자가 입주민 정보를 등록한 후 본인인증을 거쳐 로그인하시면 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
