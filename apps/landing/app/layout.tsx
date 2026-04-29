import './globals.css';
import { Noto_Sans_KR } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata = {
  title: '빌라톡 - 빌라·다세대 관리의 모든 것',
  description: '관리비 자동화부터 입주민 소통까지, 빌라 관리는 빌라톡 하나로. 첫 30일 무료체험.',
  openGraph: {
    title: '빌라톡 - 빌라 관리 SaaS',
    description: '월 30,000원부터, 첫 30일 무료. 관리비/공지/민원/주차 한 번에.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={noto.variable}>
      <body className="font-sans">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
