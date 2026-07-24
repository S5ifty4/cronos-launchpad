import { Metric } from '../components/Metric';
import { getCreatorProfile } from '../data/api';

export function CreatorPage() {
  const creator = getCreatorProfile();
  return (
    <section className="panel opsGrid">
      <div className="miniPanel"><p className="eyebrow">Creator profile</p><h2>Reputation follows the wallet.</h2><p className="lede">{creator.wallet}</p><div className="creatorStats"><Metric label="tokens launched" value={creator.launches} /><Metric label="graduated" value={creator.graduated} /><Metric label="reports" value={creator.reports} /></div><p className="small">Future creator pages should show reused socials, prior graduations, launch history, and report/dispute count.</p></div>
      <div className="miniPanel"><p className="eyebrow">History</p><h2>{creator.totalVolume} indexed volume.</h2><div className="queueList"><div><span>Recent launch</span><b>Crojack Protocol</b><em>launching</em></div><div><span>Graduated launch</span><b>Blue Chain Gecko</b><em>LP locked</em></div><div><span>Social links</span><b>{creator.socials.join(', ')}</b><em>claimed</em></div></div></div>
    </section>
  );
}
