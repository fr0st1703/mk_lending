import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projectNetworkPoint } from '../src/lib/network-motion';

async function validForm(page: Page) {
  await page.locator('#full_name').fill('Тестовый пользователь');
  await page.locator('#phone').fill('+49 (151) 234-56789');
  await page.locator('#message').fill('Нужен бот для сбора заявок и уведомлений.');
  await page.locator('[name=privacy_consent]').check();
}

test('responsive layout and all content at the specified widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const sizes = [[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[667,375],[768,1024],[800,1280],[820,1180],[834,1194],[844,390],[932,430],[1024,768],[1024,1366],[1180,820],[1194,834],[1280,720],[1366,768],[1440,900],[1536,864],[1920,1080],[2560,1440]];
  await page.goto('/');
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}x${height} overflow`).toBeTruthy();
    const clipped = await page.locator('h1,h2,h3,h4,.button,.field input,.field textarea').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.textContent));
    expect(clipped, `${width}x${height} clipped content`).toEqual([]);
  }
  await expect(page.locator('main section')).toHaveCount(6);
  await expect(page.locator('.service-card')).toHaveCount(4);
  await expect(page.locator('.task-pair')).toHaveCount(4);
  await expect(page.locator('.process-grid li')).toHaveCount(4);
});

test('mobile modal: focus, Escape, navigation and destination visibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Открыть меню' });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('dialog').getByRole('link', { name: 'Услуги', exact: true }).click();
  await expect(page.locator('#services')).toBeFocused();
  const headingTop = await page.locator('#services-title').evaluate(el => el.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThan(76);
});

test('FAQ keeps at most one answer open and supports keyboard', async ({ page }) => {
  await page.goto('/');
  const first = page.getByRole('button', { name: 'Сколько стоит разработка?' });
  const second = page.getByRole('button', { name: 'Какие сроки?' });
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await second.focus(); await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-expanded', 'false');
});

test('form validates fields, focuses the first error, keeps data on real 503', async ({ page }) => {
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.locator('#full_name')).toBeFocused();
  await expect(page.locator('[aria-invalid=true]')).toHaveCount(4);
  await validForm(page);
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.locator('form [role=alert]')).toContainText('Не удалось отправить');
  await expect(page.locator('#phone')).toHaveValue('+49 (151) 234-56789');
  await expect(page.locator('[name=privacy_consent]')).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Заявка отправлена' })).toHaveCount(0);
});

test('sending locks duplicate submits; success requires saved record confirmation', async ({ page }) => {
  let calls = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/leads', async route => {
    calls++;
    expect(route.request().postDataJSON().phone).toBe('+4915123456789');
    await pending;
    await route.fulfill({ json: { saved: true, id: 'test-record' } });
  });
  await page.goto('/#contact');
  await validForm(page);
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.getByRole('button', { name: 'Отправляем…' })).toBeDisabled();
  await page.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  expect(calls).toBe(1); release();
  await expect(page.getByRole('heading', { name: 'Заявка отправлена' })).toBeVisible();
  await expect(page.locator('.form-success')).toBeFocused();
});

test('network errors and unconfirmed HTTP 200 cannot show success', async ({ page }) => {
  await page.route('**/api/leads', route => route.fulfill({ json: { saved: false } }));
  await page.goto('/#contact'); await validForm(page);
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.locator('form [role=alert]')).toBeVisible();
  await page.unroute('**/api/leads');
  await page.route('**/api/leads', route => route.abort());
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.locator('form [role=alert]')).toBeVisible();
  await expect(page.locator('#message')).not.toBeEmpty();
});

test('background keeps moving with reduced motion and with normal preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  const canvas = page.locator('canvas'); await expect(canvas).toHaveAttribute('data-ready', 'true');
  const before = await canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL());
  await page.mouse.move(700, 500); await page.waitForTimeout(200);
  const reducedFrame = await canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL());
  expect(reducedFrame).not.toBe(before);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(300);
  expect(await canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL())).not.toBe(reducedFrame);
});

test('network points travel smoothly along all three axes with perspective', () => {
  const anchor = { x: 300, y: 650, z: 20, phase: .7 };
  const start = projectNetworkPoint(anchor, 0, 1440, 900);
  const later = projectNetworkPoint(anchor, 15, 1440, 900);
  expect(Math.abs(later.x - start.x)).toBeGreaterThan(2);
  expect(Math.abs(later.y - start.y)).toBeGreaterThan(2);
  expect(Math.abs(later.z - start.z)).toBeGreaterThan(2);
  expect(later.scale).not.toBe(start.scale);
  for (let time = 0; time < 100; time += .25) {
    const a = projectNetworkPoint(anchor, time, 1440, 900);
    const b = projectNetworkPoint(anchor, time + 1 / 30, 1440, 900);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(.3);
  }
  const far = projectNetworkPoint({ ...anchor, z: 500 }, 15, 1440, 900);
  expect(far.scale).toBeLessThan(later.scale);
  expect(far.opacity).toBeLessThan(later.opacity);
});

test('distant defocused web is animated independently of the near plane', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    const debug = window as unknown as { __depthFrame?: string };
    CanvasRenderingContext2D.prototype.drawImage = function(source: CanvasImageSource, ...args: number[]) {
      if (source instanceof HTMLCanvasElement && this.canvas.parentElement?.classList.contains('network-scene')) debug.__depthFrame = source.toDataURL();
      return Reflect.apply(original, this, [source, ...args]);
    };
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-ready', 'true');
  const before = await page.evaluate(() => (window as unknown as { __depthFrame?: string }).__depthFrame);
  expect(before).toBeTruthy();
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => (window as unknown as { __depthFrame?: string }).__depthFrame);
  expect(before !== after).toBe(true);
});

test('accessibility: WCAG AA on desktop and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  }
});

test('nearby particles repel the mouse, keep bounded displacement and return', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    type DebugWindow = Window & { __step: (now: number) => number[][]; __points: number[][] };
    const debug = window as unknown as DebugWindow;
    let id = 0;
    const pending = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
    window.cancelAnimationFrame = token => { pending.delete(token); };
    const arc = CanvasRenderingContext2D.prototype.arc;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    debug.__points = [];
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.parentElement?.classList.contains('network-scene')) debug.__points = [];
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.arc = function(...args) {
      if (this.canvas.parentElement?.classList.contains('network-scene')) debug.__points.push([args[0], args[1], args[2]]);
      return arc.apply(this, args);
    };
    debug.__step = now => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(callback => callback(now)); return debug.__points; };
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-ready', 'true');
  const advance = (from: number, count: number) => page.evaluate(({ from, count }) => {
    const debug = window as unknown as { __step: (now: number) => number[][] };
    let points: number[][] = [];
    for (let i = 0; i < count; i++) points = debug.__step(from + i * 40);
    return points;
  }, { from, count });
  const initial = await advance(100, 5);
  // Loose points and connections, with no dense ribbon/grid vertices.
  expect(initial.length).toBeLessThan(200);
  expect(initial.length).toBeGreaterThan(80);
  const selected = initial.findIndex(point => point[2] > 1.6 && point[2] < 2.2 && point[0] > 300 && point[0] < 800 && point[1] > 300 && point[1] < 850);
  expect(selected).toBeGreaterThan(-1);
  const [x, y] = initial[selected];
  await page.mouse.move(x - 30, y);
  const pushed = (await advance(300, 20))[selected];
  expect(pushed[0] - x).toBeGreaterThan(8);
  expect(Math.hypot(pushed[0] - x, pushed[1] - y)).toBeLessThan(24);
  await page.mouse.move(0, 0);
  const returned = (await advance(1100, 60))[selected];
  // Compare against the current free-moving trajectory, not the old screen
  // position: X/Y/Z movement continues while pointer displacement relaxes.
  await page.reload();
  await expect(page.locator('canvas')).toHaveAttribute('data-ready', 'true');
  await advance(100, 5);
  await advance(300, 20);
  const unperturbed = (await advance(1100, 60))[selected];
  expect(Math.hypot(returned[0] - unperturbed[0], returned[1] - unperturbed[1])).toBeLessThan(1);
});

test('server-rendered SEO, contacts and honest API boundary', async ({ request }) => {
  const response = await request.get('/'); const html = await response.text();
  expect(response.status()).toBe(200);
  expect(html).toContain('<html lang="ru"');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('mailto:m.kozlov76@yandex.ru');
  expect(html).toContain('tel:+79679804740');
  expect((html.match(/<h1\b/g) || []).length).toBe(1);
  expect((await request.post('/api/leads', { data: {} })).status()).toBe(503);
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/privacy')).status()).toBe(200);
});
