# context.md — B2B Industrial Supplies Website (Astro)

> This file is the project brief and source of truth: goal, design, structure, JSON data schemas, catalog data and acceptance checklist.
> See `README.md` for day-to-day editing instructions.

---

## 0. ROLE & GOAL

A **production-quality, modern, premium-looking B2B industrial supplies website** built with **Astro**.

The site must feel trustworthy, clean and professional, and it must make visitors want to keep exploring. Every page must be easy to navigate, with clear visual hierarchy, fast loading and mobile-first responsiveness.

**Hard requirement:** all editable content lives in **JSON files** (company info, contact, team/founder, products, projects, partners, site settings, navigation). The owner must be able to edit, add or remove anything by changing JSON only, with **no component code changes**.

**Second hard requirement:** the code is **modular**. Adding a new product category, team member, project, partner or page section should be a matter of adding a JSON entry or one small component.

---

## 1. TECH STACK

- **Framework:** Astro (latest stable), static output (`output: 'static'`)
- **Styling:** Tailwind CSS v4 (Vite plugin) with design tokens in CSS variables
- **Language:** TypeScript (strict) for components, types and data loaders
- **Interactivity:** minimal, vanilla JS / Astro islands only where needed (search, filters, lightbox, mobile menu, inquiry list)
- **Icons:** `astro-icon` with the Lucide set (`@iconify-json/lucide`) plus one local icon (`src/icons/whatsapp.svg`)
- **Images:** graceful placeholder system — a missing/empty image path renders a styled placeholder; generated SVG placeholders via `scripts/generate-placeholders.mjs`
- **Fonts:** self-hosted via Fontsource. Headings: **Sora**. Body: **Inter**
- **SEO:** `@astrojs/sitemap`, meta tags, Open Graph, JSON-LD (Organization, WebSite, Product, BreadcrumbList)
- **Data validation:** Zod schemas reading all JSON, with readable build-time errors

---

## 2. BRAND & PLACEHOLDER COMPANY

Placeholder values live in `src/data/company.json` / `contact.json` / `site.json` and can be swapped:

- **Company name:** Ferrox Industrial Supply Co.
- **Tagline:** "Materials. Components. Reliability."
- **Logo:** placeholder SVG monogram "F" in a hexagon/bolt-head shape (`/public/images/logo-icon.svg`) plus light and dark wordmark versions. Logo paths are configurable in JSON
- **Contact (fake, editable):** phone/WhatsApp +92 300 0000000, sales@ferroxindustrial.example, Plot 24, Industrial Estate, Islamabad, Pakistan, Mon–Sat 9:00 AM – 6:00 PM, map embed/link placeholders

---

## 3. DESIGN DIRECTION

**Mood:** precise, engineered, dependable, modern industrial. Premium industrial catalog meets modern SaaS polish.

### Color palette (CSS variables + Tailwind theme tokens in `src/styles/global.css`)

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#0B2545` (deep steel navy) | headers, footer, primary buttons |
| `--color-primary-600` | `#13315C` | hover states |
| `--color-accent` | `#F59E0B` (safety amber) | CTAs, highlights, active states |
| `--color-accent-600` | `#D97706` | accent hover |
| `--color-steel` | `#8DA9C4` | secondary accents, borders on dark |
| `--color-surface` | `#F5F7FA` | alternating section backgrounds |
| `--color-card` | `#FFFFFF` | cards |
| `--color-ink` | `#0F172A` | main text |
| `--color-muted` | `#64748B` | secondary text |
| `--color-line` | `#E2E8F0` | borders/dividers |

Dark mode: class-based toggle (`html.dark`) with dark tokens (navy surfaces, slate cards, amber accent unchanged); persists to localStorage, defaults to OS preference.

### Visual style

- Generous whitespace, 12-column grid, max content width ~1280px
- Rounded corners (`rounded-xl` / `rounded-2xl`), soft layered shadows, subtle 1px borders
- Subtle industrial motifs: faint hex/grid pattern in hero and section backgrounds, thin amber accent under eyebrow labels
- Micro-interactions: card lift on hover, icon nudges, underline transitions, fade/slide-up scroll reveal (IntersectionObserver, respects `prefers-reduced-motion`)
- Category cards with large icon, item count badge, arrow on hover
- Consistent section headings (eyebrow + title + short description)

### UX principles

- Visitor understands in 5 seconds: who you are, what you supply, how to get a quote
- Sticky header with mega-menu for product categories (desktop) and slide-in drawer (mobile)
- Persistent CTAs: **Request a Quote** (header, floating WhatsApp + inquiry buttons, product pages)
- Breadcrumbs on every inner page
- Large touch targets, readable sizes, WCAG AA contrast
- Fast: static output, tiny JS, lazy images

---

## 4. PAGES & SECTIONS

- **Home (`/`)** — hero with search + CTAs, animated trust stats, 16-category grid, featured products, why choose us, industries served, projects preview, partner marquee, founder teaser, testimonials, CTA banner — all ordered/toggled from `home.json` through a section registry
- **Products (`/products`)** — category overview with live search filter
- **Category (`/products/[category]`)** — sticky subcategory chips + in-category search, product grids per subcategory, category quote CTA
- **Subcategory (`/products/[category]/[subcategory]`)** — item grid with Add to Inquiry, sibling navigation, search
- **Product detail (`/products/[category]/[subcategory]/[item]`)** — gallery (placeholder if no image), specs table, variants, applications, related items; CTAs: Add to Inquiry, Request a Quote, WhatsApp this item, datasheet download (when set), print-friendly
- **Inquiry / Quote (`/quote`)** — localStorage inquiry list with per-item quantity, form submitting via WhatsApp / email / form endpoint (configured in `site.json`), supports `?add=slug` and `?category=slug` prefill
- **About (`/about`)** — story, mission/vision, values, prominent founder profile (photo, quote, bio, experience timeline, education, expertise, socials), team grid, milestones, certifications
- **Projects (`/projects`)** — filterable grid (industry + year), partner/client logo wall grouped by type
- **Project detail (`/projects/[slug]`)** — meta chips, cover, challenge/solution/results, products supplied, gallery with lightbox, testimonial, related projects
- **Contact (`/contact`)** — contact cards, departments, socials, form (same config as quote), map embed/placeholder
- **Extras** — custom 404 with search + category links, `robots.txt`, sitemap, favicon, web manifest

---

## 5. DATA ARCHITECTURE

```
src/data/
├── site.json          # site-wide settings, SEO, theme, inquiry config, feature flags, credit
├── company.json       # name, logo, tagline, about/story, mission, vision, stats, values, milestones, certs
├── contact.json       # phones, emails, address, hours, socials, departments
├── navigation.json    # header links (+ products mega menu), CTA, footer columns, legal links
├── team.json          # founder + unlimited team members
├── products.json      # categories → subcategories → items (generated by scripts/generate-products-json.ts)
├── projects.json      # portfolio projects
├── partners.json      # clients / suppliers / brands / partners
├── industries.json    # industries served
├── testimonials.json  # optional
└── home.json          # home section order/toggles + hero texts
```

**Rules:**

- Components never hardcode text, links, numbers or image paths — everything reads from JSON through typed loaders in `src/lib/data.ts`
- Every image field is a root-relative path string under `/public`; missing or empty path ⇒ graceful placeholder
- `home.json` controls which sections appear and in what order
- Every list supports unlimited entries; no component assumes a fixed count
- All JSON validated with Zod (`src/lib/schemas.ts`); readable errors at build time

---

## 6. PROJECT STRUCTURE (MODULAR)

```
/
├── astro.config.mjs        # reads site.json; sitemap + astro-icon + tailwind vite plugin
├── scripts/
│   ├── generate-products-json.ts   # raw catalog → src/data/products.json (auto-slugs)
│   └── generate-placeholders.mjs   # brand SVGs, avatars, covers, partner logos, badges
├── public/                 # favicon, robots.txt, manifest, images/
└── src/
    ├── data/               # all JSON
    ├── lib/                # schemas.ts, data.ts, seo.ts, inquiry.ts, slugify.ts, images.ts
    ├── layouts/            # BaseLayout.astro, PageLayout.astro
    ├── components/
    │   ├── layout/         # Header (mega menu + drawer), Footer, FloatingActions, SearchModal
    │   ├── ui/             # Container, SectionHeading, Breadcrumbs, SmartImage, AddToInquiry
    │   ├── home/           # Hero, StatsBar, CategoryGrid, FeaturedProducts, WhyChooseUs,
    │   │                   # Industries, ProjectsPreview, PartnersMarquee, FounderTeaser,
    │   │                   # Testimonials, CtaBanner
    │   ├── products/       # CategoryCard, ProductCard
    │   └── projects/       # ProjectCard
    ├── pages/              # index, about, contact, quote, 404, products/*, projects/*, search-index.json.ts
    └── styles/global.css   # tokens, base styles, component classes
```

**Modularity rules:** one responsibility per component, typed `Props`; home sections rendered from `home.json` through a registry (`id` → component); shared UI primitives reused everywhere; all dynamic routes generated from JSON with `getStaticPaths`.

---

## 7. FEATURES

- Global search (Ctrl/Cmd + K palette, Fuse.js over `/search-index.json`) across categories, subcategories, products and projects
- Mega menu built from `products.json`; mobile drawer with accordion
- Inquiry list with localStorage, floating badge, WhatsApp/email/endpoint submit
- Floating WhatsApp button (toggle in `site.json`)
- Light/dark mode toggle
- Animated stat counters, scroll reveal, partner logo marquee
- Project filters and lightbox gallery
- Founder profile with experience timeline; unlimited team members
- Breadcrumbs, JSON-LD, OG tags, sitemap, robots
- Placeholder handling for missing images and optional fields
- Responsive 360px–1920px; accessible (semantic HTML, focus states, ARIA, skip link, reduced motion); print-friendly product pages

---

## 8. FOOTER CREDIT (REQUIRED)

Bottom bar of every page:

```
© {year} {company name}. All rights reserved.        Made by Elyptra
```

"Made by Elyptra" links to https://www.elyptra.com (`target="_blank" rel="noopener"`), text/URL from `site.json → credit`, amber hover.

---

## 9. PRODUCT CATALOG

Full 16-category catalog (Section 9 of the original brief) lives in `scripts/generate-products-json.ts` and generates `src/data/products.json`: **16 categories · 61 subcategories · 333 items**, 8 items enriched as featured with specs/variants/applications. Duplicate item names across subcategories are safe (slugs unique within a subcategory, URLs include category + subcategory).

---

## 10–13. CONTENT, README, ACCEPTANCE, BUILD ORDER

- Real-sounding professional copy throughout (no lorem ipsum)
- `README.md` documents install, every JSON editing recipe, image paths, theme colors, deployment
- Acceptance: `npm run build` and `npm run check` pass with no errors; JSON-only editing changes the site; all catalog pages browsable; founder section complete; Elyptra credit everywhere; responsive + dark mode; premium visual quality
