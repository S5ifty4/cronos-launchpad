import { fetchLaunchFromSupabase, fetchLaunchesFromSupabase } from './supabase.js';

export type ApiResponse = { status: number; body: unknown };

export function handleRequest(pathname: string): ApiResponse {
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/health') return { status: 200, body: { ok: true } };
  if (pathname === '/launches') return { status: 200, body: [] };
  if (parts[0] === 'launches' && parts[1] && !parts[2]) return { status: 200, body: null };
  if (parts[0] === 'launches' && parts[2] === 'trades') return { status: 200, body: [] };
  if (parts[0] === 'launches' && parts[2] === 'holders') return { status: 200, body: [] };
  if (parts[0] === 'creators' && parts[1]) return { status: 200, body: { wallet: parts[1], launches: 0, graduated: 0 } };
  if (pathname === '/proof') return { status: 200, body: [] };
  return { status: 404, body: { error: 'not found' } };
}

export async function handleRequestAsync(pathname: string): Promise<ApiResponse> {
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/launches') {
    const rows = await fetchLaunchesFromSupabase();
    if (rows) return { status: 200, body: rows };
  }
  if (parts[0] === 'launches' && parts[1] && !parts[2]) {
    const row = await fetchLaunchFromSupabase(parts[1]);
    if (row) return { status: 200, body: row };
  }
  return handleRequest(pathname);
}
