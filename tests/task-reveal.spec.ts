import { expect, test } from '@playwright/test';

test('wheel scrolling reveals only solutions from the right inside their cells', async ({ page }) => {
  await page.addInitScript(() => {
    const samples: { dx: number; problemX: number }[][] = [[], [], [], []];
    Object.assign(window, { taskSamples: samples });
    function sample() {
      document.querySelectorAll<HTMLElement>('[data-task-solution]').forEach((cell, index) => {
        if (cell.dataset.entered !== 'true') return;
        const span = cell.querySelector('span')!, row = cell.closest('.task-pair')!, panel = cell.closest('.tasks-panel')!;
        const transform = getComputedStyle(span).transform;
        samples[index].push({ dx: transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41, problemX: row.querySelector('dt')!.getBoundingClientRect().x - panel.getBoundingClientRect().x });
      });
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  for (const [width, height, reducedMotion] of [[1906,927,'no-preference'],[390,844,'reduce']] as const) {
    await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion });
    await page.goto('/'); await page.evaluate(() => document.fonts.ready);
    const cells = page.locator('[data-task-solution]');
    await expect(cells).toHaveCount(4);
    for (const cell of await cells.all()) expect(await cell.getAttribute('data-entered')).toBeNull();
    for (let step = 0; step < 30 && await cells.last().getAttribute('data-entered') !== 'true'; step++) {
      await page.mouse.wheel(0, 160); await page.waitForTimeout(80);
    }
    await expect(cells.last()).toHaveAttribute('data-entered', 'true');
    await expect.poll(() => cells.evaluateAll(elements => elements.every(el => getComputedStyle(el.querySelector('span')!).transform === 'none'))).toBe(true);
    const samples = await page.evaluate(() => (window as unknown as { taskSamples: {dx:number;problemX:number}[][] }).taskSamples);
    for (const frames of samples) {
      expect(frames.some(frame => frame.dx > 20)).toBe(true);
      expect(frames.at(-1)!.dx).toBe(0);
      expect(Math.max(...frames.map(frame => frame.problemX)) - Math.min(...frames.map(frame => frame.problemX))).toBeLessThan(1);
    }
    for (const cell of await cells.all()) expect(await cell.evaluate(el => getComputedStyle(el).overflowX)).toBe('clip');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1906) await page.locator('#tasks').screenshot({ path: 'qa/screenshots/tasks-solutions-revealed.png' });
  }
});
