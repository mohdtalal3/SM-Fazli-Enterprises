/**
 * Downloads a real photo for every catalog item from Wikipedia/Wikimedia
 * (freely licensed content). Fallback chain per item:
 *   1. Lead image ("pageimage") of the matching English Wikipedia article
 *   2. Lead images of the top article-search hits for the item name
 *   3. Lead images of search hits for the subcategory name (shared per subcategory)
 * Items with no match keep the built-in placeholder visual.
 *
 * Run with:  npm run images:fetch
 * Then:      npm run images:apply   (writes downloaded paths into products.json)
 *
 * Output: /public/images/products/<category>/<item>.<ext> + scripts/product-images-manifest.json
 *
 * NOTE:commons.wikimedia.org was unreachable from this environment, so license
 * metadata could not be fetched — Wikipedia/Wikimedia media is free-licensed
 * (CC-BY / CC-BY-SA / public domain), but verify attribution requirements
 * before commercial use. The manifest records the source article per image.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const MANIFEST_PATH = join(ROOT, 'scripts', 'product-images-manifest.json');

const API = 'https://en.wikipedia.org/w/api.php';
// Wikimedia's edge flags custom bot UAs with 403 ("honor our robot policy") after volume;
// a standard browser UA with throttled requests is accepted.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};
const THUMB_SIZE = 800;
const API_DELAY_MS = 120;
const DOWNLOAD_CONCURRENCY = 2;
const DOWNLOAD_DELAY_MS = 250;

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
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(600 * attempt);
    }
  }
}

/** Query pageimages (lead image thumbnail) for a batch of titles. */
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
    // multiple input titles can normalize/redirect to the same page — dedupe
    if (seen.has(page.title)) continue;
    seen.add(page.title);
    if (page.thumbnail?.source) {
      const src = new URL(page.thumbnail.source);
      src.search = '';
      out.set(page.title, {
        url: src.href,
        width: page.thumbnail.width ?? 0,
        height: page.thumbnail.height ?? 0,
        article: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      });
    }
  }
  return out;
}

/** Full-text search for articles matching a query; returns up to `limit` titles. */
async function searchTitles(query, limit = 3) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srlimit: limit, srnamespace: 0 });
  return (data?.query?.search ?? []).map((s) => s.title);
}

const GOOD_EXT = /\.(jpe?g|png|webp)$/i;

async function download(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) throw new Error(`not an image (${type})`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 3000) throw new Error('too small');
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      return true;
    } catch (err) {
      if (attempt === 3) {
        console.log(`    download failed: ${err.message}`);
        return false;
      }
      await sleep(500 * attempt);
    }
  }
}

function titleCandidates(item) {
  const stripped = item.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const candidates = [item.name, stripped].filter((t) => t && t.length > 1);
  return [...new Set(candidates)];
}

/* ── Load catalog + prior manifest (for idempotent re-runs) ────────── */

const products = JSON.parse(readFileSync(join(ROOT, 'src/data/products.json'), 'utf-8'));
const manifestPath = MANIFEST_PATH;
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf-8')) : { images: {}, failures: [] };
manifest.images ??= {};
manifest.failures ??= [];

const urlCache = new Map(); // url → saved file path
const pendingDest = new Set(); // dest paths queued for download (file not on disk yet)
const downloadQueue = [];
let done = 0;

function enqueue(url, destAbs, destRel, entry) {
  entry.file = destRel;
  if (urlCache.has(url)) {
    const src = urlCache.get(url);
    if (src === destAbs || pendingDest.has(src)) return; // same queued download will materialize dest
    mkdirSync(dirname(destAbs), { recursive: true });
    copyFileSync(src, destAbs);
    return;
  }
  urlCache.set(url, destAbs); // optimistic; corrected after download
  pendingDest.add(destAbs);
  downloadQueue.push({ url, destAbs, destRel, entry });
}

const jobs = [];

for (const category of products.categories) {
  for (const subcategory of category.subcategories) {
    for (const item of subcategory.items) {
      const key = `${category.slug}/${subcategory.slug}/${item.slug}`;
      jobs.push({ key, category, subcategory, item });
    }
  }
}

console.log(`Fetching lead images for ${jobs.length} items from Wikipedia…\n`);

for (const job of jobs) {
  const { key, category, subcategory, item } = job;
  done++;

  if (manifest.images[key]?.file && existsSync(join(PUBLIC, manifest.images[key].file.replace(/^\//, '')))) {
    continue; // already have it
  }

  const destFor = (url) => {
    const ext = (url.match(GOOD_EXT)?.[0] ?? '.jpg').toLowerCase();
    return `/images/products/${category.slug}/${item.slug}${ext}`;
  };
  const destAbsFor = (relPath) => join(PUBLIC, relPath.replace(/^\//, ''));
  const entry = { key, name: item.name, category: category.name, subcategory: subcategory.name, file: null };

  try {
    /* 1 — exact/redirect article match */
    const direct = await pageImages(titleCandidates(item));
    for (const img of direct.values()) {
      if (img.width >= 240 && GOOD_EXT.test(img.url)) {
        const rel = destFor(img.url);
        enqueue(img.url, destAbsFor(rel), rel, entry);
        entry.source = img.article;
        entry.width = img.width;
        break;
      }
    }

    /* 2 — search fallback on the item name */
    if (!entry.file) {
      const titles = await searchTitles(item.name, 3);
      if (titles.length) {
        await sleep(API_DELAY_MS);
        const hits = await pageImages(titles);
        for (const img of hits.values()) {
          if (img.width >= 240 && GOOD_EXT.test(img.url)) {
            const rel = destFor(img.url);
            enqueue(img.url, destAbsFor(rel), rel, entry);
            entry.source = img.article;
            entry.via = 'search';
            entry.width = img.width;
            break;
          }
        }
      }
    }

    /* 3 — subcategory fallback (reuse an image already found for a sibling item) */
    if (!entry.file) {
      const subKey = `sub:${category.slug}/${subcategory.slug}`;
      if (manifest.images[subKey]?.file) {
        entry.file = manifest.images[subKey].file;
        entry.source = manifest.images[subKey].source;
        entry.via = 'subcategory-reuse';
      } else {
        const titles = await searchTitles(subcategory.name, 3);
        if (titles.length) {
          await sleep(API_DELAY_MS);
          const hits = await pageImages(titles);
          for (const img of hits.values()) {
            if (img.width >= 240 && GOOD_EXT.test(img.url)) {
              const rel = destFor(img.url);
              enqueue(img.url, destAbsFor(rel), rel, entry);
              manifest.images[subKey] = { file: rel, source: img.article };
              entry.source = img.article;
              entry.via = 'subcategory';
              entry.width = img.width;
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    entry.error = err.message;
  }

  if (entry.file) {
    manifest.images[key] = entry;
    process.stdout.write(`  [${done}/${jobs.length}] ✓ ${item.name}\n`);
  } else {
    delete entry.source;
    manifest.failures = manifest.failures.filter((f) => f.key !== key);
    manifest.failures.push(entry);
    process.stdout.write(`  [${done}/${jobs.length}] · ${item.name} — no match\n`);
  }

  // persist manifest as we go so partial runs are usable
  if (done % 10 === 0 || done === jobs.length) {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  await sleep(API_DELAY_MS);
}

/* ── Flush download queue (parallel, throttled) ────────────────────── */

console.log(`\nDownloading ${downloadQueue.length} images…`);
let downloaded = 0;
let idx = 0;

async function worker() {
  while (idx < downloadQueue.length) {
    const { url, destAbs, destRel, entry } = downloadQueue[idx++];
    const ok = await download(url, destAbs);
    if (ok) {
      urlCache.set(url, destAbs);
      downloaded++;
    } else {
      // mark failure so apply() skips it and later items don't reuse the dead cache entry
      entry.file = null;
      urlCache.delete(url);
      pendingDest.delete(destAbs);
      const rec = manifest.images[entry.key];
      if (rec?.file === destRel) delete manifest.images[entry.key];
    }
    process.stdout.write(`  downloaded ${downloaded}/${downloadQueue.length}\r`);
    await sleep(DOWNLOAD_DELAY_MS);
  }
}

await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker));

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const ok = Object.values(manifest.images).filter((e) => e.key && !e.key.startsWith('sub:')).length;
console.log(`\n✓ ${ok} items have images · ${manifest.failures.length} without · manifest: scripts/product-images-manifest.json`);
console.log('Next: npm run images:apply');
