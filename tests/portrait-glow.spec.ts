import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('both portrait halos remain visible beyond the top edge of their fade masks', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  for (const selector of ['.hero-portrait', '.approach-portrait']) {
    await page.goto('/');
    await page.locator(`${selector} img`).scrollIntoViewIfNeeded();
    await page.locator(`${selector} img`).evaluate(async (img: HTMLImageElement) => { await img.decode(); });
    const ratio = await page.locator(`${selector} img`).evaluate((img: HTMLImageElement) => img.naturalHeight / img.naturalWidth);
    await page.addStyleTag({ content: `body { background: #000 !important; } body * { visibility: hidden !important; } .hero { overflow: visible; } .portrait { display: none !important; } ${selector}, ${selector} * { visibility: visible !important; } ${selector} { display: block !important; position: fixed !important; left: 100px !important; top: 100px !important; right: auto !important; bottom: auto !important; width: 300px !important; height: ${300 * ratio}px !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; z-index: 999 !important; }` });
    await page.evaluate(() => scrollTo(0, 0));
    const shot = await page.screenshot({ clip: { x: 100, y: 94, width: 300, height: 5 } });
    const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let glowPixels = 0;
    for (let i = 0; i < info.width * info.height; i++) if (data[i * 3 + 1] > data[i * 3] + 3 && data[i * 3 + 2] > data[i * 3] + 3) glowPixels++;
    expect(glowPixels, `${selector}: light must extend above the portrait box rather than end on its edge`).toBeGreaterThan(10);
  }
});
