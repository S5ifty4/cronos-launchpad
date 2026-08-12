import type { Launch, Trade } from '../data/types';

function parseCro(value: string) {
  const match = value.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function tradeCro(trade: Trade) {
  if (trade.croAmountWei) return Number(BigInt(trade.croAmountWei) / 1_000_000_000_000_000n) / 1_000;
  return parseCro(trade.amount);
}

export function ReserveChart({ launch, trades }: { launch: Launch; trades: Trade[] }) {
  const target = Math.max(1, parseCro(launch.graduationTarget));
  const currentReserve = Math.max(0, parseCro(launch.reserveRaised));
  const chronological = [...trades].reverse();
  let running = Math.max(0, currentReserve - chronological.reduce((sum, trade) => sum + (trade.side === 'Sell' ? -tradeCro(trade) : tradeCro(trade)), 0));
  const points = chronological.map((trade) => {
    running += trade.side === 'Sell' ? -tradeCro(trade) : tradeCro(trade);
    return Math.max(0, running);
  });
  const fallback = currentReserve > 0 ? [Math.max(0, currentReserve * 0.35), Math.max(0, currentReserve * 0.68), currentReserve] : [0];
  const series = points.length ? points : fallback;
  const max = Math.max(target, currentReserve, ...series, 1);
  const progress = Math.min(100, (currentReserve / target) * 100);

  return (
    <div className="chartPanel reserveChart" aria-label="Reserve raised toward graduation target">
      <div className="chartHeader">
        <div><p className="eyebrow">Reserve curve</p><h3>{currentReserve.toLocaleString()} / {target.toLocaleString()} CRO</h3></div>
        <strong>{progress.toFixed(1)}%</strong>
      </div>
      <div className="reserveBars">
        {series.map((value, index) => (
          <span key={`${value}-${index}`} style={{ height: `${Math.max(4, Math.min(100, (value / max) * 100))}%` }} title={`${value.toLocaleString()} CRO`} />
        ))}
      </div>
      <div className="targetLine" style={{ bottom: `${Math.min(88, Math.max(20, (target / max) * 72 + 16))}%` }}><span>graduation target</span></div>
      <div className="chartFooter"><span>Indexed buys only</span><span>{trades.length ? `${trades.length} trade${trades.length === 1 ? '' : 's'}` : 'waiting for buys'}</span></div>
    </div>
  );
}
