#!/usr/bin/env node
/**
 * sync-assets.mjs
 *
 * Importa icone e screenshot dai progetti locali (percorsi in data/products.json →
 * campo "assetSources") e li ottimizza in WebP dentro public/assets/<id>/.
 *
 * Va eseguito in locale (i progetti sorgente stanno sulla macchina di Luca, non in CI).
 * Gli asset risultanti vengono committati nel repo e usati dal build su Netlify.
 *
 *   node scripts/sync-assets.mjs
 */
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PRODUCTS = join(ROOT, 'data', 'products.json');
const SOCIALS = join(ROOT, 'data', 'socials.json');
const OUT_BASE = join(ROOT, 'public', 'assets');

const ICON_SIZE = 256; // l'icona è renderizzata a 72px → 256 copre i display retina
const SHOT_WIDTH = 600; // screenshot mostrati piccoli/responsive

let ok = 0;
let missing = 0;

async function emitIcon(src, destDir) {
  const dest = join(destDir, 'icon.webp');
  await sharp(src)
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'cover' })
    .webp({ quality: 90 })
    .toFile(dest);
  ok++;
  console.log(`  ✓ icon.webp`);
}

async function emitShot(src, destDir, i) {
  const dest = join(destDir, `shot-${i + 1}.webp`);
  await sharp(src)
    .resize({ width: SHOT_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  ok++;
  console.log(`  ✓ shot-${i + 1}.webp`);
}

const AVATAR_SIZE = 256;

async function emitAvatar(source) {
  const destDir = join(OUT_BASE, 'profile');
  await mkdir(destDir, { recursive: true });
  const dest = join(destDir, 'avatar.webp');

  let input;
  if (/^https?:\/\//.test(source)) {
    console.log(`\n• Avatar (download)\n  ${source}`);
    const res = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      missing++;
      console.warn(`  ⚠ download fallito: HTTP ${res.status}`);
      return;
    }
    input = Buffer.from(await res.arrayBuffer());
  } else {
    console.log(`\n• Avatar (locale)`);
    if (!existsSync(source)) {
      missing++;
      console.warn(`  ⚠ avatar mancante: ${source}`);
      return;
    }
    input = source;
  }
  await sharp(input)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
    .webp({ quality: 90 })
    .toFile(dest);
  ok++;
  console.log(`  ✓ profile/avatar.webp`);
}

async function run() {
  const data = JSON.parse(await readFile(PRODUCTS, 'utf8'));

  // Avatar profilo (da URL remoto o percorso locale, definito in socials.json)
  try {
    const socials = JSON.parse(await readFile(SOCIALS, 'utf8'));
    const src = socials.profile?.avatarSource;
    if (src) await emitAvatar(src);
  } catch (e) {
    console.warn('  ⚠ impossibile leggere socials.json per avatar:', e.message);
  }

  for (const p of data.products) {
    const sources = p.assetSources;
    if (!sources) continue;

    console.log(`\n• ${p.name} (${p.id})`);
    const destDir = join(OUT_BASE, p.id);
    await rm(destDir, { recursive: true, force: true });
    await mkdir(destDir, { recursive: true });

    if (sources.icon) {
      if (existsSync(sources.icon)) {
        await emitIcon(sources.icon, destDir);
      } else {
        missing++;
        console.warn(`  ⚠ icona mancante: ${sources.icon}`);
      }
    }

    const shots = sources.screenshots || [];
    for (let i = 0; i < shots.length; i++) {
      if (existsSync(shots[i])) {
        await emitShot(shots[i], destDir, i);
      } else {
        missing++;
        console.warn(`  ⚠ screenshot mancante: ${shots[i]}`);
      }
    }
  }

  console.log(`\nFatto. ${ok} asset generati, ${missing} sorgenti mancanti.`);
  if (missing > 0) process.exitCode = 0; // non blocchiamo: i file mancanti sono solo saltati
}

run().catch((err) => {
  console.error('Errore durante il sync:', err);
  process.exit(1);
});
