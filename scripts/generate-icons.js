/**
 * Generate PWA icons from newicon.svg on sage green background
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SVG_PATH = path.join(__dirname, '..', 'public', 'newicon.svg');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 },
];

async function generate() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Get SVG dimensions
  const svgMeta = await sharp(svgBuffer).metadata();
  console.log(`SVG size: ${svgMeta.width}x${svgMeta.height}`);

  for (const { name, size } of sizes) {
    // Icon padding (icon takes 65% of the space, rest is background)
    const iconSize = size;
    const radius = Math.round(size * 0.19); // rounded corners

    // Resize the SVG icon
    const resizedIcon = await sharp(svgBuffer)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Create rounded rectangle background in sage green
    const roundedBg = Buffer.from(
      `<svg width="${size}" height="${size}">
        <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#6B8E7B"/>
      </svg>`
    );

    // Composite: sage green background + icon centered on top
    await sharp(roundedBg)
      .composite([{
        input: resizedIcon,
        gravity: 'centre',
      }])
      .png()
      .toFile(path.join(PUBLIC_DIR, name));

    console.log(`Created ${name} (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
