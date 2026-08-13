import type { HolderSnapshot, Trade } from '../data/types';
import { explorerTxUrl, shortAddress } from '../wallet/chains';

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="tableSkeleton" aria-label="Loading rows">
      {Array.from({ length: rows }).map((_, index) => <span key={index} />)}
    </div>
  );
}

export function TradesTable({ trades, loading = false }: { trades: Trade[]; loading?: boolean }) {
  return (
    <div className="dataTable">
      <h3>Trades</h3>
      {loading && !trades.length ? <TableSkeleton /> : trades.length ? trades.map((trade) => (
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

export function HoldersTable({ holders, loading = false }: { holders: HolderSnapshot[]; loading?: boolean }) {
  return (
    <div className="dataTable holdersTable">
      <h3>Holders</h3>
      {loading && !holders.length ? <TableSkeleton /> : holders.length ? holders.map((holder) => (
        <div key={holder.wallet}>
          <b>{holder.share}</b>
          <span title={holder.wallet}>{holder.wallet.startsWith('0x') ? shortAddress(holder.wallet) : holder.wallet}</span>
          <span>{holder.note}</span>
        </div>
      )) : (
        <div className="dataNotice">
          <b>No holders yet</b>
          <span>Holder balances appear after token transfers are confirmed.</span>
          <span>The launch reserve is shown separately when it still holds unsold supply.</span>
        </div>
      )}
    </div>
  );
}
