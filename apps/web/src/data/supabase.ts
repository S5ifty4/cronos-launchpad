import { createClient } from '@supabase/supabase-js';
import type { Launch, LaunchStatus } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

type LaunchRow = {
  chain_id: number;
  token_address: string;
  creator_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  x_url: string | null;
  website_url: string | null;
  discord_url: string | null;
  telegram_url: string | null;
  status: string;
  graduation_target_wei: string | number;
  reserve_raised_wei: string | number;
  anti_bot_enabled: boolean;
  tax_bips: number;
  created_at: string;
};

function formatCro(value: string | number) {
  const asNumber = Number(value) / 1e18;
  return `${Math.round(asNumber).toLocaleString()} CRO`;
}

function progress(row: LaunchRow) {
  const target = Number(row.graduation_target_wei);
  const raised = Number(row.reserve_raised_wei);
  return target > 0 ? Math.min(100, Number(((raised / target) * 100).toFixed(1))) : 0;
}

function status(row: LaunchRow): LaunchStatus {
  if (row.status === 'graduated') return 'Graduated';
  const pct = progress(row);
  return pct >= 85 ? 'Near graduation' : 'Launching';
}

function age(createdAt: string) {
  const elapsed = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function socials(row: LaunchRow) {
  return [row.x_url && 'X', row.website_url && 'Website', row.discord_url && 'Discord', row.telegram_url && 'Telegram'].filter(Boolean) as string[];
}

export function mapLaunchRow(row: LaunchRow): Launch {
  return {
    address: row.token_address,
    chainId: row.chain_id,
    name: row.name,
    symbol: row.symbol,
    creator: row.creator_address,
    progress: progress(row),
    reserveRaised: formatCro(row.reserve_raised_wei),
    graduationTarget: formatCro(row.graduation_target_wei),
    age: age(row.created_at),
    antiBot: row.anti_bot_enabled,
    protectedName: true,
    vvsGraduation: true,
    taxBips: row.tax_bips,
    marketCap: 'indexed',
    volume24h: 'indexed',
    holders: 'indexed',
    description: row.description ?? '',
    status: status(row),
    socials: socials(row),
    color: '#4CDBFF',
    imageUrl: row.image_url ?? undefined,
  };
}

export async function fetchSupabaseLaunches() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('launches')
    .select('chain_id,token_address,creator_address,name,symbol,description,image_url,x_url,website_url,discord_url,telegram_url,status,graduation_target_wei,reserve_raised_wei,anti_bot_enabled,tax_bips,created_at')
    .order('created_at', { ascending: false });
  if (error || !data?.length) return null;
  return data.map((row) => mapLaunchRow(row as LaunchRow));
}

export async function uploadTokenImage(file: File) {
  if (!supabase) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `drafts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('token-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return supabase.storage.from('token-images').getPublicUrl(path).data.publicUrl;
}
