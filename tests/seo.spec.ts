import { test, expect } from '@playwright/test';

const publicOrigin = process.env.SEO_EXPECT_SITE_URL;

test('SEO: public and preview metadata, sitemap and structured data agree', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<html lang="ru"');
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toMatch(/<title>Автоматизация бизнеса/);
  expect(html).toMatch(/<meta name="description" content="Михаил Козлов/);
  expect(html).toContain(`name="robots" content="${publicOrigin ? 'index, follow' : 'noindex, nofollow'}"`);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain('Disallow: /api/');
  expect(robots).not.toMatch(/Disallow: \/(?:admin|privacy|consent)/);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  if (publicOrigin) {
    expect(new URL(html.match(/rel="canonical" href="([^"]+)"/)![1]).href).toBe(`${publicOrigin}/`);
    expect(html).toContain(`property="og:url" content="${publicOrigin}"`);
    expect(html).toContain(`name="twitter:image" content="${publicOrigin}/opengraph-image"`);
    expect(html).not.toMatch(/content="http:\/\/(?:localhost|127\.0\.0\.1)/);
    expect(robots).toContain(`Sitemap: ${publicOrigin}/sitemap.xml`);
    expect(sitemap).toContain(`<loc>${publicOrigin}/</loc>`);
    expect(sitemap.match(/<url>/g)).toHaveLength(1);
  } else {
    expect(html).not.toContain('rel="canonical"');
    expect(robots).not.toContain('Sitemap:');
    expect(sitemap).not.toContain('<loc>');
  }
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  expect(json).toBeTruthy();
  const graph = JSON.parse(json!)['@graph'] as Record<string, unknown>[];
  expect(graph.filter(item => item['@type'] === 'Person')).toHaveLength(1);
  expect(graph.filter(item => item['@type'] === 'Service')).toHaveLength(4);
  expect(graph.some(item => item['@type'] === 'ProfessionalService')).toBe(false);
  expect(graph.filter(item => item['@type'] === 'WebSite')).toHaveLength(publicOrigin ? 1 : 0);
  const image = await request.get('/opengraph-image');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  const bytes = await image.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});

test('SEO: private pages and missing pages stay out of the index', async ({ request }) => {
  for (const path of ['/admin', '/privacy', '/consent']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toMatch(/rel="canonical" href="https?:\/\/[^/]+\/?"/);
    if (path === '/admin') expect(response.headers()['x-robots-tag']).toContain('noindex');
  }
  expect((await request.get('/missing-seo-check-page')).status()).toBe(404);
  const api = await request.get('/api/admin/export');
  expect(api.status()).toBe(401);
  expect(api.headers()['x-robots-tag']).toContain('noindex');
});
