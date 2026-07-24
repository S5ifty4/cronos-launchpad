import type { HolderSnapshot, Trade } from '../data/types';

export function TradesTable({ trades }: { trades: Trade[] }) {
  return <div className="dataTable"><h3>Recent trades</h3>{trades.map((trade) => <div key={`${trade.wallet}${trade.age}`}><b className={trade.side === 'Buy' ? 'buy' : 'sell'}>{trade.side}</b><span>{trade.wallet}</span><span>{trade.amount}</span><span>{trade.age}</span></div>)}</div>;
}

export function HoldersTable({ holders }: { holders: HolderSnapshot[] }) {
  return <div className="dataTable"><h3>Holders</h3>{holders.map((holder) => <div key={holder.wallet}><b>{holder.share}</b><span>{holder.wallet}</span><span>{holder.note}</span></div>)}</div>;
}
