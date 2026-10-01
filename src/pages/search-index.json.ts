import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../lib/data';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
