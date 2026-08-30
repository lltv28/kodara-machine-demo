import { resolveVisitorRegion } from '../_lib/visitor-region.mjs';

export async function onRequestGet({ request, env }) {
  const result = await resolveVisitorRegion(request, env);
  return Response.json(result, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Vary': 'CF-Connecting-IP',
    },
  });
}
