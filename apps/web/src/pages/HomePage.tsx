import { calculateGraduationProgress } from '@cronos-launchpad/core';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { LaunchCard } from '../components/LaunchCard';
import { Metric } from '../components/Metric';
import { fetchLaunches } from '../data/api';
import { filterLaunches, type ExploreTab } from '../data/exploreFilters';
import type { Launch } from '../data/types';

const filterTabs: { id: ExploreTab; label: string; tone?: 'blue' | 'good' }[] = [
  { id: 'all', label: 'Newest', tone: 'blue' },
  { id: 'launching', label: 'Launching' },
  { id: 'near', label: 'Near graduation' },
  { id: 'graduated', label: 'Graduated' },
  { id: 'no-tax', label: 'No tax', tone: 'good' },
];

export function HomePage() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('all');
  const visibleLaunches = useMemo(() => filterLaunches(launches, { query, tab: activeTab }), [launches, query, activeTab]);
  const leadingProgress = launches.length ? Math.max(...launches.map((launch) => calculateGraduationProgress(BigInt(Math.round(launch.progress * 10)), 1000n))) : 0;
  useEffect(() => {
    let active = true;
    fetchLaunches().then((nextLaunches) => {
      if (active) setLaunches(nextLaunches);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <div className="statusLine"><span className="liveDot" /> CronosForge testnet MVP · VVS-first graduation</div>
          <h1>Forge Cronos meme launches with protection buyers can actually read.</h1>
          <p className="lede">CronosForge is a Cronos-native launchpad for fair launches, protected token identity, anti-snipe windows, visible VVS graduation, and public LP-lock proof.</p>
          <div className="heroActions"><a href="/create" className="button primary">Start protected launch</a><a href="#board" className="button secondary">Explore runners</a></div>
        </div>
        <aside className="heroBoard" aria-label="Launchpad summary">
          <div className="heroLogoLockup"><img src="/assets/cronosforge-logo-inverted.png" alt="CronosForge rocket launch logo" /><span>CronosForge</span></div>
          <div className="tickerTape"><span>Cronos Testnet</span><span>Mainnet coming soon</span><span>Manual graduation</span></div>
          <div className="statsGrid"><Metric label="indexed launches" value={loading ? '…' : String(launches.length)} /><Metric label="top progress" value={`${leadingProgress}%`} /><Metric label="LP lock default" value="180d" /></div>
          <div className="proofCard"><p className="eyebrow">Default trust policy</p><ul><li>Protected token identity with on-chain duplicate and reserved-name checks.</li><li>Launches stay testnet-only until mainnet contracts are configured.</li><li>Graduation is a creator/admin transaction before automated keepers are enabled.</li></ul></div>
        </aside>
      </section>

      <section id="board" className="panel boardPanel">
        <div className="sectionHeader"><div><p className="eyebrow">Explore launches</p><h2>Live board for protected Cronos runners</h2></div></div>
        <div className="filterBar">
          <label className="searchLabel"><span className="srOnly">Search launches</span><input className="searchInput" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search launches" /></label>
          <div className="tabs" role="tablist" aria-label="Launch filters">
            {filterTabs.map((tab) => (
              <button className={`filterTab ${activeTab === tab.id ? 'active' : ''}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button" role="tab" aria-selected={activeTab === tab.id}>
                <Badge tone={activeTab === tab.id ? tab.tone ?? 'blue' : 'neutral'}>{tab.label}</Badge>
              </button>
            ))}
          </div>
        </div>
        <div className="cards">{visibleLaunches.map((launch) => <LaunchCard launch={launch} key={launch.address} />)}</div>
        {!visibleLaunches.length && <div className="miniPanel"><h2>{loading ? 'Loading indexed launches…' : 'No indexed launches yet.'}</h2><p className="lede">Create a Cronos Testnet launch from the current Phase 2 factory or run the indexer after on-chain activity. Demo/sample and old-factory launches are hidden from production because buy/sell/graduation only work on Phase 2 tokens.</p><a className="button primary" href="/create">Create first testnet launch</a></div>}
      </section>
    </>
  );
}
