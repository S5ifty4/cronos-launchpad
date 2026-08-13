import { useEffect, useMemo, useState } from 'react';
import { assessTokenIdentity, getAntiBotBuyLimit } from '@cronos-launchpad/core';
import { decodeEventLog, parseAbiItem } from 'viem';
import { usePublicClient } from 'wagmi';
import { Badge } from '../components/Badge';
import { prepareCreateTokenTx } from '../contracts/launchpadClient';
import { fetchLaunches } from '../data/api';
import type { Launch } from '../data/types';
import { uploadTokenImage } from '../data/supabase';
import { useLaunchpadWallet } from '../wallet/useLaunchpadWallet';
import { vvsTestnetContracts, explorerTxUrl, shortAddress } from '../wallet/chains';
import { ToggleRow } from '../components/ToggleRow';
import { normalizeSocialUrl, SocialLinks } from '../components/SocialLinks';

const tokenCreatedEvent = parseAbiItem('event TokenCreated(address indexed token,address indexed creator,string name,string symbol,bytes32 indexed normalizedNameHash,bytes32 normalizedSymbolHash,uint256 totalSupply,uint256 graduationTargetWei,bool antiBotEnabled,address vvsRouter,address wrappedNative,address lpBeneficiary,uint64 lpLockDurationSeconds)');

function tokenCreatedFromLogs(logs: readonly { topics: [] | [`0x${string}`, ...`0x${string}`[]]; data: `0x${string}` }[]) {
  for (const log of logs) {
    if (!log.topics.length) continue;
    try {
      const topics = [...log.topics] as [`0x${string}`, ...`0x${string}`[]];
      const event = decodeEventLog({ abi: [tokenCreatedEvent], topics, data: log.data });
      if (event.eventName === 'TokenCreated') return event.args.token;
    } catch {
      // Ignore non-TokenCreated logs in the same receipt.
    }
  }
  return undefined;
}

async function finalizeLaunchMetadata(body: Record<string, unknown>) {
  const response = await fetch('/api/launch-metadata', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Metadata save failed (${response.status})`);
}

function socialUrl(value: string) {
  return normalizeSocialUrl(value) || undefined;
}

export function CreatePage() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [graduationTarget, setGraduationTarget] = useState('');
  const [initialBuy, setInitialBuy] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [xLink, setXLink] = useState('');
  const [discordLink, setDiscordLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imagePublicUrl, setImagePublicUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imageUploadStatus, setImageUploadStatus] = useState('');
  const [antiBotEnabled, setAntiBotEnabled] = useState(true);
  const [txHash, setTxHash] = useState<string>();
  const [txError, setTxError] = useState<string>();
  const [submittedTxKey, setSubmittedTxKey] = useState<string>();
  const [txStatus, setTxStatus] = useState<'idle' | 'submitted' | 'confirming' | 'confirmed' | 'failed'>('idle');
  const [existingIdentities, setExistingIdentities] = useState<Launch[]>([]);
  const [identityLoading, setIdentityLoading] = useState(true);
  const wallet = useLaunchpadWallet();
  const publicClient = usePublicClient({ chainId: wallet.chainId });
  const txPreview = useMemo(() => prepareCreateTokenTx({
    name,
    symbol,
    graduationTargetCro: graduationTarget,
    initialBuyCro: initialBuy,
    antiBotEnabled,
    vvsRouter: vvsTestnetContracts.smartRouter,
    lpBeneficiary: wallet.address as `0x${string}` | undefined,
  }), [name, symbol, graduationTarget, initialBuy, antiBotEnabled, wallet.address]);
  const identity = useMemo(() => assessTokenIdentity({ name, symbol }, existingIdentities), [name, symbol, existingIdentities]);
  const currentLimit = antiBotEnabled ? getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1_000 }) : undefined;
  const totalCost = Number(initialBuy.replace(/,/g, '') || 0) + 15;
  const txKey = useMemo(() => `${txPreview.to ?? ''}:${txPreview.value.toString()}:${txPreview.data}`, [txPreview.to, txPreview.value, txPreview.data]);
  const submittedThisConfig = Boolean(txHash && submittedTxKey === txKey && txStatus !== 'failed');
  const duplicateBlocked = identity.status === 'blocked';
  const readinessMissing = [...txPreview.missing, ...(identityLoading ? ['live duplicate preflight'] : []), ...(duplicateBlocked ? identity.reasons : [])];
  const txReadiness = submittedThisConfig
    ? txStatus === 'confirmed'
      ? 'confirmed — opening token page'
      : txStatus === 'confirming'
        ? 'submitted — waiting for Cronos confirmation'
        : 'submitted — waiting for wallet/network confirmation'
    : txPreview.ready && !identityLoading && !duplicateBlocked ? 'ready to sign' : `waiting: ${readinessMissing.join(', ')}`;
  const submitDisabled = !txPreview.ready || identityLoading || duplicateBlocked || !wallet.isCorrectChain || wallet.isPending || submittedThisConfig;
  const submitLabel = submittedThisConfig
    ? txStatus === 'confirmed'
      ? 'Launch confirmed'
      : 'Launch submitted'
    : wallet.isPending ? 'Submitting…' : 'Submit create tx';
  const previewSocials = [
    socialUrl(websiteLink) && { platform: 'website' as const, url: socialUrl(websiteLink)! },
    socialUrl(xLink) && { platform: 'x' as const, url: socialUrl(xLink)! },
    socialUrl(discordLink) && { platform: 'discord' as const, url: socialUrl(discordLink)! },
    socialUrl(telegramLink) && { platform: 'telegram' as const, url: socialUrl(telegramLink)! },
  ].filter((link): link is { platform: 'website' | 'x' | 'discord' | 'telegram'; url: string } => Boolean(link));
  useEffect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);
  useEffect(() => {
    let cancelled = false;
    setIdentityLoading(true);
    fetchLaunches()
      .then((launches) => {
        if (!cancelled) setExistingIdentities(launches);
      })
      .catch(() => {
        if (!cancelled) setTxError('Live duplicate preflight could not refresh. Creation remains blocked until launch data loads.');
      })
      .finally(() => {
        if (!cancelled) setIdentityLoading(false);
      });
    return () => { cancelled = true; };
  }, []);
  const handleSend = async () => {
    if (submittedThisConfig) return;
    if (identityLoading) {
      setTxError('Still refreshing live duplicate preflight. Please wait a moment before signing.');
      return;
    }
    if (duplicateBlocked) {
      setTxError(`Preflight blocked this launch: ${identity.reasons.join(', ')}`);
      return;
    }
    setTxError(undefined);
    try {
      if (!publicClient || !txPreview.to) {
        setTxError('Live chain preflight is not ready yet. Please wait and try again.');
        return;
      }
      try {
        await publicClient.call({
          account: wallet.address as `0x${string}` | undefined,
          to: txPreview.to,
          data: txPreview.data,
          value: txPreview.value,
        });
      } catch (error) {
        setTxError(`Live chain preflight blocked this launch before wallet signing: ${error instanceof Error ? error.message : 'transaction would revert'}`);
        return;
      }
      const hash = await wallet.sendTransaction(txPreview);
      if (!hash) return;
      setTxHash(hash);
      setSubmittedTxKey(txKey);
      setTxStatus('submitted');
      if (!publicClient) return;
      setTxStatus('confirming');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        setTxStatus('failed');
        setSubmittedTxKey(undefined);
        setTxError('Transaction reverted on Cronos. You can adjust the form and try again.');
        return;
      }
      const tokenAddress = tokenCreatedFromLogs(receipt.logs);
      setTxStatus('confirmed');
      if (tokenAddress) {
        await finalizeLaunchMetadata({
          tokenAddress,
          chainId: wallet.chainId,
          creatorAddress: wallet.address,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          description,
          imageUrl: imagePublicUrl,
          websiteUrl: socialUrl(websiteLink),
          xUrl: socialUrl(xLink),
          discordUrl: socialUrl(discordLink),
          telegramUrl: socialUrl(telegramLink),
          graduationTargetWei: txPreview.args[5].toString(),
          reserveRaisedWei: txPreview.value.toString(),
          antiBotEnabled,
          vvsRouter: vvsTestnetContracts.smartRouter,
          txHash: hash,
          blockNumber: receipt.blockNumber.toString(),
        }).catch((error) => {
          setTxError(error instanceof Error ? error.message : 'Metadata save failed; token is still confirmed on-chain.');
        });
        window.location.assign(`/token/${tokenAddress}`);
      }
    } catch (error) {
      setTxStatus('failed');
      setSubmittedTxKey(undefined);
      setTxError(error instanceof Error ? error.message : 'Transaction rejected');
    }
  };
  const handleImageChange = async (file?: File) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : '');
    setImagePublicUrl('');
    setImageFileName(file?.name ?? '');
    setImageUploadStatus(file ? 'Uploading image…' : '');
    if (!file) return;
    try {
      const publicUrl = await uploadTokenImage(file);
      if (publicUrl) {
        setImagePreviewUrl(publicUrl);
        setImagePublicUrl(publicUrl);
        setImageUploadStatus('Image uploaded.');
      } else {
        setImageUploadStatus('Image preview ready. Upload will finish when storage is available.');
      }
    } catch {
      setImageUploadStatus('Image upload failed; local preview is still shown.');
    }
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
          <label className="wide imageUploadLabel">Token image<span className="fieldHelp">Upload square artwork for the token card and detail page.</span><span className="filePicker"><span className="button secondary filePickerButton">Choose image</span><span className="filePickerName">{imageFileName || 'No image selected'}</span><input className="srOnly" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void handleImageChange(event.target.files?.[0])} /></span>{imageUploadStatus && <span className="fieldHelp">{imageUploadStatus}</span>}</label>
          <label className="wide">Description<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Graduation target<span className="fieldHelp">CRO reserve needed before VVS graduation.</span><input inputMode="decimal" value={graduationTarget} onChange={(event) => setGraduationTarget(event.target.value)} /></label>
          <label>Initial buy CRO<span className="fieldHelp">Optional first buy sent with token creation.</span><input inputMode="decimal" value={initialBuy} onChange={(event) => setInitialBuy(event.target.value)} /></label>
          <label>Website<input type="url" value={websiteLink} onChange={(event) => setWebsiteLink(event.target.value)} /></label>
          <label>X<input type="url" value={xLink} onChange={(event) => setXLink(event.target.value)} /></label>
          <label>Discord<input type="url" value={discordLink} onChange={(event) => setDiscordLink(event.target.value)} /></label>
          <label>Telegram<input type="url" value={telegramLink} onChange={(event) => setTelegramLink(event.target.value)} /></label>
        </div>
        <div className="toggles">
          <ToggleRow
            label="Graduation enabled at reserve target"
            enabled
            disabled
            info="When the CRO reserve reaches the graduation target, the launch becomes eligible to graduate into the configured VVS route and send LP into the timelock vault. v0 does not fully auto-submit that transaction yet; a graduation transaction still has to be called after the target is met."
          />
          <ToggleRow
            label="Anti-snipe launch window"
            enabled={antiBotEnabled}
            onChange={setAntiBotEnabled}
            info="Optional first-10-minute buy-limit window. Current v0 calldata uses 600 seconds: first 2 minutes cap buys at 5% of the base limit, minutes 2–5 at 15%, minutes 5–10 at 35%, then the full base limit."
          />
          <ToggleRow
            label="Token tax"
            enabled={false}
            disabled
            info="Token tax is disabled for v0. CronosForge launches are currently no-tax so buyers do not need to reason about hidden transfer fees."
          />
        </div>
      </div>
      <div className="createPreviewStack">
        <article className="launchCard previewCard">
          <div className="launchMain"><div className="uploadMock">{imagePreviewUrl ? <img src={imagePreviewUrl} alt="Token preview" /> : 'IMG'}</div><div><div className="cardTop"><h3>{name || 'Token name'}</h3><span>{symbol ? `$${symbol}` : '$TICKER'}</span></div>{description && <p className="description">{description}</p>}<SocialLinks socials={previewSocials} /></div></div>
          <div className="progress"><span style={{ width: '0%' }} /></div>
          <div className="badges"><Badge tone="blue">Preview</Badge>{antiBotEnabled && <Badge tone="good">Anti-snipe</Badge>}<Badge>No tax</Badge></div>
        </article>
        <div className="terminalCard">
          <h3>Preflight + cost</h3>
          <Badge tone={identity.status === 'available' ? 'good' : identity.status === 'warn' ? 'warn' : 'bad'}>{identity.status}</Badge>
          <dl>
            <dt>Normalized name</dt><dd>{identity.normalizedName}</dd>
            <dt>Normalized symbol</dt><dd>{identity.normalizedSymbol}</dd>
            <dt>Reasons</dt><dd>{identity.reasons.length ? identity.reasons.join(', ') : 'None'}</dd>
            <dt>Anti-snipe cap</dt><dd>{currentLimit ? `${currentLimit} CRO max buy at minute 3` : 'Disabled for this launch'}</dd>
            <dt>Estimated total</dt><dd>{totalCost.toLocaleString()} CRO incl. launch fee</dd>
            <dt>Tx readiness</dt><dd>{txReadiness}</dd>
            <dt>Calldata</dt><dd>{txPreview.data.slice(0, 18)}…{txPreview.data.slice(-10)}</dd>
          </dl>
          <button className="button primary" disabled={submitDisabled} onClick={handleSend}>{submitLabel}</button>
          {wallet.error && <p className="small">Wallet: {wallet.error}</p>}
          {txError && <p className="small">Wallet: {txError}</p>}
          {txHash && <p className="small">Tx hash: <a href={explorerTxUrl(txHash, wallet.chainId)} target="_blank" rel="noreferrer">{shortAddress(txHash)} ↗</a></p>}
          {submittedThisConfig && <p className="small">Do not submit this form again. After confirmation we open the token page; Explore updates once the launch is available.</p>}
        </div>
      </div>
    </section>
  );
}
