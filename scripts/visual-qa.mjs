import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'qa/screenshots'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = []; page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const id of ['home', 'tasks', 'services', 'process', 'questions', 'contact']) {
  await page.locator('#' + id).scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await page.locator('#' + id).screenshot({ path: `${out}/desktop-${id}.png` });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${out}/mobile-hero.png` });
await page.screenshot({ path: `${out}/mobile-full.png`, fullPage: true });
await page.getByRole('button', { name: 'Открыть меню' }).click();
await page.screenshot({ path: `${out}/mobile-menu.png` });
await writeFile('qa/browser-errors.json', JSON.stringify(errors, null, 2));
console.log(JSON.stringify({ screenshots: out, errors }));
await page.getByRole('button', { name: 'Закрыть меню' }).click();
for (const [width, height] of [[320,568],[834,1194],[1280,720],[1906,927]]) {
  await page.setViewportSize({width,height});
  for (const id of ['home','questions']) {
    await page.goto('http://127.0.0.1:3000/#' + id, {waitUntil:'networkidle'});
    await page.locator('#' + id).screenshot({path: out + '/portrait-' + id + '-' + width + '.png'});
  }
}
await browser.close();
