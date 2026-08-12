import { createClient } from '@supabase/supabase-js';
import type { HolderSnapshot, Launch, LaunchStatus, SocialLink, Trade } from './types';

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

type TradeRow = {
  trader_address: string;
  side: string;
  cro_amount_wei: string | number;
  token_amount: string | number | null;
  tx_hash: string;
  block_number: string | number;
  traded_at: string;
};

type HolderRow = {
  holder_address: string;
  balance: string | number;
  share_bips: number;
  label: string | null;
  snapshot_block: string | number;
  captured_at: string;
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

function socials(row: LaunchRow): SocialLink[] {
  return [
    row.website_url && { platform: 'website' as const, url: row.website_url },
    row.x_url && { platform: 'x' as const, url: row.x_url },
    row.discord_url && { platform: 'discord' as const, url: row.discord_url },
    row.telegram_url && { platform: 'telegram' as const, url: row.telegram_url },
  ].filter((link): link is SocialLink => Boolean(link));
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

export async function fetchSupabaseLaunchByAddress(address: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('launches')
    .select('chain_id,token_address,creator_address,name,symbol,description,image_url,x_url,website_url,discord_url,telegram_url,status,graduation_target_wei,reserve_raised_wei,anti_bot_enabled,tax_bips,created_at')
    .eq('token_address', address.toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return mapLaunchRow(data as LaunchRow);
}

export async function fetchSupabaseLaunchTrades(address: string): Promise<Trade[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('trades')
    .select('trader_address,side,cro_amount_wei,token_amount,tx_hash,block_number,traded_at')
    .eq('token_address', address.toLowerCase())
    .order('block_number', { ascending: false })
    .limit(25);
  if (error || !data) return null;
  return data.map((row) => {
    const trade = row as TradeRow;
    return {
      side: trade.side.toLowerCase() === 'sell' ? 'Sell' : 'Buy',
      wallet: trade.trader_address,
      amount: formatCro(trade.cro_amount_wei),
      tokens: trade.token_amount ? `${Number(trade.token_amount).toLocaleString()} tokens` : 'reserve contribution',
      age: age(trade.traded_at),
      txHash: trade.tx_hash,
      blockNumber: Number(trade.block_number),
      timestamp: trade.traded_at,
      croAmountWei: String(trade.cro_amount_wei),
    };
  });
}

export async function fetchSupabaseHolderSnapshots(address: string): Promise<HolderSnapshot[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('holder_snapshots')
    .select('holder_address,balance,share_bips,label,snapshot_block,captured_at')
    .eq('token_address', address.toLowerCase())
    .order('share_bips', { ascending: false })
    .limit(25);
  if (error || !data) return null;
  return data.map((row) => {
    const holder = row as HolderRow;
    return {
      wallet: holder.holder_address,
      share: `${(holder.share_bips / 100).toFixed(2)}%`,
      note: holder.label ?? `${Number(holder.balance).toLocaleString()} tokens`,
    };
  });
}

export async function uploadTokenImage(file: File) {
  if (!supabase) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `drafts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('token-images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return supabase.storage.from('token-images').getPublicUrl(path).data.publicUrl;
}
