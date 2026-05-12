import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import ChromeShell from './ChromeShell';
import { getViewerEmail, isSuperAdmin } from '@/lib/auth-context';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'ANDNEW Admin Console',
  description: 'ANDNEW 본사 관리 시스템',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get('x-pathname') ?? '';
  const isChrome = !pathname.startsWith('/login') && !pathname.startsWith('/legal');

  const viewer = await getViewerEmail();
  const superAdmin = isSuperAdmin(viewer);

  return (
    <html lang="ko">
      <body className={`${noto.variable} font-sans bg-bg text-t1 min-h-screen`}>
        {isChrome ? (
          <ChromeShell viewer={viewer} superAdmin={superAdmin}>
            {children}
          </ChromeShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
