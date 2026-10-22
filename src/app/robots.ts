import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  // Crawlers must be able to read noindex on HTML pages, including previews.
  // API endpoints do not contain indexable page content.
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}) };
}
