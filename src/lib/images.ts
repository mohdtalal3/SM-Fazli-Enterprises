import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * True when `src` is a root-relative path to a file that exists under /public.
 * Used at build time to decide between a real image and a styled placeholder.
 */
export function publicFileExists(src: string | undefined | null): boolean {
  if (!src || !src.startsWith('/')) return false;
  try {
    return existsSync(join(process.cwd(), 'public', src.replace(/^\//, '')));
  } catch {
    return false;
  }
}
