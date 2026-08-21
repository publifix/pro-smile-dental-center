// One-off asset pipeline: converts the raw uploaded photos at the repo root
// into semantically-named, sized WebP/AVIF/JPEG assets under public/images/.
// Run with: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'images');

const jobs = [
  {
    src: 'LOGO.jpg',
    name: 'logo',
    widths: [96, 160, 320],
    formats: ['webp', 'png'],
  },
  {
    src: 'hero-pro-smile.jpg',
    name: 'hero-consultorio-pro-smile',
    widths: [640, 1024, 1600, 2400],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    // Nota: las 4 fotos con nombre "..._n.jpg" (descargas de Instagram) llevan
    // texto de marketing incrustado en la imagen ("¿Encías inflamadas?", "WTF con
    // creer que el hilo dental es opcional", etc.) ajeno al copy de esta sección,
    // por lo que no se usan como fotografía genérica de fondo. La única foto de
    // consultorio sin texto superpuesto es esta (crédito Unsplash/soybreno),
    // usada en "Sobre nosotros".
    src: 'soybreno-z8BIWPwV3zo-unsplash.jpg',
    name: 'atencion-dental-pro-smile',
    widths: [480, 768, 1080, 1350],
    formats: ['avif', 'webp', 'jpg'],
  },
];

async function run() {
  await mkdir(OUT, { recursive: true });

  for (const job of jobs) {
    const srcPath = path.join(ROOT, job.src);
    for (const width of job.widths) {
      for (const format of job.formats) {
        const outPath = path.join(OUT, `${job.name}-${width}.${format}`);
        let pipeline = sharp(srcPath).resize({ width, withoutEnlargement: true });

        if (format === 'webp') pipeline = pipeline.webp({ quality: 78 });
        else if (format === 'avif') pipeline = pipeline.avif({ quality: 55 });
        else if (format === 'jpg') pipeline = pipeline.jpeg({ quality: 78, mozjpeg: true });
        else if (format === 'png') pipeline = pipeline.png({ quality: 90 });

        await pipeline.toFile(outPath);
        console.log('wrote', path.relative(ROOT, outPath));
      }
    }
  }

  // Square logo crop for favicons (source is already 1080x1080)
  const faviconTargets = {
    16: 'favicon-16x16.png',
    32: 'favicon-32x32.png',
    180: 'apple-touch-icon.png',
    192: 'android-chrome-192x192.png',
    512: 'android-chrome-512x512.png',
  };
  for (const [size, fileName] of Object.entries(faviconTargets)) {
    const outPath = path.join(ROOT, 'public', fileName);
    await sharp(path.join(ROOT, 'LOGO.jpg'))
      .resize(Number(size), Number(size))
      .png()
      .toFile(outPath);
    console.log('wrote', path.relative(ROOT, outPath));
  }

  // Pack the 32x32 PNG into a minimal valid favicon.ico container (PNG-in-ICO)
  const png32 = await sharp(path.join(ROOT, 'LOGO.jpg')).resize(32, 32).png().toBuffer();
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(1, 4);
  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0);
  icoEntry.writeUInt8(32, 1);
  icoEntry.writeUInt16LE(1, 4);
  icoEntry.writeUInt16LE(32, 6);
  icoEntry.writeUInt32LE(png32.length, 8);
  icoEntry.writeUInt32LE(6 + 16, 12);
  const icoPath = path.join(ROOT, 'public', 'favicon.ico');
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(icoPath, Buffer.concat([icoHeader, icoEntry, png32]))
  );
  console.log('wrote', path.relative(ROOT, icoPath));

  // Open Graph image: 1200x630 canvas with logo centered on brand teal
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 79, g: 166, b: 156, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(path.join(ROOT, 'LOGO.jpg')).resize(420, 420).png().toBuffer(),
        gravity: 'center',
      },
    ])
    .jpeg({ quality: 85 })
    .toFile(path.join(OUT, 'og-cover.jpg'));
  console.log('wrote', path.relative(ROOT, path.join(OUT, 'og-cover.jpg')));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
