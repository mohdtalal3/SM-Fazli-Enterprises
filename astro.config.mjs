import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

// Site-wide settings (URL, etc.) live in src/data/site.json — edit there.
const site = JSON.parse(
  readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf-8')
);

export default defineConfig({
  site: site.siteUrl,
  output: 'static',
  integrations: [sitemap(), icon({ iconDir: 'src/icons' })],
  vite: {
    plugins: [tailwindcss()],
  },
});
