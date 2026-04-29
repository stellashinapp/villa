import { TERMS_OF_SERVICE, TERMS_VERSION } from '@/lib/terms';

export const metadata = {
  title: '이용약관 - 빌라톡',
};

export default function TermsPage() {
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">이용약관</h1>
          <span className="text-xs text-gray-500">v{TERMS_VERSION}</span>
        </div>
        <div className="bg-gray-50 rounded-2xl p-8">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{TERMS_OF_SERVICE}</pre>
        </div>
      </div>
    </section>
  );
}
