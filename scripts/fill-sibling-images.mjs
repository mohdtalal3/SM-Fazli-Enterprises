/**
 * Fills catalog items that have no product image with a verified sibling image
 * from the same subcategory (falling back to the same category), so the catalog
 * shows a real, topically-correct photo everywhere instead of the icon
 * placeholder. Only reuses image files that exist on disk.
 *
 * Run with:  node scripts/fill-sibling-images.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const productsPath = join(ROOT, 'src/data/products.json');
const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

const onDisk = (path) => Boolean(path && existsSync(join(ROOT, 'public', path.replace(/^\//, ''))));

let filled = 0;
let stillEmpty = 0;

for (const category of products.categories) {
  for (const subcategory of category.subcategories) {
    const subPool = subcategory.items
      .map((i) => i.images?.[0])
      .filter((p) => onDisk(p));
    const catPool = category.subcategories
      .flatMap((s) => s.items.map((i) => i.images?.[0]))
      .filter((p) => onDisk(p));
    const pool = subPool.length ? subPool : catPool;

    for (const item of subcategory.items) {
      if (item.images?.length && onDisk(item.images[0])) continue;
      if (pool.length) {
        // rotate through the pool so neighbours don't all share one photo
        const pick = pool[filled % pool.length];
        item.images = [pick];
        filled++;
      } else {
        item.images = [];
        stillEmpty++;
      }
    }
  }
}

writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf-8');
console.log(`✓ filled ${filled} items from sibling/category photos · ${stillEmpty} left for the placeholder visual`);
