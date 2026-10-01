/**
 * Generates the placeholder SVG image set used across the site:
 *   - Brand: favicon, logo (light/dark/icon), og-default
 *   - Team avatars, project covers + gallery images, partner logos, cert badges
 *
 * Run with:  npm run generate:placeholders
 *
 * Replace any generated file by dropping a real image at the path referenced
 * in the matching JSON file (e.g. /images/team/founder.jpg) — the site picks
 * it up automatically.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const NAVY = '#0B2545';
const NAVY_600 = '#13315C';
const AMBER = '#F59E0B';
const STEEL = '#8DA9C4';
const STEEL_300 = '#B7C9DC';
const INK = '#0F172A';
const LINE = '#E2E8F0';
const SURFACE = '#F8FAFC';

/* ── Helpers ───────────────────────────────────────────────────────── */

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function hexPattern(stroke, opacity, id) {
  return `<defs><pattern id="${id}" width="56" height="64" patternUnits="userSpaceOnUse"><path d="M28 1 53 15.5v29L28 59 3 44.5v-29z" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/></pattern></defs>`;
}

const GRADIENTS = [
  ['#13315C', '#0B2545'],
  ['#8DA9C4', '#4A6E94'],
  ['#B45309', '#7C2D12'],
  ['#134E4A', '#0B2545'],
  ['#3B5B7E', '#16283F'],
  ['#6B4E16', '#0B2545'],
];

function gradient(id, seed) {
  const [from, to] = GRADIENTS[seed % GRADIENTS.length];
  return `<defs><linearGradient id="${id}${seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`;
}

function initials(name) {
  return name
    .replace(/\([^)]*\)/g, '')
    .split(/\s+/)
    .filter((w) => /^[a-z0-9]/i.test(w))
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Escape text for safe interpolation into SVG/XML markup. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrapTitle(title, max = 30) {
  const words = title.split(' ');
  const lines = [''];
  for (const word of words) {
    const line = lines[lines.length - 1];
    if ((line + ' ' + word).trim().length > max && line) lines.push(word);
    else lines[lines.length - 1] = (line + ' ' + word).trim();
  }
  return lines.slice(0, 3);
}

function write(relPath, content) {
  const path = join(PUBLIC, relPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.trim() + '\n', 'utf-8');
  console.log('  ✓', relPath);
}

/* ── Brand marks ───────────────────────────────────────────────────── */

function logoIcon(size = 48, hexFill = NAVY, hexStroke = AMBER, fFill = '#FFFFFF') {
  const r = size * 0.44;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <polygon points="${hexPoints(size / 2, size / 2, r)}" fill="${hexFill}" stroke="${hexStroke}" stroke-width="${size * 0.05}"/>
  <text x="${size / 2}" y="${size * 0.665}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${size * 0.5}" fill="${fFill}">F</text>
</svg>`;
}

function wordmark(textFill, subFill, hexFill, hexStroke, fFill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 48">
  <polygon points="${hexPoints(24, 24, 20)}" fill="${hexFill}" stroke="${hexStroke}" stroke-width="2.4"/>
  <text x="24" y="31.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="24" fill="${fFill}">F</text>
  <text x="52" y="26" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="19" letter-spacing="2.5" fill="${textFill}">FERROX</text>
  <text x="53" y="40" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7.5" letter-spacing="2.6" fill="${subFill}">INDUSTRIAL SUPPLY CO.</text>
</svg>`;
}

console.log('Brand assets');
write('favicon.svg', logoIcon(48, NAVY, AMBER, '#FFFFFF'));
write('images/logo-icon.svg', logoIcon(48, NAVY, AMBER, '#FFFFFF'));
write('images/logo-light.svg', wordmark('#FFFFFF', STEEL, NAVY, AMBER, '#FFFFFF'));
write('images/logo-dark.svg', wordmark(NAVY, '#64748B', NAVY, AMBER, '#FFFFFF'));

/* ── OG image ──────────────────────────────────────────────────────── */

console.log('Social card');
write(
  'images/og-default.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY_600}"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
  </defs>
  ${hexPattern('#FFFFFF', 0.1, 'p')}
  <rect width="1200" height="630" fill="url(#og)"/>
  <rect width="1200" height="630" fill="url(#p)"/>
  <circle cx="1020" cy="80" r="260" fill="${AMBER}" opacity="0.14"/>
  <circle cx="120" cy="590" r="220" fill="${STEEL}" opacity="0.15"/>
  <polygon points="${hexPoints(200, 268, 92)}" fill="none" stroke="${AMBER}" stroke-width="7"/>
  <text x="200" y="302" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="98" fill="#FFFFFF">F</text>
  <text x="340" y="255" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="64" letter-spacing="6" fill="#FFFFFF">FERROX</text>
  <text x="343" y="305" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="26" letter-spacing="9" fill="${STEEL}">INDUSTRIAL SUPPLY CO.</text>
  <rect x="343" y="336" width="64" height="5" fill="${AMBER}"/>
  <text x="340" y="392" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="${STEEL_300}">Materials. Components. Reliability.</text>
  <text x="600" y="560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" letter-spacing="2" fill="${STEEL}">Chemicals · Paints · Fasteners · Steel · PTFE · Instruments · Oils</text>
</svg>`
);

/* ── Team avatars ──────────────────────────────────────────────────── */

const TEAM = [
  { file: 'images/team/founder.svg', name: 'Muhammad Ahmed Khan', role: 'Founder & CEO' },
  { file: 'images/team/sara.svg', name: 'Sara Malik', role: 'Sales Manager' },
  { file: 'images/team/usman.svg', name: 'Usman Tariq', role: 'Technical Support Lead' },
];

console.log('Team avatars');
for (const member of TEAM) {
  const seed = hash(member.name);
  const initialsText = initials(member.name);
  write(
    member.file,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
  ${gradient('g', seed)}
  ${hexPattern('#FFFFFF', 0.09, 'p' + seed)}
  <rect width="480" height="360" fill="url(#g${seed})"/>
  <rect width="480" height="360" fill="url(#p${seed})"/>
  <circle cx="240" cy="158" r="74" fill="#FFFFFF" opacity="0.14"/>
  <circle cx="240" cy="146" r="42" fill="#FFFFFF" opacity="0.92"/>
  <path d="M168 232c10-34 40-50 72-50s62 16 72 50" fill="#FFFFFF" opacity="0.92"/>
  <text x="240" y="316" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="34" fill="#FFFFFF">${esc(initialsText)}</text>
  <text x="240" y="342" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="15" letter-spacing="2" fill="${STEEL_300}">${esc(member.role.toUpperCase())}</text>
</svg>`
  );
}

/* ── Project covers + gallery ──────────────────────────────────────── */

const PROJECTS = [
  {
    slug: 'water-treatment-plant-upgrade',
    title: 'Water Treatment Plant Chemical Supply',
    industry: 'Water & Utilities',
  },
  {
    slug: 'textile-mill-lubrication-program',
    title: 'Textile Mill Lubrication & Coating Program',
    industry: 'Textile',
  },
  {
    slug: 'steel-furnace-high-temp-coating',
    title: 'Steel Furnace High-Temperature Coating',
    industry: 'Steel & Metal',
  },
  {
    slug: 'pharma-lab-instruments-fitout',
    title: 'Pharma QC Laboratory Instruments Fitout',
    industry: 'Pharmaceutical',
  },
  {
    slug: 'solar-farm-fastener-supply',
    title: 'Solar Farm Structure Fastener Supply',
    industry: 'Power & Energy',
  },
];

console.log('Project covers');
for (const project of PROJECTS) {
  const seed = hash(project.slug);
  const lines = wrapTitle(project.title);
  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="72" y="${404 + i * 52}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="42" fill="#FFFFFF">${esc(line)}</text>`
    )
    .join('\n  ');
  const cover = (file, label) =>
    write(
      file,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750">
  ${gradient('g', seed)}
  ${hexPattern('#FFFFFF', 0.1, 'p' + seed + label)}
  <rect width="1200" height="750" fill="url(#g${seed})"/>
  <rect width="1200" height="750" fill="url(#p${seed}${label})"/>
  <circle cx="1080" cy="600" r="300" fill="${AMBER}" opacity="0.12"/>
  <polygon points="${hexPoints(1020, 200, 110)}" fill="none" stroke="${AMBER}" stroke-opacity="0.55" stroke-width="6"/>
  <polygon points="${hexPoints(1020, 200, 66)}" fill="${AMBER}" opacity="0.28"/>
  <text x="72" y="330" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" letter-spacing="5" fill="${AMBER}">${esc(project.industry.toUpperCase())}</text>
  ${titleSvg}
  <rect x="72" y="${430 + (lines.length - 1) * 52}" width="72" height="6" fill="${AMBER}"/>
  <text x="72" y="700" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="17" letter-spacing="3" fill="${STEEL_300}">FERROX INDUSTRIAL SUPPLY CO.</text>
</svg>`
    );
  cover(`images/projects/${project.slug}/cover.svg`, 'c');
  cover(`images/projects/${project.slug}/1.svg`, '1');
  cover(`images/projects/${project.slug}/2.svg`, '2');
}

/* ── Partner logos ─────────────────────────────────────────────────── */

const PARTNERS = [
  'Islamabad Steel Mills',
  'Northern Textile Mills',
  'PharmaTech Laboratories',
  'AgroFoods Processing',
  'PowerGen Utilities',
  'Blue Arc Cement',
  'ChemBridge Trading',
  'Bolt & Fast Industries',
  'Polymer Works',
  'Example Tools GmbH',
  'Pak Safety Council',
];

const slugify = (s) =>
  s
    .replace(/&/g, 'and')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

console.log('Partner logos');
for (const name of PARTNERS) {
  const seed = hash(name);
  const mono = initials(name);
  write(
    `images/partners/${slugify(name)}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120">
  <rect width="320" height="120" rx="14" fill="${SURFACE}"/>
  <rect x="0.5" y="0.5" width="319" height="119" rx="13.5" fill="none" stroke="${LINE}"/>
  <rect x="24" y="36" width="48" height="48" rx="10" fill="${GRADIENTS[seed % GRADIENTS.length][0]}"/>
  <text x="48" y="68" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="22" fill="#FFFFFF">${mono}</text>
  ${(() => {
    const words = name.split(' ');
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
    const common = 'font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="21" fill="' + INK + '"';
    return line2
      ? `<text x="88" y="57" ${common}>${esc(line1)}</text><text x="88" y="82" ${common}>${esc(line2)}</text>`
      : `<text x="88" y="70" ${common}>${esc(line1)}</text>`;
  })()}
</svg>`
  );
}

/* ── Certification badges ──────────────────────────────────────────── */

console.log('Certification badges');
const CERTS = ['ISO 9001:2015', 'ISO 14001:2015'];
for (const cert of CERTS) {
  const slug = slugify(cert);
  const [title, version] = cert.split(':');
  write(
    `images/certs/${slug}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="56" fill="${SURFACE}" stroke="${LINE}"/>
  <circle cx="60" cy="60" r="47" fill="none" stroke="${AMBER}" stroke-width="3"/>
  <polygon points="${hexPoints(60, 44, 17)}" fill="none" stroke="${NAVY}" stroke-width="2.5"/>
  <text x="60" y="50" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="15" fill="${NAVY}">✓</text>
  <text x="60" y="84" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="14" fill="${NAVY}">${title}</text>
  ${version ? `<text x="60" y="99" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="11" fill="#64748B">:${version}</text>` : ''}
</svg>`
  );
}

console.log('\nDone. Replace any placeholder by dropping a real image at the same path in /public and updating the JSON.');
