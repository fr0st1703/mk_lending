import sharp from 'sharp';
const { data, info } = await sharp('Photos/logo.png').trim({ threshold: 8 }).toBuffer({ resolveWithObject: true });
await sharp(data).resize({ width: 240 }).webp({ lossless: true }).toFile('public/assets/logo.webp');
console.log(JSON.stringify({width: info.width, height: info.height}));
