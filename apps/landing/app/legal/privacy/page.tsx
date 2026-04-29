import { PRIVACY_POLICY, PRIVACY_VERSION } from '@/lib/privacy';

export const metadata = {
  title: '개인정보처리방침 - 빌라톡',
};

export default function PrivacyPage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">개인정보처리방침</h1>
          <span className="text-xs text-gray-500">v{PRIVACY_VERSION}</span>
        </div>
        <div className="bg-gray-50 rounded-2xl p-8">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{PRIVACY_POLICY}</pre>
        </div>
      </div>
    </section>
  );
}
