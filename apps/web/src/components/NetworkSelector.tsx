import { cronosMainnet, cronosTestnet } from '../wallet/chains';

export function NetworkSelector() {
  return (
    <label className="networkSelector">
      <span>Network</span>
      <select value={cronosTestnet.id} aria-label="Select Cronos network" onChange={(event) => {
        if (event.currentTarget.value !== String(cronosTestnet.id)) event.currentTarget.value = String(cronosTestnet.id);
      }}>
        <option value={cronosTestnet.id}>{cronosTestnet.name}</option>
        <option value={cronosMainnet.id} disabled>{cronosMainnet.name} — coming soon</option>
      </select>
    </label>
  );
}
