import { describe, expect, it } from 'vitest';
import { calculateGraduationProgress, getAntiBotBuyLimit } from '../src/index';

describe('launch math', () => {
  it('calculates graduation progress with cap at 100%', () => {
    expect(calculateGraduationProgress(32500n, 65000n)).toBe(50);
    expect(calculateGraduationProgress(70000n, 65000n)).toBe(100);
  });

  it('ramps anti-bot buy limits during protected launch window', () => {
    expect(getAntiBotBuyLimit({ elapsedSeconds: 30, baseLimitCro: 1000 })).toBe(50);
    expect(getAntiBotBuyLimit({ elapsedSeconds: 180, baseLimitCro: 1000 })).toBe(150);
    expect(getAntiBotBuyLimit({ elapsedSeconds: 700, baseLimitCro: 1000 })).toBe(1000);
  });
});
