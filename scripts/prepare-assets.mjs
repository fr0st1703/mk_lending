import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const out = path.join(root, 'public/assets');
await mkdir(out, { recursive: true });
// Decorative objects are native transparent SVG in glass-artwork.tsx.
// Only photographic portraits and the static network fallback need assets.
for (const [name, file] of [
  ['portrait-hero', 'Профессиональный портрет мужчины на прозрачном фоне-2.png'],
  ['portrait-approach', 'Изображение ChatGPT 17 окт. 2026 г., 14_31_42-1.png'],
]) {
  for (const width of [480, 960]) await sharp(path.join(root, 'Photos', file)).trim({ threshold: 8 }).resize({ width }).webp({ quality: 88, alphaQuality: 95 }).toFile(path.join(out, `${name}-${width}.webp`));
}
// Lightweight static scene for first paint, unavailable canvas and no JavaScript.
const points = Array.from({ length: 70 }, (_, i) => ({ x: (((Math.sin(i * 127.1 + 8) * 43758.5453) % 1 + 1) % 1) * 1600, y: (((Math.sin(i * 311.7 + 1) * 17852.341) % 1 + 1) % 1) * 1000 }));
const lines = [];
points.forEach((point, i) => points.map((other, j) => ({ j, distance: Math.hypot(point.x - other.x, point.y - other.y) })).filter(other => other.j > i && other.distance < 400).sort((a,b) => a.distance - b.distance).slice(0,3).forEach(({j}) => lines.push(`<path d="M${point.x.toFixed(1)} ${point.y.toFixed(1)}L${points[j].x.toFixed(1)} ${points[j].y.toFixed(1)}"/>`)));
const dots = points.map(point => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="1.8"/>`).join('');
await writeFile(path.join(out, 'network-points-static.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><g fill="none" stroke="#45A29E" stroke-width=".8" opacity=".28">${lines.join('')}</g><g fill="#66fcf1" opacity=".6">${dots}</g></svg>`);
console.log('Prepared responsive portraits and the static network fallback.');
