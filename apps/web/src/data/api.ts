import { creatorProfile, holders, launches, proofPackage, trades } from './mock';

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
