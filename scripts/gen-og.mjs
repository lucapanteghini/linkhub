#!/usr/bin/env node
/**
 * gen-og.mjs
 *
 * Genera l'immagine di anteprima social (Open Graph / Twitter) 1200×630
 * in public/assets/og.png, partendo dai dati di profilo/app.
 * Palette Case Analyst (verde fosforo + ambra su nero), coerente col sito.
 *
 *   node scripts/gen-og.mjs
 */
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const profile = JSON.parse(await readFile(join(ROOT, 'data', 'socials.json'), 'utf8')).profile;
const products = JSON.parse(await readFile(join(ROOT, 'data', 'products.json'), 'utf8')).products;

const W = 1200;
const H = 630;
const apps = products.filter((p) => p.status === 'published').map((p) => p.name);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="18%" cy="12%" r="60%">
      <stop offset="0%" stop-color="#33FF33" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#33FF33" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="92%" cy="100%" r="65%">
      <stop offset="0%" stop-color="#FFB000" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#FFB000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="name" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#B9C0D6"/>
    </linearGradient>
    <linearGradient id="kick" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#33FF33"/>
      <stop offset="100%" stop-color="#FFB000"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#07090A"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="28" fill="none"
        stroke="#33FF33" stroke-opacity="0.28" stroke-width="2"/>

  <text x="80" y="170" font-family="Helvetica, Arial, sans-serif" font-size="30"
        font-weight="700" letter-spacing="8" fill="url(#kick)">${esc(profile.kicker.toUpperCase())}</text>

  <text x="76" y="320" font-family="Helvetica, Arial, sans-serif" font-size="118"
        font-weight="800" letter-spacing="-3" fill="url(#name)">${esc(profile.name)}</text>

  <text x="80" y="396" font-family="Helvetica, Arial, sans-serif" font-size="40"
        font-weight="500" fill="#C7CEDC">From idea to App Store.</text>

  <text x="80" y="520" font-family="Helvetica, Arial, sans-serif" font-size="30"
        font-weight="600" fill="#8B93A7">${esc(apps.join('   ·   '))}</text>

  <text x="80" y="572" font-family="Helvetica, Arial, sans-serif" font-size="26"
        font-weight="700" letter-spacing="2" fill="#33FF33">games.nurale.it</text>
</svg>`;

const outDir = join(ROOT, 'public', 'assets');
await mkdir(outDir, { recursive: true });
const out = join(outDir, 'og.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`✓ OG image → ${out} (${W}×${H})`);
