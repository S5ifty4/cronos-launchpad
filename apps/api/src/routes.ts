import { fetchLaunchFromSupabase, fetchLaunchesFromSupabase } from './supabase.js';

export type ApiResponse = { status: number; body: unknown };

const launches = [
  { address: '0xcrojack', name: 'Crojack Protocol', symbol: 'CROJACK', status: 'launching' },
  { address: '0xbcg', name: 'Blue Chain Gecko', symbol: 'BCG', status: 'graduated' },
];
const trades = [{ wallet: '0x8f2a...c5a2', side: 'buy', amount: '222 CRO' }];
const holders = [{ wallet: 'LP vault', share: '34.2%', note: 'locked on graduation' }];
const proof = [{ label: 'mock VVS graduation', status: 'ready' }];

export function handleRequest(pathname: string): ApiResponse {
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/health') return { status: 200, body: { ok: true } };
  if (pathname === '/launches') return { status: 200, body: launches };
  if (parts[0] === 'launches' && parts[1] && !parts[2]) return { status: 200, body: launches.find((launch) => launch.address === parts[1]) ?? null };
  if (parts[0] === 'launches' && parts[2] === 'trades') return { status: 200, body: trades };
  if (parts[0] === 'launches' && parts[2] === 'holders') return { status: 200, body: holders };
  if (parts[0] === 'creators' && parts[1]) return { status: 200, body: { wallet: parts[1], launches: 7, graduated: 3 } };
  if (pathname === '/proof') return { status: 200, body: proof };
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
