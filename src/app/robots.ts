import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  return siteUrl ? { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/privacy', '/consent', '/admin'] }, sitemap: `${siteUrl}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } };
}
