# Alliance Solutions — Website

A production-quality, premium B2B industrial supplies website built with **Astro + Tailwind CSS v4 + TypeScript**.

**Every piece of content — text, contact info, links, products, projects, team, images — lives in JSON files in `src/data/`.** The owner can edit, add or remove anything by changing JSON only, with no component code changes.

---

## 1. Quick start

```bash
npm install        # install dependencies
npm run dev        # start dev server → http://localhost:4321
npm run build      # build the static site into /dist
npm run preview    # serve the built site locally
npm run check      # type-check (astro check)
```

Helper scripts:

```bash
npm run generate:products      # rebuild src/data/products.json from scripts/generate-products-json.ts
npm run generate:placeholders  # regenerate the placeholder SVG images in /public/images
npm run images:fetch           # download real photos for catalog items from Wikipedia (see below)
npm run images:apply           # write fetched image paths into src/data/products.json
```

### Real product images

Catalog items use real photos fetched from Wikipedia/Wikimedia (freely licensed media). The pipeline:

1. `npm run images:fetch` — walks every item in `products.json` and downloads a lead image (exact article match → article-search fallback → subcategory fallback). Files land in `public/images/products/<category>/<item>.<ext>` and `scripts/product-images-manifest.json` records the source article per image.
2. `npm run images:apply` — writes the downloaded paths into each item's `images` array in `products.json`.
3. `npm run build` — product cards and detail pages now show the photos.

Items without a match keep the styled placeholder visual. If you add new items later, re-run the two commands to fetch images for them. Replace any photo by dropping your own file at the same path and updating the `images` array in JSON. **Licensing note:** Wikipedia/Wikimedia media is free-licensed (CC-BY / CC-BY-SA / public domain); the manifest records each source article — verify attribution requirements before commercial use.

---

## 2. Where the content lives (`src/data/`)

| File | Controls |
|---|---|
| `site.json` | Site name, URL, SEO defaults, theme toggle, inquiry form config (WhatsApp/email/endpoint), feature flags, footer credit |
| `company.json` | Name, tagline, logo paths, about/story, mission, vision, stats, values, "why choose us", milestones, certifications |
| `contact.json` | Phone, WhatsApp, email, address, hours, map embed/link, departments, social links |
| `navigation.json` | Header links, header CTA button, footer columns, legal links |
| `home.json` | Which home sections appear and in what order, hero texts, CTAs, quick searches |
| `team.json` | Founder + unlimited team members |
| `products.json` | The full catalog: categories → subcategories → items |
| `projects.json` | Portfolio projects (list + detail pages) |
| `partners.json` | Clients / suppliers / brands / partners (marquee + projects page) |
| `industries.json` | "Industries served" icon row |
| `testimonials.json` | Home testimonials (can be empty) |

All JSON is validated with **Zod** at build time — a typo gives you a readable error message instead of a broken page.

---

## 3. "How do I…" recipes

### Change the company name, logo and contact details

1. **Name/tagline:** edit `src/data/company.json` → `name`, `shortName`, `tagline`. It updates the header, footer, page titles and SEO tags everywhere.
2. **Logo:** replace the files at `public/images/logo-light.svg` (used on dark backgrounds), `public/images/logo-dark.svg` (light backgrounds) and `public/images/logo-icon.svg` (square mark, favicon). Different filename? Change the paths in `company.json → logo`.
3. **Contact info:** edit `src/data/contact.json` → `primary` (phone, whatsapp, email, address, hours, map links). The footer, contact page, and every "call us" link update automatically.
4. **WhatsApp number used by forms/buttons:** edit `src/data/site.json` → `inquiry.whatsappNumber` (digits only, with country code).

### Add or edit the founder / add team members

Edit `src/data/team.json`. It is an array — the entry with `"isFounder": true` renders as the big founder profile (bio paragraphs, quote, experience timeline, education, expertise tags, socials). Every other entry renders as a team card.

To add a person, copy an existing entry, give it a new unique `id`, set `"isFounder": false` and an `order` number. Only `id` and `name` are strictly required — everything else is optional and the page degrades gracefully.

### Add a product category / subcategory / item

Edit `src/data/products.json`:

```json
{
  "slug": "welding",
  "name": "Welding Supplies",
  "icon": "flame",
  "description": "One-line description…",
  "order": 17,
  "subcategories": [
    {
      "slug": "electrodes",
      "name": "Electrodes",
      "items": [
        { "slug": "e6013-electrodes", "name": "E6013 Electrodes" }
      ]
    }
  ]
}
```

- Slugs must be unique within their level; URLs are built as `/products/{category}/{subcategory}/{item}`.
- **Only `slug` and `name` are required for items.** Optional fields: `shortDescription`, `description`, `images[]`, `specs` (object of label → value), `variants[]`, `applications[]`, `datasheet` (path), `featured: true`, `tags[]`.
- An item with just a name still renders a complete, good-looking detail page with a generated placeholder visual.
- Set `"featured": true` on items to show them in the home page "Featured Products" section.
- Icons are [Lucide](https://lucide.dev) icon names (`flask-conical`, `bolt`, `wrench`, …).
- Alternatively add items to the raw catalog in `scripts/generate-products-json.ts` and run `npm run generate:products`.

### Add a project with images and details

Add an entry to `src/data/projects.json` (see existing entries as templates). Required: `slug` and `title`. Recommended: `client`, `industry`, `year`, `cover`, `summary`, `challenge`, `solution`, `results[]`, `productsSupplied[]`, `gallery[]`, `featured: true`. The list page, detail page and home "Projects preview" update automatically.

### Add a partner or client logo

Add to `src/data/partners.json`:

```json
{ "name": "Acme Corp", "type": "client", "logo": "/images/partners/acme.svg", "featured": true }
```

`type` can be `client`, `supplier`, `brand` or `partner` — the projects page groups them automatically. `featured: true` puts it in the home page marquee.

### Reorder or hide home page sections

Edit `src/data/home.json` → `sections`. It is an ordered list; delete an entry (or set `"enabled": false`) to remove a section, move entries to reorder. Hero copy and quick searches are configured in the `hero` object in the same file.

### Switch the quote form to WhatsApp, email, or a form service

Edit `src/data/site.json` → `inquiry`:

```json
"inquiry": {
  "method": ["whatsapp", "email"],
  "whatsappNumber": "923000000000",
  "email": "sales@example.com",
  "formEndpoint": ""
}
```

- `method` lists which submit buttons appear: `"whatsapp"` opens WhatsApp with the full itemized list prefilled, `"email"` opens the visitor's mail client, `"endpoint"` POSTs JSON to `formEndpoint` (Formspree/Web3Forms/Netlify Forms — paste the URL).
- The same config drives the contact page form.
- Visitors' inquiry lists are stored in `localStorage`; the floating badge shows the live count.

---

## 4. Images

- Put images anywhere under `public/` and reference them **root-relative** in JSON, e.g. save `photo.jpg` at `public/images/team/` → use `"/images/team/photo.jpg"` in JSON.
- **A missing or empty image path never breaks the page** — the site renders a styled placeholder in its place.
- Generated placeholder SVGs (logo, avatars, project covers, partner logos, cert badges, social card) come from `npm run generate:placeholders`. Replace any of them by dropping a real image at the same path and updating the JSON if you change the extension.
- Open Graph works best with a PNG/JPG: replace `public/images/og-default.svg` and update `site.json → ogImage` when you have a real 1200×630 social card.

### Product images (all 333 catalog items)

Every product ships with a real photo stored locally at `public/images/products/<category>/<item>.jpg`, so images **auto-load with the website** — no external hotlinks, nothing breaks if a remote server changes. Sources: freely-licensed photos from Wikipedia/Wikimedia Commons, discovered and downloaded by the scripts in `scripts/`:

| Command | What it does |
|---|---|
| `npm run images:fetch` | Finds a lead photo for every catalog item on Wikipedia and downloads it into `public/images/products/` (idempotent — skips items it already has). Records sources in `scripts/product-images-manifest.json`. |
| `npm run images:apply` | Writes the downloaded paths into `products.json` (`images` field per item). |
| `npm run images:ensure` | Final pass: re-fetches items whose file is missing, clears unfillable ones. |
| `npm run images:fill` | Fills items without a photo with a verified sibling photo from the same subcategory. |
| `node scripts/repair-product-images.mjs` · `repair-product-images-2.mjs` | Curated quality repairs (replace diagrams/wrong subjects with verified photos). |

To replace any product photo, just drop your own image at the path referenced in `products.json` (e.g. `public/images/products/fasteners/hex-bolts.jpg`) — same filename, no JSON edit needed.

> **Licensing note:** the bundled product photos come from Wikipedia/Wikimedia Commons (public domain / CC-BY / CC-BY-SA). `scripts/product-images-manifest.json` records the source article for every image — verify and add attributions where the specific license requires it before commercial publication, or replace images with your own product photography using the same paths.

---

## 5. Theme colors & dark mode

All colors are CSS variables + Tailwind v4 theme tokens in `src/styles/global.css`:

| Token | Light | Role |
|---|---|---|
| `--color-primary` | `#0B2545` | headers, footer, primary buttons |
| `--color-primary-600` | `#13315C` | hover states |
| `--color-accent` | `#F59E0B` | CTAs, highlights, active states |
| `--color-accent-600` | `#D97706` | accent hover |
| `--color-steel` | `#8DA9C4` | secondary accents |
| `--color-surface` / `--color-card` | `#F5F7FA` / `#FFFFFF` | backgrounds |
| `--color-ink` / `--color-muted` / `--color-line` | `#0F172A` / `#64748B` / `#E2E8F0` | text & borders |

Change a value once in `@theme` (and its dark counterpart in the `.dark` block right below) and the whole site updates. Dark mode is a class-based toggle (`html.dark`), persisted to `localStorage`, honoring the OS preference by default.

---

## 6. Project structure

```
├── astro.config.mjs        # reads site.json for the site URL; sitemap + icons + tailwind
├── scripts/
│   ├── generate-products-json.ts    # catalog source → src/data/products.json
│   └── generate-placeholders.mjs    # brand SVGs, avatars, covers, logos, badges
├── public/                 # static assets + generated placeholder images
└── src/
    ├── data/               # ★ ALL editable content (JSON)
    ├── lib/                # schemas (Zod), data loaders, seo, inquiry store, slugify
    ├── layouts/            # BaseLayout (SEO/theme/chrome), PageLayout (breadcrumbs + header)
    ├── components/
    │   ├── layout/         # Header (mega menu + drawer), Footer, FloatingActions, SearchModal
    │   ├── ui/             # Button styles, Container, SectionHeading, Breadcrumbs, SmartImage, AddToInquiry
    │   ├── home/           # one component per home section (rendered via registry in pages/index.astro)
    │   ├── products/       # CategoryCard, ProductCard
    │   └── projects/       # ProjectCard
    ├── pages/              # routes (all product routes generated from products.json)
    └── styles/global.css   # design tokens + shared component classes
```

**Modularity:** adding a home section = build a component in `src/components/home/`, register it in the registry in `src/pages/index.astro`, add one entry to `home.json`. Adding products/projects/team/partners = add a JSON entry. Nothing else to touch.

---

## 7. Deployment

The site is 100% static (`dist/`). Any static host works:

- **Netlify** — build command `npm run build`, publish directory `dist`.
- **Vercel** — framework preset "Astro", defaults are fine.
- **Cloudflare Pages** — build command `npm run build`, output `dist`.
- **Any server / cPanel** — upload the contents of `dist/`.

Before deploying, set your real domain in `src/data/site.json` → `siteUrl` (used for the sitemap, canonical URLs and Open Graph tags).

---

## 8. Feature checklist

- Global search (Ctrl/Cmd + K) across categories, subcategories, products and projects
- Products mega menu + mobile drawer, built from `products.json`
- 3-level product browsing + item detail pages, all generated statically
- Inquiry list (localStorage) with floating badge, WhatsApp/email/endpoint submission
- Light/dark mode, animated stat counters, scroll reveal, partner marquee
- Project filters and gallery lightbox
- Founder profile with experience timeline; unlimited team members
- Breadcrumbs, JSON-LD (Organization, Product, BreadcrumbList), OG tags, sitemap, robots.txt, web manifest
- Accessible: semantic HTML, skip link, focus states, ARIA on menus/dialogs, reduced-motion support, print-friendly product pages

---

Made by Elyptra — [elyptra.com](https://www.elyptra.com)
