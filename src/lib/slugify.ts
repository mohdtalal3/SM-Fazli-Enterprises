/**
 * Convert a human name into a URL-safe slug.
 * Parenthetical content is dropped: "Sodium Hydroxide (Caustic Soda)" → "sodium-hydroxide".
 */
export function slugify(input: string): string {
  return input
    .replace(/\([^)]*\)/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
