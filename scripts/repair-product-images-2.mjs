/**
 * Curated repair pass: replaces non-photo images (molecular diagrams, planes,
 * buildings, drawings) discovered in the visual audit with verified photo
 * files from English-Wikipedia articles, plus verified sibling photos.
 *
 * Run with:  node scripts/repair-product-images-2.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const productsPath = join(ROOT, 'src/data/products.json');
const manifestPath = join(ROOT, 'scripts/product-images-manifest.json');
const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const products = JSON.parse(readFileSync(productsPath, 'utf-8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

/* ── 1. Download curated files ─────────────────────────────────────── */

const SOURCES = [
  ['naoh-beads', 'Sodium hydroxide', /NaOH beads/i],
  ['bearing-cover', 'Ball bearing', /Ball Bearing with Semi Transparent Cover/i],
  ['wingquist-bearing', 'Ball bearing', /Wingquist bearing00/i],
  ['ss-plate', 'Stainless steel', /316L Stainless Steel Unpolished/i],
  ['ss-cable', 'Stainless steel', /cable tyrolienne inox/i],
  ['ss-rebar', 'Stainless steel', /Арматурный прокат/i],
  ['sulfuric-bottle', 'Sulfuric acid', /Acidic drain opener/i],
  ['sulfuric-jar', 'Sulfuric acid', /Reine Schwefelsauere/i],
  ['baking-soda', 'Sodium bicarbonate', /Hydrogenuhličitan/i],
  ['claw-hammer', 'Hammer', /Claw-hammer/i],
  ['torque-wrench', 'Torque wrench', /Click-torque-wrench/i],
  ['hacksaw', 'Hacksaw', /^Hacksaw\.jpg/i],
  ['tool-hacksaw', 'Hacksaw', /Tool-hacksaw/i],
  ['hexkey-set', 'Hex key', /1st choice metric hex key set/i],
  ['hexkey-ball', 'Hex key', /Allen wrench with ball end/i],
  ['ethanol-flasche', 'Ethanol', /Ethanol Flasche/i],
  ['ethanol-usp', 'Ethanol', /Ethyl alcohol usp grade/i],
];

const curatedDir = '/images/products/_curated';
const curatedFile = (name, url) => {
  const ext = (url.match(/\.(jpe?g|png|webp)/i)?.[0] ?? '.jpg').toLowerCase();
  return `${curatedDir}/${name}${ext}`;
};

async function api(params) {
  const url = new URL(API);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      console.log(`    … rate limited, waiting ${attempt * 15}s`);
      await new Promise((r) => setTimeout(r, attempt * 15000));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

async function download(url, destAbs) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      console.log(`    … rate limited, waiting ${attempt * 15}s`);
      await new Promise((r) => setTimeout(r, attempt * 15000));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`not an image (${type})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) throw new Error('too small');
    mkdirSync(dirname(destAbs), { recursive: true });
    writeFileSync(destAbs, buf);
    return;
  }
  throw new Error('rate limited');
}

console.log('Downloading curated photos…');
for (const [name, article, regex] of SOURCES) {
  const destRel = curatedFile(name, '.jpg');
  const destAbs = join(ROOT, 'public', destRel.replace(/^\//, ''));
  if (existsSync(destAbs)) {
    console.log(`  ✓ ${name} (cached)`);
    continue;
  }
  try {
    const data = await api({ action: 'query', titles: article, prop: 'images', imlimit: 50, redirects: 1 });
    const page = data?.query?.pages?.[0];
    const file = (page?.images ?? []).map((i) => i.title).find((t) => regex.test(t.replace('File:', '')));
    if (!file) throw new Error('no matching file');
    const info = await api({ action: 'query', titles: file, prop: 'imageinfo', iiprop: 'url', iiurlwidth: 800, redirects: 1 });
    const ii = info?.query?.pages?.[0]?.imageinfo?.[0];
    const url = (ii?.thumburl ?? ii?.url).split('?')[0];
    await download(url, destAbs);
    console.log(`  ✓ ${name} ← ${file}`);
  } catch (err) {
    console.log(`  ✗ ${name} — ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 1200));
}

/* ── 2. Assignment map ─────────────────────────────────────────────── */
/* key `cat/sub/item` → curated name or `from:` reference item key       */

const K = (cat, sub, item) => `${cat}/${sub}/${item}`;
const ASSIGN = {};

// chemicals → proper bottle/flakes photos
ASSIGN[K('chemicals', 'industrial-chemicals', 'sodium-hydroxide')] = { curated: 'naoh-beads' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'sulfuric-acid')] = { curated: 'sulfuric-bottle' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'phosphoric-acid')] = { curated: 'sulfuric-jar' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'citric-acid')] = { from: K('chemicals', 'industrial-chemicals', 'acetic-acid') };
ASSIGN[K('chemicals', 'industrial-chemicals', 'sodium-carbonate')] = { curated: 'baking-soda' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'sodium-bicarbonate')] = { curated: 'baking-soda' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'calcium-chloride')] = { curated: 'naoh-beads' };
ASSIGN[K('chemicals', 'industrial-chemicals', 'ammonium-chloride')] = { from: K('chemicals', 'industrial-chemicals', 'hydrochloric-acid') };
ASSIGN[K('chemicals', 'industrial-chemicals', 'potassium-hydroxide')] = { curated: 'naoh-beads' };
// solvents → bottle photos
ASSIGN[K('chemicals', 'solvents', 'acetone')] = { curated: 'ethanol-usp' };
ASSIGN[K('chemicals', 'solvents', 'isopropyl-alcohol')] = { curated: 'ethanol-flasche' };
ASSIGN[K('chemicals', 'solvents', 'methanol')] = { curated: 'ethanol-flasche' };
ASSIGN[K('chemicals', 'solvents', 'ethanol')] = { curated: 'ethanol-usp' };
ASSIGN[K('chemicals', 'solvents', 'xylene')] = { from: K('chemicals', 'solvents', 'toluene') };
ASSIGN[K('chemicals', 'solvents', 'mek')] = { curated: 'ethanol-usp' };
ASSIGN[K('chemicals', 'solvents', 'mibk')] = { curated: 'ethanol-flasche' };
// stainless steel → steel photos
const SS_GROUPS = {
  'stainless-steel-sheets': ['ss-304-sheets', 'ss-316-sheets', 'ss-321-sheets', 'ss-310-sheets', 'ss-430-sheets'],
  'sheet-finishes': ['2b-finish', 'ba-finish', 'no-4-finish', 'mirror-finish', 'hairline-finish'],
  'stainless-steel-rods': ['round-bars', 'square-bars', 'hex-bars', 'flat-bars'],
  'stainless-steel-forms': ['stainless-steel-plates', 'stainless-steel-strips', 'stainless-steel-tubes', 'stainless-steel-pipes'],
};
for (const [sub, items] of Object.entries(SS_GROUPS)) {
  for (const item of items) {
    ASSIGN[K('stainless-steel', sub, item)] = { rotate: [curatedFile('ss-plate', '.jpg'), curatedFile('ss-cable', '.jpg'), curatedFile('ss-rebar', '.jpg')] };
  }
}
// steel balls → bearing photos
for (const [sub, items] of Object.entries({
  'bearing-balls': ['chrome-steel-balls', 'stainless-steel-balls', 'carbon-steel-balls'],
  'industrial-balls': ['grinding-balls', 'precision-steel-balls', 'hardened-steel-balls', 'mild-steel-balls'],
  'applications': ['bearing-balls', 'valve-balls', 'grinding-media', 'industrial-grinding-balls'],
  'sizes': ['small-diameter-balls', 'medium-diameter-balls', 'large-diameter-balls', 'custom-size-balls'],
})) {
  for (const item of items) {
    ASSIGN[K('steel-balls', sub, item)] = { rotate: [curatedFile('bearing-cover', '.jpg'), curatedFile('wingquist-bearing', '.jpg')] };
  }
}
// ptfe → teflon pan photo (from ptfe-rods) everywhere
for (const item of ['ptfe-rods', 'ptfe-bars', 'ptfe-sheets', 'ptfe-plates', 'ptfe-tubes', 'ptfe-bushes', 'ptfe-rings', 'ptfe-gaskets', 'ptfe-seals', 'ptfe-washers', 'ptfe-o-rings', 'ptfe-insulators', 'virgin-ptfe', 'filled-ptfe', 'glass-filled-ptfe', 'carbon-filled-ptfe', 'graphite-filled-ptfe']) {
  const sub = ['ptfe-gaskets', 'ptfe-seals', 'ptfe-washers', 'ptfe-o-rings', 'ptfe-insulators'].includes(item)
    ? 'ptfe-components'
    : ['virgin-ptfe', 'filled-ptfe', 'glass-filled-ptfe', 'carbon-filled-ptfe', 'graphite-filled-ptfe'].includes(item)
      ? 'special-ptfe'
      : 'ptfe-products';
  ASSIGN[K('ptfe', sub, item)] = { from: K('ptfe', 'ptfe-products', 'ptfe-rods') };
}
// fiberglass → FRP boat photos
for (const item of ['fiberglass-sheets', 'fiberglass-rods', 'fiberglass-tubes', 'fiberglass-fabric', 'fiberglass-mat']) {
  ASSIGN[K('composites', 'fiberglass-materials', item)] = { from: K('composites', 'composite-sheets-panels', 'frp-sheets') };
}
for (const item of ['composite-bushes', 'composite-bearings', 'composite-profiles', 'composite-structural-parts']) {
  ASSIGN[K('composites', 'composite-components', item)] = { from: K('composites', 'composite-sheets-panels', 'frp-sheets') };
}
// lab instruments
ASSIGN[K('lab-instruments', 'industrial-instruments', 'flow-sensors')] = { from: K('lab-instruments', 'industrial-instruments', 'pressure-transmitters') };
// hand tools
ASSIGN[K('hardware-tools', 'hand-tools', 'pliers')] = { from: K('hardware-tools', 'hand-tools', 'spanners') };
ASSIGN[K('hardware-tools', 'hand-tools', 'hammers')] = { curated: 'claw-hammer' };
ASSIGN[K('hardware-tools', 'hand-tools', 'allen-keys')] = { curated: 'hexkey-set' };
ASSIGN[K('hardware-tools', 'cutting-tools', 'hacksaws')] = { curated: 'hacksaw' };
ASSIGN[K('hardware-tools', 'cutting-tools', 'cutting-blades')] = { curated: 'tool-hacksaw' };
ASSIGN[K('hardware-tools', 'workshop-tools', 'torque-wrenches')] = { curated: 'torque-wrench' };
ASSIGN[K('hardware-tools', 'workshop-tools', 'measuring-tools')] = { curated: 'torque-wrench' };
ASSIGN[K('hardware-tools', 'workshop-tools', 'pullers')] = { from: K('hardware-tools', 'hand-tools', 'pipe-wrenches') };
// oils
ASSIGN[K('industrial-oils', 'specialty-oils', 'spindle-oil')] = { from: K('industrial-oils', 'specialty-oils', 'slideway-oil') };
ASSIGN[K('industrial-oils', 'industrial-lubricants', 'lithium-grease')] = { from: K('industrial-oils', 'industrial-lubricants', 'bearing-grease') };
ASSIGN[K('industrial-oils', 'maintenance-oils', 'rust-preventive-oil')] = { from: K('industrial-oils', 'specialty-oils', 'cutting-oil') };
ASSIGN[K('industrial-oils', 'maintenance-oils', 'penetrating-oil')] = { from: K('industrial-oils', 'specialty-oils', 'cutting-oil') };
ASSIGN[K('industrial-oils', 'maintenance-oils', 'chain-oil')] = { from: K('industrial-oils', 'specialty-oils', 'cutting-oil') };
ASSIGN[K('industrial-oils', 'maintenance-oils', 'mould-release-oil')] = { from: K('industrial-oils', 'specialty-oils', 'cutting-oil') };
// rubber
for (const item of ['heat-resistant-rubber', 'oil-resistant-rubber', 'chemical-resistant-rubber']) {
  ASSIGN[K('rubber-items', 'industrial-rubber', item)] = { from: K('rubber-items', 'rubber-sheets', 'nitrile-sheets') };
}
ASSIGN[K('rubber-items', 'industrial-rubber', 'food-grade-rubber')] = { from: K('rubber-items', 'rubber-sheets', 'natural-rubber-sheets') };
// glassware
ASSIGN[K('glassware', 'industrial-glass', 'tempered-glass')] = { from: K('glassware', 'industrial-glass', 'sight-glass') };
ASSIGN[K('glassware', 'industrial-glass', 'toughened-glass')] = { from: K('glassware', 'industrial-glass', 'sight-glass') };
// electronics
ASSIGN[K('electronic-components', 'industrial-electronics', 'plc-components')] = { from: K('electronic-components', 'industrial-electronics', 'industrial-controllers') };

/* ── 3. Apply ──────────────────────────────────────────────────────── */

const itemByKey = new Map();
for (const category of products.categories) {
  for (const subcategory of category.subcategories) {
    for (const item of subcategory.items) {
      itemByKey.set(`${category.slug}/${subcategory.slug}/${item.slug}`, item);
    }
  }
}

let repaired = 0;
const rotationCounters = new Map();

for (const [key, spec] of Object.entries(ASSIGN)) {
  const item = itemByKey.get(key);
  if (!item) {
    console.log(`  ! unknown key ${key}`);
    continue;
  }
  let path = null;
  if (spec.curated) {
    const candidates = SOURCES.filter(([name]) => name === spec.curated);
    void candidates;
    path = `${curatedDir}/${spec.curated}.jpg`;
    if (!existsSync(join(ROOT, 'public', path.replace(/^\//, '')))) {
      const alt = `${curatedDir}/${spec.curated}.png`;
      path = existsSync(join(ROOT, 'public', alt.replace(/^\//, ''))) ? alt : null;
    }
  } else if (spec.from) {
    const src = itemByKey.get(spec.from);
    path = src?.images?.[0] ?? null;
  } else if (spec.rotate) {
    const usable = spec.rotate.filter((p) => existsSync(join(ROOT, 'public', p.replace(/^\//, ''))));
    const i = rotationCounters.get(key.split('/').slice(0, 2).join('/')) ?? 0;
    rotationCounters.set(key.split('/').slice(0, 2).join('/'), i + 1);
    path = usable[i % usable.length] ?? null;
  }
  if (!path) {
    console.log(`  ! no image for ${key}`);
    continue;
  }
  if (item.images?.[0] === path) continue;
  item.images = [path];
  const entry = manifest.images[key];
  if (entry) {
    entry.file = path;
    entry.via = 'curated-repair';
  }
  repaired++;
}

writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf-8');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\n✓ repaired ${repaired} item images`);
