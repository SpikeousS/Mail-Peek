#!/usr/bin/env node
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outExt = join(root, "extension/icons");
const outStore = join(root, "store-assets");
mkdirSync(outExt, { recursive: true });
mkdirSync(outStore, { recursive: true });

// Draw from vector primitives instead of scaling a detailed source image.
// The 16 px variant deliberately fills more of its canvas so it remains
// recognizable in Chrome's pinned-extension toolbar.
const svg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect x="34" y="34" width="956" height="956" rx="218" fill="#0349B6"/>
    <rect x="34" y="24" width="956" height="946" rx="218" fill="#0866E5"/>

    <rect x="170" y="245" width="684" height="525" rx="72" fill="#FFFFFF"/>
    <path d="M188 292L512 548 836 292V390L512 646 188 390Z" fill="#0866E5"/>
    <path d="M188 418L430 608 188 742Z" fill="#EAF3FF"/>
    <path d="M836 418L594 608 836 742Z" fill="#EAF3FF"/>

    <circle cx="778" cy="762" r="173" fill="#FFFFFF"/>
    <circle cx="778" cy="762" r="151" fill="#FFD400"/>
    <path d="M674 764L778 681 882 764 778 847Z" fill="#082B59"/>
    <circle cx="778" cy="764" r="43" fill="#FFFFFF"/>
    <circle cx="778" cy="764" r="20" fill="#082B59"/>
  </svg>
`);

async function saveIcon(size, path, artworkRatio) {
  const artwork = Math.max(1, Math.round(size * artworkRatio));
  const pad = Math.floor((size - artwork) / 2);
  const rendered = await sharp(svg).resize(artwork, artwork).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: rendered, left: pad, top: pad }])
    .png()
    .toFile(path);
}

await Promise.all([
  // Store icon keeps 16 px transparent safety padding (96 px artwork).
  saveIcon(128, join(outExt, "icon128.png"), 0.75),
  saveIcon(128, join(outStore, "icon-128.png"), 0.75),
  // Toolbar/action icons use almost the full canvas for maximum visibility.
  saveIcon(16, join(outExt, "icon16.png"), 0.96),
  saveIcon(32, join(outExt, "icon32.png"), 0.94),
  saveIcon(48, join(outExt, "icon48.png"), 0.9),
  saveIcon(16, join(outStore, "icon-16.png"), 0.96),
  saveIcon(48, join(outStore, "icon-48.png"), 0.9),
  sharp(svg).png().toFile(join(outStore, "icon-master-1024.png")),
]);

console.log("Mail Peek icons written");
