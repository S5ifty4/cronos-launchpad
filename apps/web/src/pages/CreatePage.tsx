import { useMemo, useState } from 'react';
import { assessTokenIdentity, getAntiBotBuyLimit } from '@cronos-launchpad/core';
import { Badge } from '../components/Badge';
import { prepareCreateTokenTx } from '../contracts/launchpadClient';
import { getLaunches } from '../data/api';
import { useInjectedWallet } from '../wallet/useInjectedWallet';
import { ToggleRow } from '../components/ToggleRow';

export function CreatePage() {
  const [name, setName] = useState('Cronos Vault');
  const [symbol, setSymbol] = useState('CVLT');
  const [description, setDescription] = useState('A Cronos-native fair launch with protected identity, VVS graduation, and public LP lock receipts.');
  const [graduationTarget, setGraduationTarget] = useState('65,000');
  const [initialBuy, setInitialBuy] = useState('250');
  const [xLink, setXLink] = useState('https://x.com/project');
  const [txHash, setTxHash] = useState<string>();
  const existingIdentities = useMemo(() => getLaunches(), []);
  const wallet = useInjectedWallet();
  const txPreview = useMemo(() => prepareCreateTokenTx({
    name,
    symbol,
    graduationTargetCro: graduationTarget,
    initialBuyCro: initialBuy,
    antiBotEnabled: true,
    lpBeneficiary: wallet.address as `0x${string}` | undefined,
  }), [name, symbol, graduationTarget, initialBuy, wallet.address]);
  const identity = useMemo(() => assessTokenIdentity({ name, symbol }, existingIdentities), [name, symbol, existingIdentities]);
  const currentLimit = getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1_000 });
  const totalCost = Number(initialBuy.replace(/,/g, '') || 0) + 15;
  const txReadiness = txPreview.ready ? 'ready to sign' : `waiting: ${txPreview.missing.join(', ')}`;
  const handleSend = async () => {
    const hash = await wallet.sendTransaction(txPreview);
    if (hash) setTxHash(hash);
  };

  return (
    <section className="panel createV2">
      <div>
        <p className="eyebrow">Create token</p>
        <h2>Guided launch form with immutable-data warnings.</h2>
        <p>Name, ticker, image, and launch links should be treated as immutable after launch. The preflight checks reserved Cronos names, duplicate identities, homoglyph swaps, and near-matches before wallet signing.</p>
        <div className="formGrid">
          <label>Token name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} /></label>
          <label className="wide">Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Graduation target<input value={graduationTarget} onChange={(event) => setGraduationTarget(event.target.value)} /></label>
          <label>Initial buy CRO<input value={initialBuy} onChange={(event) => setInitialBuy(event.target.value)} /></label>
          <label className="wide">X / Website link<input value={xLink} onChange={(event) => setXLink(event.target.value)} /></label>
        </div>
        <div className="toggles"><ToggleRow label="Auto-graduate when reserve fills" /><ToggleRow label="Anti-snipe launch window" /><ToggleRow label="Token tax" enabled={false} /></div>
      </div>
      <div className="createPreviewStack">
        <article className="launchCard previewCard">
          <div className="launchMain"><div className="uploadMock">IMG</div><div><div className="cardTop"><h3>{name || 'Token name'}</h3><span>${symbol || 'TICKER'}</span></div><p className="description">{description}</p><div className="socials"><span>X</span><span>Web</span></div></div></div>
          <div className="progress"><span style={{ width: '0%' }} /></div>
          <div className="badges"><Badge tone="blue">Preview</Badge><Badge tone="good">Anti-snipe</Badge><Badge>No tax</Badge></div>
        </article>
        <div className="terminalCard">
          <h3>Preflight + cost</h3>
          <Badge tone={identity.status === 'available' ? 'good' : identity.status === 'warn' ? 'warn' : 'bad'}>{identity.status}</Badge>
          <dl>
            <dt>Normalized name</dt><dd>{identity.normalizedName}</dd>
            <dt>Normalized symbol</dt><dd>{identity.normalizedSymbol}</dd>
            <dt>Reasons</dt><dd>{identity.reasons.length ? identity.reasons.join(', ') : 'None'}</dd>
            <dt>Minute 3 cap</dt><dd>{currentLimit} CRO max buy</dd>
            <dt>Estimated total</dt><dd>{totalCost.toLocaleString()} CRO incl. mock fee</dd>
            <dt>Tx readiness</dt><dd>{txReadiness}</dd>
            <dt>Calldata</dt><dd>{txPreview.data.slice(0, 18)}…{txPreview.data.slice(-10)}</dd>
          </dl>
          <button className="button primary" disabled={!txPreview.ready || !wallet.isCorrectChain} onClick={handleSend}>Submit create tx</button>
          {wallet.error && <p className="small">Wallet: {wallet.error}</p>}
          {txHash && <p className="small">Tx hash: {txHash}</p>}
        </div>
      </div>
    </section>
  );
}
