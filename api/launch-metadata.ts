declare const process: { env: Record<string, string | undefined> };

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronosTestnetRpcUrl = (process.env.CRONOS_TESTNET_RPC_URL ?? 'https://evm-t3.cronos.org/').trim();
const expectedFactoryAddress = (process.env.CRONOS_TESTNET_FACTORY_ADDRESS ?? '0xf88f79dead20f3932cb21590d3b29bec4e0336bb').trim().toLowerCase();
// TokenCreated(address indexed token,address indexed creator,string name,string symbol,bytes32 indexed normalizedNameHash,bytes32 normalizedSymbolHash,uint256 totalSupply,uint256 graduationTargetWei,bool antiBotEnabled,address vvsRouter,address wrappedNative,address lpBeneficiary,uint64 lpLockDurationSeconds)
// Includes vvsRouter, wrappedNative/WCRO, lpBeneficiary, and lpLockDurationSeconds.
const tokenCreatedTopic = '0xf5df120b25da30621a33445bb577a65225a029cdc4329befc8f5873126d5b7f6';

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const txPattern = /^0x[a-fA-F0-9]{64}$/;
const uintStringPattern = /^\d+$/;
const maxOptionalUrlLength = 500;

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

type RpcLog = { address: string; topics: string[]; data: string };
type RpcReceipt = { status?: string; to?: string | null; from?: string; blockNumber?: string; logs?: RpcLog[] };
type RpcTransaction = { from?: string; to?: string | null; value?: string; input?: string };
type RpcResult<T> = { result?: T; error?: { message?: string } };
type VerificationResult = { ok: true } | { ok: false; status: number; error: string };
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
  if (!trimmed || trimmed.length > maxOptionalUrlLength) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
      try {
        const url = new URL(`https://${trimmed}`);
        return url.toString();
      } catch {
        return null;
      }
    }
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

function parseRequiredUint(value: unknown) {
  const normalized = normalizeText(value, 80);
  if (!uintStringPattern.test(normalized)) return null;
  try { return BigInt(normalized); } catch { return null; }
}

function hexToBigInt(value?: string) {
  if (!value?.startsWith('0x')) return null;
  try { return BigInt(value); } catch { return null; }
}

function topicAddress(topic?: string) {
  if (!topic || !/^0x[a-fA-F0-9]{64}$/.test(topic)) return null;
  return `0x${topic.slice(-40)}`.toLowerCase();
}

function findTokenCreatedLog(receipt: RpcReceipt, tokenAddress: string, creatorAddress: string) {
  return (receipt.logs ?? []).find((log) => {
    const topics = log.topics ?? [];
    return topics[0]?.toLowerCase() === tokenCreatedTopic &&
      topicAddress(topics[1]) === tokenAddress &&
      topicAddress(topics[2]) === creatorAddress;
  });
}

async function rpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const response = await fetch(cronosTestnetRpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`rpc_http_${response.status}`);
  const payload = await response.json() as RpcResult<T>;
  if (payload.error) throw new Error(payload.error.message ?? 'rpc_error');
  return payload.result ?? null;
}

async function verifyConfirmedCreateTx(body: {
  tokenAddress: string;
  creatorAddress: string;
  txHash: string;
  vvsRouter: string;
  blockNumber: bigint;
  reserveRaisedWei: bigint;
}): Promise<VerificationResult> {
  const [receipt, tx] = await Promise.all([
    rpc<RpcReceipt>('eth_getTransactionReceipt', [body.txHash]),
    rpc<RpcTransaction>('eth_getTransactionByHash', [body.txHash]),
  ]);
  if (!receipt || !tx) return { ok: false, status: 409, error: 'tx_not_found' };
  if (receipt.status !== '0x1') return { ok: false, status: 409, error: 'tx_not_successful' };
  if (receipt.to?.toLowerCase() !== expectedFactoryAddress || tx.to?.toLowerCase() !== expectedFactoryAddress) {
    return { ok: false, status: 400, error: 'unexpected_factory' };
  }
  if (receipt.from?.toLowerCase() !== body.creatorAddress || tx.from?.toLowerCase() !== body.creatorAddress) {
    return { ok: false, status: 400, error: 'creator_mismatch' };
  }
  const actualBlockNumber = hexToBigInt(receipt.blockNumber);
  if (!actualBlockNumber || actualBlockNumber !== body.blockNumber) {
    return { ok: false, status: 400, error: 'block_number_mismatch' };
  }
  const actualValue = hexToBigInt(tx.value);
  if (actualValue === null || actualValue !== body.reserveRaisedWei) {
    return { ok: false, status: 400, error: 'reserve_value_mismatch' };
  }
  const eventLog = findTokenCreatedLog(receipt, body.tokenAddress, body.creatorAddress);
  if (!eventLog) return { ok: false, status: 400, error: 'token_created_event_not_found' };
  const lowerData = eventLog.data.toLowerCase();
  if (!lowerData.includes(body.vvsRouter.slice(2).toLowerCase().padStart(64, '0'))) {
    return { ok: false, status: 400, error: 'vvs_router_mismatch' };
  }
  return { ok: true };
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
  if (!addressPattern.test(expectedFactoryAddress)) return send(res, 500, { error: 'factory_not_configured' });

  const body = parseBody(req.body);
  if (!body) return send(res, 400, { error: 'invalid_json' });

  const tokenAddress = normalizeText(body.tokenAddress, 42).toLowerCase();
  const creatorAddress = normalizeText(body.creatorAddress, 42).toLowerCase();
  const txHash = normalizeText(body.txHash, 66).toLowerCase();
  const vvsRouter = normalizeText(body.vvsRouter, 42).toLowerCase();
  const name = normalizeText(body.name, 80);
  const symbol = normalizeText(body.symbol, 24).toUpperCase();
  const chainId = Number(body.chainId);
  const blockNumber = parseRequiredUint(body.blockNumber);
  const graduationTargetWei = parseRequiredUint(body.graduationTargetWei);
  const reserveRaisedWei = parseRequiredUint(body.reserveRaisedWei);

  if (!addressPattern.test(tokenAddress) || !addressPattern.test(creatorAddress) || !addressPattern.test(vvsRouter)) {
    return send(res, 400, { error: 'invalid_address' });
  }
  if (!txPattern.test(txHash)) return send(res, 400, { error: 'invalid_tx_hash' });
  if (!name || !symbol || !Number.isInteger(chainId) || chainId !== 338 || !blockNumber || !graduationTargetWei || reserveRaisedWei === null || blockNumber <= 0n || graduationTargetWei <= 0n || reserveRaisedWei < 0n) {
    return send(res, 400, { error: 'missing_required_launch_fields' });
  }

  try {
    const verification = await verifyConfirmedCreateTx({ tokenAddress, creatorAddress, txHash, vvsRouter, blockNumber, reserveRaisedWei });
    if (verification.ok === false) return send(res, verification.status, { error: verification.error });
  } catch (error) {
    return send(res, 502, { error: 'rpc_verification_failed', message: error instanceof Error ? error.message : 'unknown_rpc_error' });
  }

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

  const response = await fetch(`${supabaseUrl}/rest/v1/launches?on_conflict=token_address`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const message = await response.text();
    return send(res, 500, { error: 'supabase_upsert_failed', message });
  }

  return send(res, 200, { ok: true, tokenAddress });
}
