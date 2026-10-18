import { expect, test } from '@playwright/test';

test('decorative artwork has no raster-image controls or rectangular photo backing', async ({ page }) => {
  await page.goto('/');
  const artwork = page.locator('.service-art, .process-ribbon, .contact-ribbon');
  await expect(artwork).toHaveCount(6);
  expect(await artwork.evaluateAll(elements => elements.every(el => el.tagName !== 'IMG' && !el.querySelector('img')))).toBe(true);
  for (const art of await artwork.all()) {
    expect(await art.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    expect(await art.evaluate(el => el.getAttribute('aria-hidden') === 'true')).toBe(true);
  }
});

test('FAQ toggles never move the portrait or trim its upper glow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#questions');
  const portrait = page.locator('.approach-portrait');
  const top = () => portrait.evaluate(el => el.getBoundingClientRect().top + scrollY);
  const initial = await top();
  for (const button of await page.locator('.faq-item button').all()) {
    await button.click();
    expect(Math.abs(await top() - initial)).toBeLessThan(1);
  }
  await page.locator('.faq-item button').last().click();
  expect(Math.abs(await top() - initial)).toBeLessThan(1);
  expect(await portrait.evaluate(el => parseFloat(getComputedStyle(el).paddingTop))).toBeGreaterThanOrEqual(20);
});

test('only the header surface is opaque, with no full-width backing strip', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 360));
  const band = await page.locator('.site-header').evaluate(el => {
    const style = getComputedStyle(el, '::before');
    return { content: style.content, position: style.position, background: style.backgroundColor, height: parseFloat(style.height) };
  });
  expect(band.content).toBe('none');
  const surface = await page.locator('.header-surface').evaluate(el => ({ background: getComputedStyle(el).backgroundImage, blur: getComputedStyle(el).backdropFilter }));
  expect(surface.background).toContain('linear-gradient');
  expect(surface.background).not.toContain('rgba');
  expect(surface.blur).toBe('none');
});

test('hero portrait and its glow stay below the header on initial load', async ({ page }) => {
  for (const [width, height] of [[1906,927], [1920,1080], [1440,900], [1366,768], [1280,720], [1024,768], [390,844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const header = await page.locator('.header-surface').boundingBox();
    const portrait = await page.locator('.hero-portrait').boundingBox();
    expect(header).toBeTruthy(); expect(portrait).toBeTruthy();
    expect(portrait!.y - (header!.y + header!.height), `${width}x${height} portrait clearance`).toBeGreaterThanOrEqual(20);
  }
});

test('glass keeps working backdrop blur after CSS production compilation', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).backdropFilter)).toBe('blur(7px)');
});

test('FAQ panel, section and document keep their size for every open and closed state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1906,927],[1440,900],[1280,720],[834,1194],[390,844],[320,568]]) {
    await page.setViewportSize({ width, height }); await page.goto('/#questions');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.faq-list')).toHaveAttribute('style', /height:/);
    const measure = () => page.evaluate(() => ({ panel: document.querySelector('.faq-panel')!.getBoundingClientRect().height, section: document.querySelector('#questions')!.getBoundingClientRect().height, document: document.documentElement.scrollHeight }));
    const initial = await measure();
    for (const button of await page.locator('.faq-item button').all()) {
      await button.click();
      expect(await measure(), `${width}px open FAQ`).toEqual(initial);
      await button.click();
      expect(await measure(), `${width}px closed FAQ`).toEqual(initial);
    }
  }
});

test('all service cards fit below desktop navigation after anchor navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[1906,827],[1920,1080],[1440,900],[1366,768],[1280,720]]) {
    await page.setViewportSize({ width, height }); await page.goto('/');
    await page.getByRole('link', { name: 'Услуги', exact: true }).click();
    const box = await page.locator('.services-grid').boundingBox();
    expect(box!.y + box!.height, `${width}x${height} services bottom`).toBeLessThanOrEqual(height);
    const title = await page.locator('#services-title').boundingBox();
    const header = await page.locator('.header-surface').boundingBox();
    expect(title!.y).toBeGreaterThan(header!.y + header!.height);
  }
});
