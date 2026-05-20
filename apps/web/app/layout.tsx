import type { Metadata, Viewport } from 'next';
import PwaRegister from '@/components/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: '빌라톡',
  description: '빌라·다세대 공동관리 서비스',
  applicationName: '빌라톡',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '빌라톡',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#2B2BEE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans bg-bg text-t1 min-h-screen">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
