import { calculateGraduationProgress } from '@cronos-launchpad/core';
import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { LaunchCard } from '../components/LaunchCard';
import { Metric } from '../components/Metric';
import { getLaunches } from '../data/api';
import { filterLaunches, type ExploreTab } from '../data/exploreFilters';

const filterTabs: { id: ExploreTab; label: string; tone?: 'blue' | 'good' }[] = [
  { id: 'all', label: 'Newest', tone: 'blue' },
  { id: 'launching', label: 'Launching' },
  { id: 'near', label: 'Near graduation' },
  { id: 'graduated', label: 'Graduated' },
  { id: 'no-tax', label: 'No tax', tone: 'good' },
];

export function HomePage() {
  const launches = getLaunches();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('all');
  const visibleLaunches = useMemo(() => filterLaunches(launches, { query, tab: activeTab }), [launches, query, activeTab]);
  const demoProgress = calculateGraduationProgress(57_330n, 65_000n);
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
          <div className="tickerTape"><span>0x8...c5a2 bought 222 CRO</span><span>MVVS 88.2% to VVS</span><span>CROF launched 6m ago</span></div>
          <div className="statsGrid"><Metric label="sample launches" value={String(launches.length)} /><Metric label="runner progress" value={`${demoProgress}%`} /><Metric label="LP lock default" value="180d" /></div>
          <div className="proofCard"><p className="eyebrow">Default trust policy</p><ul><li>Duplicate normalized names and symbols blocked on-chain.</li><li>CRO, Cronos, VVS, Crypto.com, Tectonic, and Fulcrom reserved.</li><li>Graduation seeds VVS-compatible liquidity and locks LP.</li></ul></div>
        </aside>
      </section>

      <section id="board" className="panel boardPanel">
        <div className="sectionHeader"><div><p className="eyebrow">Explore launches</p><h2>Live board UX for protected Cronos runners</h2></div><div className="viewControls"><button>Grid</button><button>{visibleLaunches.length} shown</button><button>Filters</button></div></div>
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
        <div className="cards">{visibleLaunches.map((launch) => <LaunchCard launch={launch} key={launch.symbol} />)}</div>
        {!visibleLaunches.length && <p className="small">No launches match this filter yet.</p>}
      </section>
    </>
  );
}
