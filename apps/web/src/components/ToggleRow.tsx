export function ToggleRow({ label, enabled = true }: { label: string; enabled?: boolean }) {
  return <div className="toggleRow"><span>{label}</span><i className={enabled ? 'toggle on' : 'toggle'} /></div>;
}
