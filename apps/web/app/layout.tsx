import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Inter, Amiri, Amiri_Quran, Noto_Naskh_Arabic } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/milla/ServiceWorkerRegister';
import { ThemeSync } from '@/components/milla/ThemeSync';
import { InstallPwaBanner } from '@/components/milla/InstallPwaBanner';
import { ReminderScheduler } from '@/components/milla/ReminderScheduler';

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.al-milla.khalilbchir.pro';

export const viewport: Viewport = {
  themeColor: '#073d35',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'المِلّة: رفيقك لحفظ القرآن الكريم',
    template: '%s | المِلّة',
  },
  description:
    'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق منهجية متأنية برواية حفص عن عاصم بالرسم العثماني.',
  applicationName: 'المِلّة',
  keywords: [
    'حفظ القرآن الكريم',
    'تطبيق المِلّة',
    'مراجعة القرآن',
    'المصحف الشريف',
    'رواية حفص عن عاصم',
    'Al-Millah',
    'Quran memorization',
    'Uthmani Mushaf',
  ],
  authors: [{ name: 'Al-Millah' }],
  creator: 'Al-Millah',
  publisher: 'Al-Millah',
  category: 'education',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'ar_TN',
    alternateLocale: ['en_US', 'fr_FR'],
    url: '/',
    siteName: 'المِلّة | Al-Millah',
    title: 'المِلّة: رفيقك لحفظ القرآن الكريم',
    description:
      'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق منهجية متأنية برواية حفص عن عاصم بالرسم العثماني.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المِلّة: رفيقك لحفظ القرآن الكريم',
    description:
      'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق منهجية متأنية برواية حفص عن عاصم.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'المِلّة | Al-Millah',
  url: APP_URL,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Works offline as a PWA.',
  isAccessibleForFree: true,
  inLanguage: ['ar', 'en', 'fr'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق منهجية متأنية برواية حفص عن عاصم بالرسم العثماني.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSON_LD) }}
        />
        <ThemeSync />
        <ServiceWorkerRegister />
        <InstallPwaBanner />
        <ReminderScheduler />
        {children}
      </body>
    </html>
  );
}
