import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Inter, Amiri_Quran } from 'next/font/google';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://al-milla.khalilbchir.pro';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.al-milla.khalilbchir.pro';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'المِلّة | رفيقك الهادئ لحفظ القرآن الكريم ومراجعته',
    template: '%s | المِلّة',
  },
  description:
    'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق خطوات يومية متأنية برواية حفص عن عاصم بالرسم العثماني، بدون حساب إلزامي أو إعلانات.',
  applicationName: 'المِلّة',
  keywords: [
    'حفظ القرآن الكريم',
    'تطبيق حفظ القرآن',
    'مراجعة القرآن',
    'المصحف العثماني',
    'رواية حفص عن عاصم',
    'المِلّة',
    'Al-Millah',
    'Quran memorization app',
    'Hifz companion',
    'mémorisation du Coran',
  ],
  authors: [{ name: 'Al-Millah' }],
  creator: 'Al-Millah',
  publisher: 'Al-Millah',
  category: 'education',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark.jpg', type: 'image/jpeg', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'ar_TN',
    url: '/',
    siteName: 'المِلّة',
    title: 'المِلّة | رفيقك الهادئ لحفظ القرآن الكريم ومراجعته',
    description:
      'رفيق فردي يومي يجمع بين مراجعة الدروس السابقة، والحفظ الجديد، والتسميع غيباً، وربط الآيات مع تقييم واحد، مجاناً وبدون إعلانات.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المِلّة | رفيقك الهادئ لحفظ القرآن الكريم',
    description:
      'احفظ القرآن الكريم بهدوء وثبات عبر جلسة يومية منظمة في أربع خطوات برواية حفص عن عاصم.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'المِلّة',
      description:
        'تطبيق مجاني فردي لحفظ القرآن الكريم ومراجعته وفق خطوات يومية متأنية برواية حفص عن عاصم.',
      inLanguage: ['ar'],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'المِلّة',
      url: APP_URL,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'iOS, Android',
      isAccessibleForFree: true,
      inLanguage: ['ar'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'رفيق هادئ ومجاني لحفظ القرآن الكريم ومراجعته برواية حفص عن عاصم دون إعلانات أو حساب إلزامي.',
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LANDING_JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
