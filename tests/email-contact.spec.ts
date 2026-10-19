import { expect, test } from '@playwright/test';

test('email icon provides a working browser alternative and copying without a mailto handler', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#contact');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => Object.assign(window, { copiedEmail: text }) } }));
    const icon = page.getByRole('link', { name: 'Написать на m.kozlov76@yandex.ru', exact: true });
    await icon.click();
    const dialog = page.getByRole('dialog', { name: 'Связаться по почте' });
    await expect(dialog).toBeVisible({ timeout: 1500 });
    if (width === 1440) await page.screenshot({ path: 'qa/screenshots/email-contact-options.png' });
    await expect(dialog.getByRole('link', { name: 'В почтовом приложении' })).toHaveAttribute('href', 'mailto:m.kozlov76@yandex.ru');
    const webmail = dialog.getByRole('link', { name: 'В Яндекс Почте' });
    const url = new URL((await webmail.getAttribute('href'))!);
    expect(url.origin + url.pathname).toBe('https://mail.yandex.ru/compose');
    expect(url.searchParams.get('mailto')).toBe('mailto:m.kozlov76@yandex.ru');
    await expect(webmail).toHaveAttribute('target', '_blank');
    await dialog.getByRole('button', { name: 'Скопировать адрес' }).click();
    await expect(dialog.getByRole('status')).toHaveText('Адрес скопирован');
    expect(await page.evaluate(() => (window as unknown as { copiedEmail: string }).copiedEmail)).toBe('m.kozlov76@yandex.ru');
    await dialog.getByRole('heading', { name: 'Связаться по почте' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').click();
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    await page.mouse.move(bounds!.x + 8, bounds!.y + 8);
    await page.mouse.down(); await page.mouse.move(5, 5); await page.mouse.up();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).not.toBeVisible();
    await expect(icon).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await icon.click();
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard blocked'); } } }));
    await dialog.getByRole('button', { name: 'Скопировать адрес' }).click();
    await expect(dialog.getByRole('status')).toHaveText('Скопируйте выделенный адрес');
    await expect(dialog.getByRole('textbox')).toBeFocused();

    await page.mouse.click(5, 5);
  }
});
