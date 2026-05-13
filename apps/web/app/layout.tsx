import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: '빌라톡',
  description: '빌라·다세대 공동관리 서비스',
  applicationName: '빌라톡',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '빌라톡',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#4263E8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${noto.variable} font-sans bg-bg text-t1 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
