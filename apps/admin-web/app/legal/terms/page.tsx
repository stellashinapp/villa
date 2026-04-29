import { TERMS_OF_SERVICE, TERMS_VERSION } from '@villatolk/shared';

export const metadata = {
  title: '이용약관 - 빌라톡',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-t1">이용약관</h1>
        <span className="text-xs text-t3">v{TERMS_VERSION}</span>
      </div>
      <div className="bg-card border border-border rounded-[10px] p-8">
        <pre className="whitespace-pre-wrap text-sm text-t1 leading-relaxed font-sans">{TERMS_OF_SERVICE}</pre>
      </div>
    </div>
  );
}
