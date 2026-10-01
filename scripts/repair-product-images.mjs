/**
 * One-off quality repair: replaces blacklisted Wikipedia lead-images with a
 * verified sibling image from the same subcategory (chosen by hand after a
 * visual audit of every downloaded image). Run: node scripts/repair-product-images.mjs
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const productsPath = join(ROOT, 'src/data/products.json');
const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

const K = (cat, sub, item) => `${cat}/${sub}/${item}`;

/** target item key → source item key whose (verified) image to reuse */
const REPAIRS = {
  // chemicals
  [K('chemicals', 'solvents', 'ethanol')]: K('chemicals', 'solvents', 'methanol'),
  [K('chemicals', 'solvents', 'mek')]: K('chemicals', 'solvents', 'mibk'),
  [K('chemicals', 'water-treatment-chemicals', 'antiscalants')]: K('chemicals', 'water-treatment-chemicals', 'ferric-chloride'),
  [K('chemicals', 'water-treatment-chemicals', 'biocides')]: K('chemicals', 'water-treatment-chemicals', 'ferric-chloride'),
  [K('chemicals', 'water-treatment-chemicals', 'coagulants')]: K('chemicals', 'water-treatment-chemicals', 'poly-aluminium-chloride'),
  [K('chemicals', 'cleaning-degreasing-chemicals', 'industrial-degreasers')]: K('chemicals', 'cleaning-degreasing-chemicals', 'rust-removers'),
  [K('chemicals', 'cleaning-degreasing-chemicals', 'chemical-cleaners')]: K('chemicals', 'cleaning-degreasing-chemicals', 'rust-removers'),
  [K('chemicals', 'cleaning-degreasing-chemicals', 'descaling-chemicals')]: K('chemicals', 'cleaning-degreasing-chemicals', 'rust-removers'),
  [K('chemicals', 'cleaning-degreasing-chemicals', 'metal-cleaners')]: K('chemicals', 'cleaning-degreasing-chemicals', 'rust-removers'),
  // paints
  [K('paints', 'industrial-paints', 'enamel-paint')]: K('paints', 'industrial-paints', 'alkyd-paint'),
  [K('paints', 'industrial-paints', 'machinery-paint')]: K('paints', 'industrial-paints', 'alkyd-paint'),
  [K('paints', 'primers', 'red-oxide-primer')]: K('paints', 'primers', 'zinc-chromate-primer'),
  [K('paints', 'primers', 'anti-corrosion-primer')]: K('paints', 'primers', 'zinc-chromate-primer'),
  // special paints & coatings
  [K('special-paints-coatings', 'protective-coatings', 'heat-resistant-coating')]: K('special-paints-coatings', 'protective-coatings', 'waterproof-coating'),
  [K('special-paints-coatings', 'special-purpose-coatings', 'fire-retardant-paint')]: K('special-paints-coatings', 'special-purpose-coatings', 'food-grade-coating'),
  [K('special-paints-coatings', 'special-purpose-coatings', 'anti-slip-coating')]: K('special-paints-coatings', 'special-purpose-coatings', 'food-grade-coating'),
  [K('special-paints-coatings', 'special-purpose-coatings', 'anti-static-coating')]: K('special-paints-coatings', 'special-purpose-coatings', 'food-grade-coating'),
  [K('special-paints-coatings', 'metal-coatings', 'aluminum-paint')]: K('special-paints-coatings', 'metal-coatings', 'zinc-coating'),
  // glassware
  [K('glassware', 'industrial-glass', 'borosilicate-glass')]: K('glassware', 'industrial-glass', 'heat-resistant-glass'),
  [K('glassware', 'industrial-glass', 'tempered-glass')]: K('glassware', 'industrial-glass', 'toughened-glass'),
  [K('glassware', 'industrial-glass-components', 'glass-discs')]: K('glassware', 'industrial-glass-components', 'glass-windows'),
  [K('glassware', 'sight-glass-products', 'sight-glass-covers')]: K('glassware', 'industrial-glass', 'sight-glass'),
  [K('glassware', 'sight-glass-products', 'sight-glass-gaskets')]: K('glassware', 'industrial-glass', 'sight-glass'),
  [K('glassware', 'sight-glass-products', 'sight-glass-protectors')]: K('glassware', 'industrial-glass', 'sight-glass'),
  // fasteners
  [K('fasteners', 'bolts', 'u-bolts')]: K('fasteners', 'bolts', 'eye-bolts'),
  [K('fasteners', 'nuts', 'hex-nuts')]: K('fasteners', 'nuts', 'flange-nuts'),
  [K('fasteners', 'nuts', 'lock-nuts')]: K('fasteners', 'nuts', 'nylon-lock-nuts'),
  [K('fasteners', 'nuts', 'dome-nuts')]: K('fasteners', 'nuts', 'flange-nuts'),
  [K('fasteners', 'washers', 'spring-washers')]: K('fasteners', 'washers', 'lock-washers'),
  [K('fasteners', 'washers', 'sealing-washers')]: K('fasteners', 'washers', 'lock-washers'),
  [K('fasteners', 'other-fasteners', 'studs')]: K('fasteners', 'other-fasteners', 'threaded-rods'),
  [K('fasteners', 'other-fasteners', 'circlips')]: K('fasteners', 'other-fasteners', 'rivets'),
  // putties
  [K('putties', 'metal-putties', 'metal-repair-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'metal-putties', 'steel-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'metal-putties', 'aluminum-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'metal-putties', 'stainless-steel-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'industrial-repair-putties', 'epoxy-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'industrial-repair-putties', 'machinery-repair-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'industrial-repair-putties', 'chemical-resistant-putty')]: K('putties', 'industrial-repair-putties', 'pipe-repair-putty'),
  [K('putties', 'surface-putties', 'wood-putty')]: K('putties', 'surface-putties', 'wall-putty'),
  [K('putties', 'surface-putties', 'automotive-putty')]: K('putties', 'surface-putties', 'wall-putty'),
  [K('putties', 'surface-putties', 'fiberglass-putty')]: K('putties', 'surface-putties', 'wall-putty'),
  // lab instruments
  [K('lab-instruments', 'laboratory-glassware', 'beakers')]: K('lab-instruments', 'laboratory-glassware', 'flasks'),
  [K('lab-instruments', 'laboratory-glassware', 'watch-glasses')]: K('lab-instruments', 'laboratory-glassware', 'petri-dishes'),
  [K('lab-instruments', 'laboratory-equipment', 'laboratory-ovens')]: K('lab-instruments', 'laboratory-equipment', 'hot-plates'),
  [K('lab-instruments', 'laboratory-equipment', 'water-baths')]: K('lab-instruments', 'laboratory-equipment', 'centrifuges'),
  [K('lab-instruments', 'measuring-instruments', 'level-indicators')]: K('lab-instruments', 'measuring-instruments', 'pressure-gauges'),
  [K('lab-instruments', 'industrial-instruments', 'digital-controllers')]: K('lab-instruments', 'industrial-instruments', 'process-indicators'),
  // stainless steel
  [K('stainless-steel', 'sheet-finishes', 'ba-finish')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'sheet-finishes', 'no-4-finish')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'sheet-finishes', 'hairline-finish')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'stainless-steel-sheets', 'ss-304-sheets')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'stainless-steel-sheets', 'ss-316-sheets')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'stainless-steel-sheets', 'ss-321-sheets')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'stainless-steel-sheets', 'ss-430-sheets')]: K('stainless-steel', 'sheet-finishes', 'mirror-finish'),
  [K('stainless-steel', 'stainless-steel-forms', 'stainless-steel-strips')]: K('stainless-steel', 'stainless-steel-forms', 'stainless-steel-tubes'),
  [K('stainless-steel', 'stainless-steel-rods', 'hex-bars')]: K('stainless-steel', 'stainless-steel-rods', 'round-bars'),
  [K('stainless-steel', 'stainless-steel-rods', 'flat-bars')]: K('stainless-steel', 'stainless-steel-rods', 'round-bars'),
  // ptfe
  [K('ptfe', 'ptfe-products', 'ptfe-rods')]: K('ptfe', 'special-ptfe', 'virgin-ptfe'),
  [K('ptfe', 'ptfe-products', 'ptfe-bars')]: K('ptfe', 'special-ptfe', 'virgin-ptfe'),
  [K('ptfe', 'special-ptfe', 'carbon-filled-ptfe')]: K('ptfe', 'special-ptfe', 'virgin-ptfe'),
  // composites
  [K('composites', 'fiberglass-materials', 'fiberglass-rods')]: K('composites', 'composite-sheets-panels', 'frp-sheets'),
  [K('composites', 'fiberglass-materials', 'fiberglass-mat')]: K('composites', 'composite-sheets-panels', 'frp-sheets'),
  [K('composites', 'composite-components', 'composite-profiles')]: K('composites', 'composite-sheets-panels', 'composite-panels'),
  [K('composites', 'composite-components', 'composite-structural-parts')]: K('composites', 'composite-sheets-panels', 'composite-panels'),
  // steel balls
  [K('steel-balls', 'bearing-balls', 'stainless-steel-balls')]: K('steel-balls', 'sizes', 'small-diameter-balls'),
  [K('steel-balls', 'bearing-balls', 'carbon-steel-balls')]: K('steel-balls', 'sizes', 'small-diameter-balls'),
  [K('steel-balls', 'industrial-balls', 'hardened-steel-balls')]: K('steel-balls', 'sizes', 'small-diameter-balls'),
  [K('steel-balls', 'industrial-balls', 'mild-steel-balls')]: K('steel-balls', 'sizes', 'small-diameter-balls'),
  [K('steel-balls', 'applications', 'grinding-media')]: K('steel-balls', 'applications', 'valve-balls'),
  [K('steel-balls', 'applications', 'industrial-grinding-balls')]: K('steel-balls', 'applications', 'valve-balls'),
  [K('steel-balls', 'industrial-balls', 'grinding-balls')]: K('steel-balls', 'applications', 'valve-balls'),
  [K('steel-balls', 'sizes', 'medium-diameter-balls')]: K('steel-balls', 'sizes', 'small-diameter-balls'),
  // adhesives
  [K('adhesives', 'industrial-adhesives', 'plastic-adhesive')]: K('adhesives', 'industrial-adhesives', 'rubber-adhesive'),
  // tools
  [K('hardware-tools', 'hand-tools', 'pliers')]: K('hardware-tools', 'hand-tools', 'hammers'),
  [K('hardware-tools', 'workshop-tools', 'vices')]: K('hardware-tools', 'workshop-tools', 'clamps'),
  [K('hardware-tools', 'workshop-tools', 'tool-kits')]: K('hardware-tools', 'workshop-tools', 'measuring-tools'),
  [K('hardware-tools', 'workshop-tools', 'pullers')]: K('hardware-tools', 'workshop-tools', 'torque-wrenches'),
  // electronics
  [K('electronic-components', 'industrial-electronics', 'plc-components')]: K('electronic-components', 'industrial-electronics', 'industrial-controllers'),
  // rubber
  [K('rubber-items', 'rubber-sheets', 'epdm-sheets')]: K('rubber-items', 'rubber-sheets', 'natural-rubber-sheets'),
  [K('rubber-items', 'rubber-components', 'rubber-pads')]: K('rubber-items', 'rubber-components', 'rubber-profiles'),
  [K('rubber-items', 'industrial-rubber', 'food-grade-rubber')]: K('rubber-items', 'rubber-sheets', 'natural-rubber-sheets'),
  // oils
  [K('industrial-oils', 'lubricating-oils', 'circulating-oil')]: K('industrial-oils', 'lubricating-oils', 'hydraulic-oil'),
  [K('industrial-oils', 'lubricating-oils', 'machine-oil')]: K('industrial-oils', 'lubricating-oils', 'hydraulic-oil'),
  [K('industrial-oils', 'maintenance-oils', 'rust-preventive-oil')]: K('industrial-oils', 'maintenance-oils', 'penetrating-oil'),
  [K('industrial-oils', 'maintenance-oils', 'mould-release-oil')]: K('industrial-oils', 'lubricating-oils', 'gear-oil'),
};

/** Blacklisted files that must no longer be referenced anywhere. */
const BLACKLIST = new Set(Object.values(REPAIRS).length ? [] : []);
for (const target of Object.keys(REPAIRS)) BLACKLIST.add(target);

/* Build an index of item keys → item object */
const index = new Map();
for (const cat of products.categories) {
  for (const sub of cat.subcategories) {
    for (const item of sub.items) index.set(K(cat.slug, sub.slug, item.slug), item);
  }
}

let repaired = 0;
const removedFiles = new Set();

for (const [targetKey, sourceKey] of Object.entries(REPAIRS)) {
  const target = index.get(targetKey);
  const source = index.get(sourceKey);
  if (!target || !source) {
    console.log('  ! missing key:', !target ? targetKey : sourceKey);
    continue;
  }
  if (source.images?.[0] && existsSync(join(ROOT, 'public', source.images[0].replace(/^\//, '')))) {
    const oldFile = target.images?.[0];
    // never delete the file we are pointing at (safe for re-runs)
    if (oldFile && oldFile !== source.images[0]) removedFiles.add(oldFile);
    target.images = [source.images[0]];
    repaired++;
  } else {
    console.log('  ! source has no image:', sourceKey);
  }
}

writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n');

// delete now-unreferenced blacklisted files
let deleted = 0;
for (const file of removedFiles) {
  const p = join(ROOT, 'public', file.replace(/^\//, ''));
  if (existsSync(p)) {
    unlinkSync(p);
    deleted++;
  }
}

console.log(`✓ Repaired ${repaired} items with verified sibling images · removed ${deleted} blacklisted files`);
