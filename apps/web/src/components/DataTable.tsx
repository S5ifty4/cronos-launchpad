import type { HolderSnapshot, Trade } from '../data/types';
import { shortAddress } from '../wallet/chains';

export function TradesTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="dataTable">
      <h3>Recent reserve contributions</h3>
      {trades.length ? trades.map((trade) => (
        <div key={trade.txHash ?? `${trade.wallet}${trade.age}`}>
          <b className={trade.side === 'Buy' ? 'buy' : 'sell'}>{trade.side}</b>
          <span title={trade.wallet}>{shortAddress(trade.wallet)}</span>
          <span>{trade.amount}</span>
          <span>{trade.age}</span>
        </div>
      )) : <p className="small">No buy activity yet. Trades will appear here after the first confirmed buy.</p>}
    </div>
  );
}

export function HoldersTable({ holders }: { holders: HolderSnapshot[] }) {
  return (
    <div className="dataTable holdersTable">
      <h3>Holders</h3>
      {holders.length ? holders.map((holder) => (
        <div key={holder.wallet}>
          <b>{holder.share}</b>
          <span title={holder.wallet}>{holder.wallet.startsWith('0x') ? shortAddress(holder.wallet) : holder.wallet}</span>
          <span>{holder.note}</span>
        </div>
      )) : (
        <div className="dataNotice">
          <b>Not live yet</b>
          <span>Launch tokens are distributed on buy and redeemed on sell before graduation.</span>
          <span>Holder snapshots appear once live transfer tracking is enabled.</span>
        </div>
      )}
    </div>
  );
}
