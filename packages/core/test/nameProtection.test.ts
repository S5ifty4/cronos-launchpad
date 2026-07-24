import { describe, expect, it } from 'vitest';
import { assessTokenIdentity, normalizeTokenName, normalizeTokenSymbol } from '../src/index';

const existing = [
  { name: 'Blue Gecko', symbol: 'BGECKO', address: '0x1111111111111111111111111111111111111111' },
  { name: 'Baby NOOGLE', symbol: 'BNOOGLE', address: '0x2222222222222222222222222222222222222222' },
];

describe('anti-vamp identity protection', () => {
  it('normalizes names and symbols for exact on-chain-style uniqueness', () => {
    expect(normalizeTokenName('  Blue   Gecko!! ')).toBe('blue gecko');
    expect(normalizeTokenSymbol(' bg3cko ')).toBe('BGECKO');
  });

  it('blocks exact duplicate normalized names and symbols', () => {
    const result = assessTokenIdentity({ name: 'blue gecko', symbol: 'BGECKO' }, existing);
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('DUPLICATE_NAME');
    expect(result.reasons).toContain('DUPLICATE_SYMBOL');
  });

  it('blocks reserved Cronos ecosystem impersonation names', () => {
    const result = assessTokenIdentity({ name: 'Cronos', symbol: 'CRO' }, existing);
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('RESERVED_NAME');
    expect(result.reasons).toContain('RESERVED_SYMBOL');
  });

  it('blocks homoglyph name collisions because they normalize to the same protected name', () => {
    const result = assessTokenIdentity({ name: 'Blu3 Gecko', symbol: 'BLUEG' }, existing);
    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('DUPLICATE_NAME');
    expect(result.matches[0]?.symbol).toBe('BGECKO');
  });

  it('warns on fuzzy near-miss names that are not exact normalized duplicates', () => {
    const result = assessTokenIdentity({ name: 'Blue Geckos', symbol: 'BLUEG' }, existing);
    expect(result.status).toBe('warn');
    expect(result.reasons).toContain('SIMILAR_NAME');
  });
});
