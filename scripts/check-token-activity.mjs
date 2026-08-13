import { createRequire } from 'node:module';

const require = createRequire(new URL('../apps/indexer/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const staleMinutes = Number(process.env.STALE_ACTIVITY_MINUTES ?? '60');

if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL and readable Supabase key');

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

const cutoff = Date.now() - staleMinutes * 60_000;
const { data: launches, error } = await supabase
  .from('launches')
  .select('token_address,name,symbol,reserve_raised_wei,created_at')
  .order('created_at', { ascending: false })
  .limit(100);
if (error) throw error;

let stale = 0;
for (const launch of launches ?? []) {
  const token = launch.token_address.toLowerCase();
  const [{ data: trades }, { data: holders }] = await Promise.all([
    supabase.from('trades').select('traded_at').eq('token_address', token).order('traded_at', { ascending: false }).limit(1),
    supabase.from('holder_snapshots').select('captured_at').eq('token_address', token).order('captured_at', { ascending: false }).limit(1),
  ]);
  const latestTrade = trades?.[0]?.traded_at ? new Date(trades[0].traded_at).getTime() : 0;
  const latestHolder = holders?.[0]?.captured_at ? new Date(holders[0].captured_at).getTime() : 0;
  const hasReserve = Number(launch.reserve_raised_wei) > 0;
  const missing = hasReserve && (!latestTrade || !latestHolder);
  const old = hasReserve && Math.max(latestTrade, latestHolder) > 0 && Math.max(latestTrade, latestHolder) < cutoff;
  if (missing || old) {
    stale += 1;
    console.log(`${launch.symbol || launch.name} ${token}: ${missing ? 'missing' : 'stale'} activity rows`);
  }
}

if (stale) {
  console.log(`stale_activity_count=${stale}`);
  process.exitCode = 1;
} else {
  console.log('stale_activity_count=0');
}
