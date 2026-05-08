import sharp from 'sharp';

await sharp('figma-page.png')
  .extract({ left: 90, top: 220, width: 100, height: 80 })
  .resize(800, 640, { kernel: 'lanczos3' })
  .toFile('figma-icon-area.png');
console.log('done');
