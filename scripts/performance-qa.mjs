import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 200000, uploadThroughput: 100000 });
await page.addInitScript(() => {
  window.__perf = { cls: 0, lcp: 0, longTasks: [], frameTimes: [] };
  new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__perf.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__perf.longTasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: 'longtask', buffered: true });
});
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
const load = await page.evaluate(() => ({
  cls: window.__perf.cls, lcpMs: Math.round(window.__perf.lcp),
  longTasks: window.__perf.longTasks,
  resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, bytes: r.transferSize, type: r.initiatorType })),
}));
await page.locator('#contact').scrollIntoViewIfNeeded();
await page.locator('#full_name').fill('Проверка производительности');
const settledAt = await page.evaluate(() => performance.now());
await page.waitForTimeout(3500);
const animationTasks = await page.evaluate(since => window.__perf.longTasks.filter(task => task.start > since), settledAt);
const report = { environment: 'Local production build, Chromium headless, 390x844 touch, CPU 4x slower, 100ms latency, 200 KB/s download. Lab observations, not field Core Web Vitals.', ...load, settledAnimationLongTasks: animationTasks };
await writeFile('qa/performance.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ lcpMs: report.lcpMs, cls: report.cls, startupLongTasks: report.longTasks.length, settledAnimationLongTasks: animationTasks.length, transferredKB: Math.round(report.resources.reduce((total, resource) => total + resource.bytes, 0) / 1024) }));
await browser.close();
