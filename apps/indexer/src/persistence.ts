import { createClient } from '@supabase/supabase-js';
import type { DecodedLaunchpadEvent } from './index.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export async function persistEvents(events: DecodedLaunchpadEvent[], chainId: number) {
  if (!supabaseAdmin || events.length === 0) return { enabled: Boolean(supabaseAdmin), launches: 0, trades: 0, graduations: 0 };
  let launches = 0;
  let trades = 0;
  let graduations = 0;
  for (const event of events) {
    if (event.type === 'TokenCreated') {
      const { error } = await supabaseAdmin.from('launches').upsert({
        chain_id: chainId,
        token_address: event.token.toLowerCase(),
        creator_address: event.creator.toLowerCase(),
        name: event.name,
        symbol: event.symbol,
        normalized_name: event.name.trim().toLowerCase(),
        normalized_symbol: event.symbol.trim().toUpperCase(),
        status: 'launching',
        graduation_target_wei: event.graduationTargetWei.toString(),
        reserve_raised_wei: '0',
        anti_bot_enabled: event.antiBotEnabled,
        tax_bips: 0,
        vvs_router: event.vvsRouter.toLowerCase(),
        created_tx: event.txHash,
        created_block: event.blockNumber.toString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'token_address' });
      if (error) throw error;
      launches += 1;
    }
    if (event.type === 'TokenBought') {
      const { error: tradeError } = await supabaseAdmin.from('trades').insert({
        token_address: event.token.toLowerCase(),
        trader_address: event.buyer.toLowerCase(),
        side: 'buy',
        cro_amount_wei: event.croIn.toString(),
        token_amount: event.tokensOut.toString(),
        tx_hash: event.txHash,
        block_number: event.blockNumber.toString(),
        traded_at: new Date().toISOString(),
      });
      if (tradeError) throw tradeError;
      const { error: launchError } = await supabaseAdmin
        .from('launches')
        .update({ reserve_raised_wei: event.reserveRaisedWei.toString() })
        .eq('token_address', event.token.toLowerCase());
      if (launchError) throw launchError;
      trades += 1;
    }
    if (event.type === 'TokenSold') {
      const { error: tradeError } = await supabaseAdmin.from('trades').insert({
        token_address: event.token.toLowerCase(),
        trader_address: event.seller.toLowerCase(),
        side: 'sell',
        cro_amount_wei: event.croOut.toString(),
        token_amount: event.tokensIn.toString(),
        tx_hash: event.txHash,
        block_number: event.blockNumber.toString(),
        traded_at: new Date().toISOString(),
      });
      if (tradeError) throw tradeError;
      const { error: launchError } = await supabaseAdmin
        .from('launches')
        .update({ reserve_raised_wei: event.reserveRaisedWei.toString() })
        .eq('token_address', event.token.toLowerCase());
      if (launchError) throw launchError;
      trades += 1;
    }
    if (event.type === 'TokenGraduated') {
      const { error } = await supabaseAdmin
        .from('launches')
        .update({ status: 'graduated', vvs_pair: event.pair.toLowerCase(), lp_vault: event.lpVault.toLowerCase() })
        .eq('token_address', event.token.toLowerCase());
      if (error) throw error;
      graduations += 1;
    }
  }
  return { enabled: true, launches, trades, graduations };
}
