import { expect, test } from '@playwright/test';

type Frame = { x: number; right: number; transform: string; portrait: number[] };

test('ordinary page loading plays the entrance with either motion preference and keeps the portrait fixed', async ({ page }) => {
  await page.addInitScript(() => {
    const frames: { x: number; right: number; transform: string; portrait: number[] }[] = [];
    Object.assign(window, { heroFrames: frames });
    function sample() {
      const hero = document.querySelector<HTMLElement>('.hero-copy');
      const portrait = document.querySelector<HTMLElement>('.hero-portrait');
      if (hero?.dataset.entrance === 'ready' && portrait) {
        const box = hero.getBoundingClientRect(), person = portrait.getBoundingClientRect();
        const transform = getComputedStyle(hero).transform;
        frames.push({ x: box.x, right: box.right, transform, portrait: [person.x, person.y, person.width, person.height] });
        if (transform === 'none' && frames.length > 1) return;
      }
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion });
    for (const [width, height] of [[1906,927],[1280,720],[390,844]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const frames = () => page.evaluate(() => (window as unknown as { heroFrames: Frame[] }).heroFrames);
      await expect.poll(async () => (await frames()).filter(frame => frame.transform === 'none').length).toBeGreaterThan(0);
      const observed = await frames();
      expect(observed.some(frame => frame.right <= 1), `${width}px ${reducedMotion}: starts off screen`).toBe(true);
      expect(observed.length).toBeGreaterThan(5);
      expect(observed.at(-1)!.x).toBeGreaterThan(observed[0].x);
      const initial = observed[0].portrait;
      for (const frame of observed) for (let axis = 0; axis < 4; axis++) expect(Math.abs(frame.portrait[axis] - initial[axis])).toBeLessThan(1);
      await page.getByRole('link', { name: 'Mihail Kozlov — на главную', exact: true }).click();
      expect(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).transform)).toBe('none');
      if (width === 1906 && reducedMotion === 'no-preference') await page.screenshot({ path: 'qa/screenshots/hero-entrance-real-load.png' });
    }
  }
});

test('without JavaScript the hero stays readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/');
  await expect(page.locator('.hero-copy')).toBeVisible();
  expect(await page.locator('.hero-copy').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await context.close();
});
