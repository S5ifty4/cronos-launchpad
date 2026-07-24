import type { Launch } from '../data/types';

export function TradePanel({ launch }: { launch: Launch }) {
  return (
    <aside className="tradePanel">
      <h3>Trade preview</h3>
      <div className="buySell"><button>Buy</button><button>Sell</button></div>
      <input value="250 CRO" readOnly />
      <div className="amountChips"><span>50</span><span>100</span><span>250</span><span>500</span></div>
      <dl><dt>Receive est.</dt><dd>15,940 {launch.symbol}</dd><dt>Slippage</dt><dd>1.0%</dd><dt>Creator</dt><dd>{launch.creator}</dd><dt>LP status</dt><dd>Locks on graduation</dd></dl>
      <a className="button primary" href="/create">Connect wallet later</a>
    </aside>
  );
}
