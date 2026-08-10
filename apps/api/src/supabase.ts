import { createClient } from '@supabase/supabase-js';

export type ApiLaunch = {
  address: string;
  name: string;
  symbol: string;
  status: string;
  creator?: string;
  description?: string;
  imageUrl?: string | null;
  socials?: string[];
};

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function socialLabels(row: { x_url?: string | null; website_url?: string | null; discord_url?: string | null; telegram_url?: string | null }) {
  return [row.x_url && 'X', row.website_url && 'Website', row.discord_url && 'Discord', row.telegram_url && 'Telegram'].filter(Boolean) as string[];
}

export async function fetchLaunchesFromSupabase(): Promise<ApiLaunch[] | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('launches')
    .select('token_address,name,symbol,status,creator_address,description,image_url,x_url,website_url,discord_url,telegram_url,created_at')
    .order('created_at', { ascending: false });
  if (error || !data?.length) return null;
  return data.map((row) => ({
    address: row.token_address,
    name: row.name,
    symbol: row.symbol,
    status: row.status,
    creator: row.creator_address,
    description: row.description ?? undefined,
    imageUrl: row.image_url,
    socials: socialLabels(row),
  }));
}

export async function fetchLaunchFromSupabase(address: string): Promise<ApiLaunch | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('launches')
    .select('token_address,name,symbol,status,creator_address,description,image_url,x_url,website_url,discord_url,telegram_url')
    .eq('token_address', address)
    .maybeSingle();
  if (error || !data) return null;
  return {
    address: data.token_address,
    name: data.name,
    symbol: data.symbol,
    status: data.status,
    creator: data.creator_address,
    description: data.description ?? undefined,
    imageUrl: data.image_url,
    socials: socialLabels(data),
  };
}
