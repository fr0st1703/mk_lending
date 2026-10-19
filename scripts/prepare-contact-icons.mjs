import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/assets/icons', { recursive: true });
for (const [name, source] of [['instagram', 'free-icon-instagram-1409946'], ['telegram', 'free-icon-telegram-2111646'], ['email', 'free-icon-email-8379823']]) {
  await sharp(`Photos/icons/${source}.png`).resize({width:96,height:96,fit:'inside'}).webp({quality:90,alphaQuality:100}).toFile(`public/assets/icons/${name}.webp`);
}
