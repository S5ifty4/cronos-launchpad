export type ExistingToken = {
  name: string;
  symbol: string;
  address?: string;
};

export type IdentityReason =
  | 'DUPLICATE_NAME'
  | 'DUPLICATE_SYMBOL'
  | 'RESERVED_NAME'
  | 'RESERVED_SYMBOL'
  | 'SIMILAR_NAME'
  | 'SIMILAR_SYMBOL';

export type IdentityAssessment = {
  status: 'available' | 'warn' | 'blocked';
  reasons: IdentityReason[];
  normalizedName: string;
  normalizedSymbol: string;
  matches: ExistingToken[];
};

const HOMOGLYPH_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  'с': 'c',
  'о': 'o',
  'р': 'p',
  'а': 'a',
  'е': 'e',
  'х': 'x',
  'у': 'y',
};

const RESERVED_NAMES = new Set([
  'cro',
  'cronos',
  'crypto com',
  'cryptocom',
  'vvs',
  'vvs finance',
  'tectonic',
  'fulcrom',
]);

const RESERVED_SYMBOLS = new Set(['CRO', 'WCRO', 'VVS', 'TONIC', 'FUL', 'PACK']);

function foldHomoglyphs(input: string): string {
  return Array.from(input)
    .map((ch) => HOMOGLYPH_MAP[ch] ?? HOMOGLYPH_MAP[ch.toLowerCase()] ?? ch)
    .join('');
}

export function normalizeTokenName(input: string): string {
  return foldHomoglyphs(input)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeTokenSymbol(input: string): string {
  return foldHomoglyphs(input)
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function compactName(input: string): string {
  return normalizeTokenName(input).replace(/\s+/g, '');
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[a.length]![b.length]!;
}

function isSimilarName(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5) return false;
  const distance = levenshtein(a, b);
  const threshold = Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.2));
  return distance <= threshold;
}

export function assessTokenIdentity(candidate: { name: string; symbol: string }, existing: ExistingToken[]): IdentityAssessment {
  const normalizedName = normalizeTokenName(candidate.name);
  const normalizedSymbol = normalizeTokenSymbol(candidate.symbol);
  const candidateCompactName = compactName(candidate.name);
  const reasons = new Set<IdentityReason>();
  const matches: ExistingToken[] = [];

  if (RESERVED_NAMES.has(normalizedName) || RESERVED_NAMES.has(candidateCompactName)) reasons.add('RESERVED_NAME');
  if (RESERVED_SYMBOLS.has(normalizedSymbol)) reasons.add('RESERVED_SYMBOL');

  for (const token of existing) {
    const tokenName = normalizeTokenName(token.name);
    const tokenSymbol = normalizeTokenSymbol(token.symbol);
    const tokenCompact = compactName(token.name);
    let matched = false;

    if (tokenName === normalizedName || tokenCompact === candidateCompactName) {
      reasons.add('DUPLICATE_NAME');
      matched = true;
    }
    if (tokenSymbol === normalizedSymbol) {
      reasons.add('DUPLICATE_SYMBOL');
      matched = true;
    }
    if (!matched && isSimilarName(candidateCompactName, tokenCompact)) {
      reasons.add('SIMILAR_NAME');
      matched = true;
    }
    if (!matched && normalizedSymbol.length >= 3 && levenshtein(normalizedSymbol, tokenSymbol) === 1) {
      reasons.add('SIMILAR_SYMBOL');
      matched = true;
    }
    if (matched) matches.push(token);
  }

  const reasonList = Array.from(reasons);
  const blockedReasons: IdentityReason[] = ['DUPLICATE_NAME', 'DUPLICATE_SYMBOL', 'RESERVED_NAME', 'RESERVED_SYMBOL'];
  const status = reasonList.some((reason) => blockedReasons.includes(reason)) ? 'blocked' : reasonList.length > 0 ? 'warn' : 'available';

  return { status, reasons: reasonList, normalizedName, normalizedSymbol, matches };
}

export function calculateGraduationProgress(reserveRaised: bigint, graduationTarget: bigint): number {
  if (graduationTarget <= 0n) throw new Error('graduationTarget must be greater than zero');
  if (reserveRaised <= 0n) return 0;
  const basisPoints = (reserveRaised * 10_000n) / graduationTarget;
  return Number(basisPoints > 10_000n ? 10_000n : basisPoints) / 100;
}

export function getAntiBotBuyLimit({ elapsedSeconds, baseLimitCro }: { elapsedSeconds: number; baseLimitCro: number }): number {
  if (elapsedSeconds < 0) throw new Error('elapsedSeconds cannot be negative');
  if (baseLimitCro <= 0) throw new Error('baseLimitCro must be positive');
  if (elapsedSeconds < 120) return Math.max(1, Math.floor(baseLimitCro * 0.05));
  if (elapsedSeconds < 300) return Math.max(1, Math.floor(baseLimitCro * 0.15));
  if (elapsedSeconds < 600) return Math.max(1, Math.floor(baseLimitCro * 0.35));
  return baseLimitCro;
}
