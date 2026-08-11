import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const txPattern = /^0x[a-fA-F0-9]{64}$/;

type LaunchMetadataBody = {
  tokenAddress?: string;
  chainId?: number;
  creatorAddress?: string;
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string | null;
  xUrl?: string;
  websiteUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;
  graduationTargetWei?: string;
  reserveRaisedWei?: string;
  antiBotEnabled?: boolean;
  vvsRouter?: string;
  txHash?: string;
  blockNumber?: string;
};

type VercelRequest = { method?: string; body?: LaunchMetadataBody | string };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (key: string, value: string) => void; end: () => void };

function send(res: VercelResponse, status: number, body: unknown) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  return res.status(status).json(body);
}

function cleanUrl(value?: string | null) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseBody(raw: VercelRequest['body']): LaunchMetadataBody | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as LaunchMetadataBody; } catch { return null; }
  }
  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type');
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (!supabaseUrl || !serviceKey) return send(res, 500, { error: 'supabase_not_configured' });

  const body = parseBody(req.body);
  if (!body) return send(res, 400, { error: 'invalid_json' });

  const tokenAddress = normalizeText(body.tokenAddress, 42).toLowerCase();
  const creatorAddress = normalizeText(body.creatorAddress, 42).toLowerCase();
  const txHash = normalizeText(body.txHash, 66).toLowerCase();
  const vvsRouter = normalizeText(body.vvsRouter, 42).toLowerCase();
  const name = normalizeText(body.name, 80);
  const symbol = normalizeText(body.symbol, 24).toUpperCase();
  const chainId = Number(body.chainId);
  const blockNumber = BigInt(body.blockNumber ?? '0');
  const graduationTargetWei = BigInt(body.graduationTargetWei ?? '0');
  const reserveRaisedWei = BigInt(body.reserveRaisedWei ?? '0');

  if (!addressPattern.test(tokenAddress) || !addressPattern.test(creatorAddress) || !addressPattern.test(vvsRouter)) {
    return send(res, 400, { error: 'invalid_address' });
  }
  if (!txPattern.test(txHash)) return send(res, 400, { error: 'invalid_tx_hash' });
  if (!name || !symbol || !Number.isInteger(chainId) || chainId <= 0 || blockNumber <= 0n || graduationTargetWei <= 0n) {
    return send(res, 400, { error: 'missing_required_launch_fields' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const row = {
    chain_id: chainId,
    token_address: tokenAddress,
    creator_address: creatorAddress,
    name,
    symbol,
    normalized_name: name.toLowerCase(),
    normalized_symbol: symbol,
    description: normalizeText(body.description, 2000) || null,
    image_url: cleanUrl(body.imageUrl),
    x_url: cleanUrl(body.xUrl),
    website_url: cleanUrl(body.websiteUrl),
    discord_url: cleanUrl(body.discordUrl),
    telegram_url: cleanUrl(body.telegramUrl),
    status: 'launching',
    graduation_target_wei: graduationTargetWei.toString(),
    reserve_raised_wei: reserveRaisedWei.toString(),
    anti_bot_enabled: Boolean(body.antiBotEnabled),
    tax_bips: 0,
    vvs_router: vvsRouter,
    created_tx: txHash,
    created_block: blockNumber.toString(),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('launches').upsert(row, { onConflict: 'token_address' });
  if (error) return send(res, 500, { error: 'supabase_upsert_failed', message: error.message });

  return send(res, 200, { ok: true, tokenAddress });
}
