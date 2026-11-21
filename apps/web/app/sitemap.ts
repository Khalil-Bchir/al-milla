import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.al-milla.khalilbchir.pro';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/mushaf', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/memorize', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/revision', priority: 0.85, changeFrequency: 'weekly' },
    { path: '/self-test', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/tafsir', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/mutashabihat', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/progress', priority: 0.7, changeFrequency: 'weekly' },
  ];

  return routes.map((route) => ({
    url: `${APP_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
