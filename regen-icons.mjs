import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = 'apps/mobile';
const RES = `${ROOT}/android/app/src/main/res`;
const ICON = `${ROOT}/assets/icon.png`;
const ADAPTIVE = `${ROOT}/assets/adaptive-icon.png`;
const SPLASH = `${ROOT}/assets/splash-icon.png`;

const launcherSizes = {
  mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192,
};
const foregroundSizes = {
  mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432,
};
const splashSizes = {
  mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152,
};

async function makeWebp(src, size, outPath) {
  await sharp(src).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 100 })
    .toFile(outPath);
  console.log('wrote', outPath);
}

async function makePng(src, size, outPath) {
  await sharp(src).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log('wrote', outPath);
}

for (const [dpi, size] of Object.entries(launcherSizes)) {
  const dir = `${RES}/mipmap-${dpi}`;
  await makeWebp(ICON, size, `${dir}/ic_launcher.webp`);
  await makeWebp(ICON, size, `${dir}/ic_launcher_round.webp`);
}

for (const [dpi, size] of Object.entries(foregroundSizes)) {
  const dir = `${RES}/mipmap-${dpi}`;
  await makeWebp(ADAPTIVE, size, `${dir}/ic_launcher_foreground.webp`);
}

for (const [dpi, size] of Object.entries(splashSizes)) {
  const dir = `${RES}/drawable-${dpi}`;
  await makePng(SPLASH, size, `${dir}/splashscreen_logo.png`);
}

console.log('done.');
