import { creatorProfile, holders, launches, proofPackage, trades } from './mock';

const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

async function fetchOrFallback<T>(path: string, fallback: T): Promise<T> {
  if (!apiBase) return fallback;
  try {
    const response = await fetch(`${apiBase}${path}`);
    if (!response.ok) return fallback;
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

export function getLaunches() {
  return launches;
}

export function getLaunchByAddress(address?: string) {
  return launches.find((launch) => launch.address.toLowerCase() === address?.toLowerCase()) ?? launches[0]!;
}

export function getLaunchTrades() {
  return trades;
}

export function getLaunchHolders() {
  return holders;
}

export function getCreatorProfile() {
  return creatorProfile;
}

export function getProofPackage() {
  return proofPackage;
}

export function fetchLaunches() {
  return fetchOrFallback('/launches', launches);
}

export function fetchLaunchByAddress(address: string) {
  return fetchOrFallback(`/launches/${address}`, getLaunchByAddress(address));
}

export function fetchLaunchTrades(address: string) {
  return fetchOrFallback(`/launches/${address}/trades`, trades);
}

export function fetchLaunchHolders(address: string) {
  return fetchOrFallback(`/launches/${address}/holders`, holders);
}

export function fetchCreatorProfile(wallet: string) {
  return fetchOrFallback(`/creators/${wallet}`, creatorProfile);
}

export function fetchProofPackage() {
  return fetchOrFallback('/proof', proofPackage);
}
