/**
 * Applies downloaded product images (see scripts/product-images-manifest.json)
 * to src/data/products.json by setting each item's `images` array.
 *
 * Run with:  npm run images:apply
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts/product-images-manifest.json'), 'utf-8'));
const productsPath = join(ROOT, 'src/data/products.json');
const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

let applied = 0;
let missing = 0;

for (const category of products.categories) {
  for (const subcategory of category.subcategories) {
    for (const item of subcategory.items) {
      const key = `${category.slug}/${subcategory.slug}/${item.slug}`;
      const entry = manifest.images[key];
      const path = entry?.file;
      if (path && existsSync(join(ROOT, 'public', path.replace(/^\//, '')))) {
        item.images = [path];
        applied++;
      } else {
        item.images = item.images ?? [];
        if (path) missing++;
      }
    }
  }
}

writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n');
console.log(`✓ Applied images to ${applied} items in products.json${missing ? ` · ${missing} manifest entries had missing files (skipped)` : ''}`);
