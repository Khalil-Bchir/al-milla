import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Inter, Amiri, Amiri_Quran, Noto_Naskh_Arabic } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/milla/ServiceWorkerRegister';
import { ThemeSync } from '@/components/milla/ThemeSync';
import { InstallPwaBanner } from '@/components/milla/InstallPwaBanner';

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

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const amiriQuran = Amiri_Quran({
  subsets: ['arabic', 'latin'],
  weight: '400',
  variable: '--font-amiri-quran',
  display: 'swap',
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-naskh',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#073d35',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'المِلّة: رفيقك لحفظ القرآن الكريم',
    template: '%s | المِلّة',
  },
  description:
    'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق منهجية متأنية برواية حفص عن عاصم بالرسم العثماني.',
  applicationName: 'المِلّة',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'المِلّة',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${ibmArabic.variable} ${inter.variable} ${amiri.variable} ${amiriQuran.variable} ${notoNaskh.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeSync />
        <ServiceWorkerRegister />
        <InstallPwaBanner />
        {children}
      </body>
    </html>
  );
}
