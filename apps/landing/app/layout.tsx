import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Inter, Amiri_Quran } from 'next/font/google';
import './globals.css';

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-arabic',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const amiriQuran = Amiri_Quran({
  subsets: ['arabic', 'latin'],
  weight: '400',
  variable: '--font-amiri-quran',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#073d35',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'المِلّة — رفيقك الهادئ لحفظ القرآن الكريم',
  description:
    'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق خطوات يومية هادئة برواية حفص عن عاصم، بدون حساب أو إعلانات.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${ibmArabic.variable} ${inter.variable} ${amiriQuran.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
