import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function writeTransparentArtwork(pipeline, destination, quality = 90) {
  // Convert the generated black light matte to straight RGBA. This preserves
  // cyan light and glass highlights without an opaque rectangular background.
  const { data, info } = await pipeline.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let pixel = 0; pixel < info.width * info.height; pixel++) {
    const source = pixel * 3, target = pixel * 4;
    const alpha = Math.max(data[source], data[source + 1], data[source + 2]);
    for (let channel = 0; channel < 3; channel++) rgba[target + channel] = alpha ? Math.round(data[source + channel] * 255 / alpha) : 0;
    rgba[target + 3] = alpha;
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).webp({ quality, alphaQuality: 100 }).toFile(destination);
}

export async function prepareGeneratedArt(name, bytes) {
  const out = path.join(process.cwd(), 'public/assets/generated');
  await mkdir(out, { recursive: true });
  // Lossless content extraction only: retain the generated figure and its black
  // compositing matte, remove unused outer space, then encode display sizes.
  const trimmed = await sharp(bytes).trim({ background: '#000000', threshold: 12 }).toBuffer({ resolveWithObject: true });
  await writeTransparentArtwork(sharp(trimmed.data).extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#000000' }).resize({ width: name.startsWith('process') ? 1400 : 800, withoutEnlargement: true }), path.join(out, `${name}.webp`));
  if (name.startsWith('process')) {
    for (let i = 0; i < 4; i++) {
      const left = Math.round(i * trimmed.info.width / 4);
      const right = Math.round((i + 1) * trimmed.info.width / 4);
      await writeTransparentArtwork(sharp(trimmed.data).extract({ left, top: 0, width: right - left, height: trimmed.info.height }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: '#000000' }).resize({ width: 480 }), path.join(out, `process-${i + 1}-science-v2.webp`), 91);
    }
  }
  return { width: trimmed.info.width, height: trimmed.info.height };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const name of ['bots','crm','websites','automation','process','contact']) {
    const file = `${name}-science-v2`;
    const result = await prepareGeneratedArt(file, await readFile(path.join(process.cwd(), 'design/generated', `${file}.png`)));
    console.log(`${file}: prepared ${result.width}x${result.height} content`);
  }
}
