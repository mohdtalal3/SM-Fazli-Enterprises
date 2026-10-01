/**
 * Final-pass image fixer. Works directly against src/data/products.json:
 *   1. Finds items whose referenced image file is missing on disk
 *   2. Re-fetches a lead image from Wikipedia (same chain as fetch-product-images)
 *   3. Repeats until the missing count stops improving
 *   4. Clears `images` for items that still can't be filled (placeholder visual)
 *
 * Run with:  node scripts/ensure-product-images.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const API = 'https://en.wikipedia.org/w/api.php';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};
const THUMB_SIZE = 800;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      if (attempt === 3) return null;
      await sleep(800 * attempt);
    }
  }
}

async function pageImages(titles) {
  const data = await api({
    action: 'query',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: THUMB_SIZE,
    redirects: 1,
    titles: titles.join('|'),
  });
  const out = new Map();
  const seen = new Set();
  for (const page of data?.query?.pages ?? []) {
    if (seen.has(page.title)) continue;
    seen.add(page.title);
    if (page.thumbnail?.source) {
      const src = new URL(page.thumbnail.source);
      src.search = '';
      if (/\.(jpe?g|png|webp)$/i.test(src.href)) out.set(page.title, { url: src.href, width: page.thumbnail.width ?? 0 });
    }
  }
  return out;
}

async function searchTitles(query, limit = 3) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srlimit: limit, srnamespace: 0 });
  return (data?.query?.search ?? []).map((s) => s.title);
}

async function download(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) throw new Error('not an image');
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 3000) throw new Error('too small');
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      return true;
    } catch {
      if (attempt === 3) return false;
      await sleep(900 * attempt);
    }
  }
}

const products = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf-8'));

const items = [];
for (const cat of products.categories) {
  for (const sub of cat.subcategories) {
    for (const item of sub.items) {
      items.push({ cat, sub, item, key: `${cat.slug}/${sub.slug}/${item.slug}` });
    }
  }
}

function missingItems() {
  return items.filter(({ item }) => {
    const img = item.images?.[0];
    return img && !existsSync(join(PUBLIC, img.replace(/^\//, '')));
  });
}

let round = 0;
let previous = Infinity;
let missing = missingItems();

while (missing.length > 0 && missing.length < previous && round < 4) {
  round++;
  previous = missing.length;
  console.log(`\n— round ${round}: ${missing.length} images to (re)fetch —`);

  for (const { item } of missing) {
    const rel = item.images[0];
    const dest = join(PUBLIC, rel.replace(/^\//, ''));

    let done = false;
    const candidates = [item.name, item.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim()].filter((t) => t.length > 1);
    const direct = await pageImages(candidates);
    for (const img of direct.values()) {
      if (img.width >= 240 && (await download(img.url, dest))) {
        done = true;
        break;
      }
    }
    if (!done) {
      const titles = await searchTitles(item.name, 3);
      if (titles.length) {
        await sleep(150);
        const hits = await pageImages(titles);
        for (const img of hits.values()) {
          if (img.width >= 240 && (await download(img.url, dest))) {
            done = true;
            break;
          }
        }
      }
    }

    if (!done) {
      // could not fill it — fall back to the styled placeholder
      item.images = [];
      console.log(`  · ${item.name} — unfilled, using placeholder`);
    } else {
      console.log(`  ✓ ${item.name}`);
    }
    await sleep(150);
  }

  missing = missingItems();
}

// clear any stragglers so no broken references remain
for (const { item } of missingItems()) item.images = [];

writeFileSync(join(ROOT, 'src/data/products.json'), JSON.stringify(products, null, 2) + '\n');

let ok = 0;
for (const { item } of items) if (item.images?.[0] && existsSync(join(PUBLIC, item.images[0].replace(/^\//, '')))) ok++;
console.log(`\n✓ done: ${ok}/${items.length} items have verified images`);
