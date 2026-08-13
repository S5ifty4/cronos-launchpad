import { createClient } from '@supabase/supabase-js';
import { createPublicClient, decodeEventLog, formatEther, http, parseAbiItem } from 'viem';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rpcUrl = process.env.CRONOS_TESTNET_RPC_URL ?? 'https://evm-t3.cronos.org/';
const chainId = Number(process.env.CHAIN_ID ?? '338');
const zero = '0x0000000000000000000000000000000000000000';

if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const client = createPublicClient({ transport: http(rpcUrl) });
const transferEvent = parseAbiItem('event Transfer(address indexed from,address indexed to,uint256 value)');
const boughtEvent = parseAbiItem('event TokenBought(address indexed token,address indexed buyer,uint256 croIn,uint256 tokensOut,uint256 reserveRaisedWei)');
const soldEvent = parseAbiItem('event TokenSold(address indexed token,address indexed seller,uint256 tokensIn,uint256 croOut,uint256 reserveRaisedWei)');

function blockRanges(fromBlock, toBlock, step = 1900n) {
  const out = [];
  for (let start = fromBlock; start <= toBlock; start += step) out.push([start, start + step - 1n > toBlock ? toBlock : start + step - 1n]);
  return out;
}

async function factoryForLaunch(row) {
  if (!row.created_tx) return undefined;
  const tx = await client.getTransaction({ hash: row.created_tx }).catch(() => null);
  return tx?.to;
}

async function upsertTrades(row, factory, latest) {
  if (!factory) return 0;
  const fromBlock = BigInt(row.created_block ?? 0);
  const rows = [];
  for (const event of [boughtEvent, soldEvent]) {
    for (const [fromBlockRange, toBlockRange] of blockRanges(fromBlock, latest)) {
      const logs = await client.getLogs({ address: factory, event, args: { token: row.token_address }, fromBlock: fromBlockRange, toBlock: toBlockRange }).catch(() => []);
      for (const log of logs) {
        const decoded = decodeEventLog({ abi: [event], data: log.data, topics: log.topics });
        if (decoded.eventName === 'TokenBought') rows.push({
          token_address: row.token_address,
          trader_address: decoded.args.buyer.toLowerCase(),
          side: 'buy',
          cro_amount_wei: decoded.args.croIn.toString(),
          token_amount: decoded.args.tokensOut.toString(),
          tx_hash: log.transactionHash,
          block_number: log.blockNumber.toString(),
          traded_at: new Date().toISOString(),
        });
        if (decoded.eventName === 'TokenSold') rows.push({
          token_address: row.token_address,
          trader_address: decoded.args.seller.toLowerCase(),
          side: 'sell',
          cro_amount_wei: decoded.args.croOut.toString(),
          token_amount: decoded.args.tokensIn.toString(),
          tx_hash: log.transactionHash,
          block_number: log.blockNumber.toString(),
          traded_at: new Date().toISOString(),
        });
      }
    }
  }
  if (!rows.length) return 0;
  await supabase.from('trades').delete().eq('token_address', row.token_address);
  const { error } = await supabase.from('trades').insert(rows);
  if (error) throw error;
  return rows.length;
}

async function upsertHolders(row, latest) {
  const fromBlock = BigInt(row.created_block ?? 0);
  const balances = new Map();
  for (const [fromBlockRange, toBlockRange] of blockRanges(fromBlock, latest)) {
    const logs = await client.getLogs({ address: row.token_address, event: transferEvent, fromBlock: fromBlockRange, toBlock: toBlockRange }).catch(() => []);
    for (const log of logs) {
      const decoded = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
      const from = decoded.args.from.toLowerCase();
      const to = decoded.args.to.toLowerCase();
      const value = decoded.args.value;
      if (from !== zero) balances.set(from, (balances.get(from) ?? 0n) - value);
      if (to !== zero) balances.set(to, (balances.get(to) ?? 0n) + value);
    }
  }
  const totalSupply = [...balances.values()].reduce((sum, value) => sum + (value > 0n ? value : 0n), 0n);
  const rows = [...balances.entries()].filter(([, balance]) => balance > 0n).map(([wallet, balance]) => ({
    token_address: row.token_address,
    holder_address: wallet,
    balance: balance.toString(),
    share_bips: totalSupply > 0n ? Number((balance * 10000n) / totalSupply) : 0,
    label: wallet === row.creator_address?.toLowerCase() ? 'creator' : 'holder',
    snapshot_block: latest.toString(),
    captured_at: new Date().toISOString(),
  }));
  if (!rows.length) return 0;
  await supabase.from('holder_snapshots').delete().eq('token_address', row.token_address);
  const { error } = await supabase.from('holder_snapshots').insert(rows);
  if (error) throw error;
  return rows.length;
}

const { data, error } = await supabase
  .from('launches')
  .select('token_address,creator_address,created_tx,created_block')
  .eq('chain_id', chainId)
  .order('created_block', { ascending: false });
if (error) throw error;
const latest = await client.getBlockNumber();
let tradeCount = 0;
let holderCount = 0;
for (const row of data ?? []) {
  const launch = { ...row, token_address: row.token_address.toLowerCase(), creator_address: row.creator_address.toLowerCase() };
  const factory = await factoryForLaunch(launch);
  const trades = await upsertTrades(launch, factory, latest);
  const holders = await upsertHolders(launch, latest);
  tradeCount += trades;
  holderCount += holders;
  console.log(`${launch.token_address}: trades=${trades} holders=${holders}`);
}
console.log(`backfilled launches=${data?.length ?? 0} trades=${tradeCount} holders=${holderCount}`);
