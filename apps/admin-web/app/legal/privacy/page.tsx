import { PRIVACY_POLICY, PRIVACY_VERSION } from '@villatolk/shared';

export const metadata = {
  title: '개인정보처리방침 - 빌라톡',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-t1">개인정보처리방침</h1>
        <span className="text-xs text-t3">v{PRIVACY_VERSION}</span>
      </div>
      <div className="bg-card border border-border rounded-[10px] p-8">
        <pre className="whitespace-pre-wrap text-sm text-t1 leading-relaxed font-sans">{PRIVACY_POLICY}</pre>
      </div>
    </div>
  );
}
