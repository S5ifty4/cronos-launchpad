import type { HolderSnapshot, Trade } from '../data/types';
import { explorerTxUrl, shortAddress } from '../wallet/chains';

export function TradesTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="dataTable">
      <h3>Trades</h3>
      {trades.length ? trades.map((trade) => (
        <div key={trade.txHash ?? `${trade.wallet}${trade.age}`}>
          <b className={trade.side === 'Buy' ? 'buy' : 'sell'}>{trade.side}</b>
          <span title={trade.wallet}>{shortAddress(trade.wallet)}</span>
          <span>{trade.amount}</span>
          <span>{trade.txHash ? <a href={explorerTxUrl(trade.txHash)} target="_blank" rel="noreferrer">tx ↗</a> : trade.age}</span>
        </div>
      )) : <p className="small">No trades yet. Buys and sells will appear here after confirmation.</p>}
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
