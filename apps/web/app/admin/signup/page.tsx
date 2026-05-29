import Link from 'next/link';
import AdminSignupForm from './AdminSignupForm';

export const dynamic = 'force-dynamic';

export default function AdminSignupPage() {
  return (
    <div
      className="min-h-screen flex flex-col px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="pt-12 pb-6" />

      <div className="flex-1 flex flex-col justify-center pb-16">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <p className="text-xs text-pri tracking-widest font-bold mb-1">VILLATOLK ADMIN</p>
            <h1 className="text-2xl font-extrabold text-t1">관리자 가입</h1>
            <p className="text-sm text-t3 mt-2 leading-relaxed">
              빌라 관리자(건물주·관리 담당자)용 계정 신청. 가입 후 본사 승인 시 로그인 가능합니다.
            </p>
          </div>

          <AdminSignupForm />

          <div className="text-center mt-6 text-sm">
            <span className="text-t3">이미 계정이 있으신가요? </span>
            <Link href="/admin/login" className="text-pri font-semibold hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
