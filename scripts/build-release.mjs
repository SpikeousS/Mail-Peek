#!/usr/bin/env node
/**
 * Chrome Web Store–safe release build.
 *
 * Policy (https://developer.chrome.com/docs/webstore/program-policies/code-readability):
 * - Allowed: minify (strip whitespace/comments, shorten identifiers, bundle files)
 * - Forbidden: obfuscation that conceals functionality (string encryption,
 *   control-flow flattening, dead code injection, etc.)
 *
 * This script only minifies + bundles. Source remains in extension/ for development.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcExt = join(root, "extension");
const dist = join(root, "dist", "mail-peek");

function copyFile(rel) {
  const from = join(srcExt, rel);
  const to = join(dist, rel);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// Static assets
for (const rel of [
  "manifest.json",
  "popup.html",
  "popup.css",
  "viewer.html",
  "compose.html",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
]) {
  if (!existsSync(join(srcExt, rel))) {
    throw new Error(`Missing required file: extension/${rel}`);
  }
  copyFile(rel);
}

// Bundle MSG/RTF libraries (minified, still ordinary minify — no obfuscation plugins)
await build({
  entryPoints: [join(root, "src/msgreader-entry.js")],
  bundle: true,
  format: "iife",
  outfile: join(dist, "lib/msgreader.js"),
  minify: true,
  target: ["chrome111"],
  alias: {
    "iconv-lite": join(root, "src/iconv-stub.js"),
  },
  logLevel: "info",
});

// Minify extension scripts (identifier shortening + whitespace removal only)
const scripts = ["background.js", "content.js", "popup.js", "viewer.js", "compose.js"];
for (const file of scripts) {
  await build({
    entryPoints: [join(srcExt, file)],
    outfile: join(dist, file),
    bundle: false,
    minify: true,
    legalComments: "none",
    target: ["chrome111"],
    logLevel: "info",
  });
}

// Bump display version note in dist README fragment
const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
writeFileSync(
  join(dist, "BUILD_INFO.txt"),
  [
    `Mail Peek ${manifest.version}`,
    "Build type: Chrome Web Store–safe minification (esbuild)",
    "Not obfuscated: no string encoding / control-flow flattening",
    `Built at: ${new Date().toISOString()}`,
    "",
  ].join("\n")
);

    console.log(`\nRelease package ready: ${dist}`);
    console.log("Product name: Mail Peek");
    console.log("Zip that folder for Chrome Web Store upload.");
