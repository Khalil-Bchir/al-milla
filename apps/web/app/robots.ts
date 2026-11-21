import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.al-milla.khalilbchir.pro';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings/', '/onboarding/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
