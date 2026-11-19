// Build Chrome extension icons (16/32/48/128) from a raster artwork.
//
//   node scripts/build-icons-from-image.mjs [source.png]
//
// The source (default: store-assets/icon-source.png) is a square image drawn
// on a black background; the bird's face is the same black (no outline), so
// the background cannot simply be keyed out. Instead every near-black pixel
// is recoloured to the tile colour (white by default — the artwork is meant
// to sit on white, giving the bird a white face), the artwork is cropped to
// its bounding box with even padding, and the result is placed on a
// rounded-corner tile with a transparent margin — the shape Chrome expects
// (128 px canvas, ~112 px visible tile).
//
//   TILE=0b1f44 node scripts/build-icons-from-image.mjs   # alternative tile colour
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.argv[2] || join(root, "store-assets/icon-source.png"));
const outDir = join(root, "extension/icons");
const tileHex = (process.env.TILE || "ffffff").replace(/^#/, "");
const TILE = {
  r: parseInt(tileHex.slice(0, 2), 16),
  g: parseInt(tileHex.slice(2, 4), 16),
  b: parseInt(tileHex.slice(4, 6), 16),
}; // replaces the black background (and the bird's face)
const BLACK_CUTOFF = 64; // pixels darker than this are considered "black"
const PADDING = Number(process.env.PAD ?? 0.04); // artwork padding inside the tile (fraction of tile)
const MARGIN_128 = Number(process.env.MARGIN ?? 0); // transparent margin on a 128 px canvas (Chrome suggests 8; 0 = fill)
const RADIUS = Number(process.env.RADIUS ?? 0.2); // corner radius as a fraction of the tile
const SIZES = [16, 32, 48, 128];

if (!existsSync(source)) {
  throw new Error(`Source image not found: ${source}`);
}
mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// Bounding box of the non-black artwork.
let minX = width, minY = height, maxX = -1, maxY = -1;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * channels;
    if (Math.max(data[i], data[i + 1], data[i + 2]) >= BLACK_CUTOFF) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
if (maxX < 0) throw new Error("No artwork found (image is all black)");

// Recolour near-black to the tile colour, blending across anti-aliased edges.
const recoloured = Buffer.alloc(width * height * 3);
for (let p = 0; p < width * height; p += 1) {
  const i = p * channels;
  const o = p * 3;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const lum = Math.max(r, g, b);
  const f = Math.min(1, lum / BLACK_CUTOFF); // 0 = pure black, 1 = artwork
  recoloured[o] = Math.round(TILE.r * (1 - f) + r * f);
  recoloured[o + 1] = Math.round(TILE.g * (1 - f) + g * f);
  recoloured[o + 2] = Math.round(TILE.b * (1 - f) + b * f);
}

// Square crop around the artwork with even padding.
const artW = maxX - minX + 1;
const artH = maxY - minY + 1;
const side = Math.round(Math.max(artW, artH) / (1 - 2 * PADDING));
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const left = Math.round(cx - side / 2);
const top = Math.round(cy - side / 2);

// The crop may extend past the image; extend with the tile colour first.
const padL = Math.max(0, -left);
const padT = Math.max(0, -top);
const padR = Math.max(0, left + side - width);
const padB = Math.max(0, top + side - height);
const tileSquare = await sharp(recoloured, { raw: { width, height, channels: 3 } })
  .extend({ top: padT, bottom: padB, left: padL, right: padR, background: TILE })
  .extract({ left: left + padL, top: top + padT, width: side, height: side })
  .png()
  .toBuffer();

function roundedMask(size, radius) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`;
  return Buffer.from(svg);
}

for (const size of SIZES) {
  const margin = Math.round((size * MARGIN_128) / 128);
  const tile = size - margin * 2;
  const radius = Math.round(tile * RADIUS);
  const art = await sharp(tileSquare).resize(tile, tile, { kernel: "lanczos3" }).toBuffer();
  const masked = await sharp(art)
    .composite([{ input: roundedMask(tile, radius), blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: masked, left: margin, top: margin }])
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `icon${size}.png`));
  console.log(`icon${size}.png  tile ${tile}px, margin ${margin}px`);
}
console.log(`Artwork bbox: x ${minX}-${maxX}, y ${minY}-${maxY} → crop ${side}px`);
