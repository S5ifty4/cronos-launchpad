import { filterPhase2OrNewerLaunches } from '../contracts/launchpadClient';
import { creatorProfile, launches, proofPackage } from './mock';
import { fetchSupabaseHolderSnapshots, fetchSupabaseLaunchByAddress, fetchSupabaseLaunches, fetchSupabaseLaunchTrades } from './supabase';
import type { HolderSnapshot, Launch, Trade } from './types';

const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const enableDemoFallback = import.meta.env.VITE_ENABLE_DEMO_FALLBACK === 'true';

async function fetchOptional<T>(path: string): Promise<T | null> {
  if (!apiBase) return null;
  try {
    const response = await fetch(`${apiBase}${path}`);
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export function getLaunches() {
  return enableDemoFallback ? launches : [];
}

export function getDemoLaunchesForTests() {
  return launches;
}

export function getLaunchByAddress(address?: string) {
  if (!enableDemoFallback) return undefined;
  return launches.find((launch) => launch.address.toLowerCase() === address?.toLowerCase());
}

export function getCreatorProfile() {
  return creatorProfile;
}

export function getProofPackage() {
  return proofPackage;
}

export async function fetchLaunches(): Promise<Launch[]> {
  const supabaseLaunches = await fetchSupabaseLaunches();
  if (supabaseLaunches) return filterPhase2OrNewerLaunches(supabaseLaunches);
  const apiLaunches = await fetchOptional<Launch[]>('/launches');
  if (apiLaunches) return filterPhase2OrNewerLaunches(apiLaunches);
  return enableDemoFallback ? launches : [];
}

export async function fetchLaunchByAddress(address: string): Promise<Launch | null> {
  const supabaseLaunch = await fetchSupabaseLaunchByAddress(address);
  if (supabaseLaunch) return (await filterPhase2OrNewerLaunches([supabaseLaunch]))[0] ?? null;
  const apiLaunch = await fetchOptional<Launch>(`/launches/${address}`);
  if (apiLaunch) return (await filterPhase2OrNewerLaunches([apiLaunch]))[0] ?? null;
  return getLaunchByAddress(address) ?? null;
}

export async function fetchLaunchTrades(address: string): Promise<Trade[]> {
  const supabaseTrades = await fetchSupabaseLaunchTrades(address);
  if (supabaseTrades) return supabaseTrades;
  const apiTrades = await fetchOptional<Trade[]>(`/launches/${address}/trades`);
  return apiTrades ?? [];
}

export async function fetchLaunchHolders(address: string): Promise<HolderSnapshot[]> {
  const supabaseHolders = await fetchSupabaseHolderSnapshots(address);
  if (supabaseHolders) return supabaseHolders;
  const apiHolders = await fetchOptional<HolderSnapshot[]>(`/launches/${address}/holders`);
  return apiHolders ?? [];
}

export function fetchCreatorProfile(wallet: string) {
  return fetchOptional(`/creators/${wallet}`).then((profile) => profile ?? creatorProfile);
}

export function fetchProofPackage() {
  return fetchOptional('/proof').then((proof) => proof ?? proofPackage);
}
