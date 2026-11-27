import type { Metadata } from 'next';
import { DownloadClient } from '@/components/DownloadClient';

export const metadata: Metadata = {
  title: 'تحميل تطبيق الأندرويد (APK)',
  description:
    'حمّل تطبيق المِلّة للأندرويد مباشرة بصيغة APK مجاناً بدون إعلانات أو حساب إلزامي، مع خطوات التثبيت الآمن.',
  alternates: {
    canonical: '/download',
  },
};

export default function DownloadPage() {
  return <DownloadClient />;
}
