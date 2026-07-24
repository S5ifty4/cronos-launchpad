const adminQueue = [['Reserved-name review', 'CRO Bank', 'blocked'], ['Similar-symbol warning', 'CR0X', 'needs review'], ['Report queue', '2 launch reports', 'open']];

export function AdminPage() {
  return <section className="panel opsGrid"><div className="miniPanel"><p className="eyebrow">Admin queue</p><h2>Moderation surface for anti-vamp enforcement.</h2><div className="queueList">{adminQueue.map(([type, subject, state]) => <div key={subject}><span>{type}</span><b>{subject}</b><em>{state}</em></div>)}</div></div><div className="miniPanel"><p className="eyebrow">Actions</p><h2>Protect identity without slowing launches.</h2><p>Operators can reserve ecosystem names, review similar-symbol warnings, mark disputed launches, and resolve reports while preserving on-chain facts.</p></div></section>;
}
