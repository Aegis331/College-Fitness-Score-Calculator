import { describe, expect, it } from 'vitest';
import { calculateBmiTrendStatus, calculateTrendStatus } from './calculateTrendStatus';

describe('calculateTrendStatus', () => {
  it('uses the recent x2 to x3 change for higher-is-better events', () => {
    expect(calculateTrendStatus({ direction: 'higher-is-better', previous: 130, latest: 135, stableTolerance: 0.1 })).toBe('improving');
    expect(calculateTrendStatus({ direction: 'higher-is-better', previous: 140, latest: 135, stableTolerance: 0.1 })).toBe('declining');
  });

  it('mirrors the recent change for lower-is-better events', () => {
    expect(calculateTrendStatus({ direction: 'lower-is-better', previous: 280, latest: 275, stableTolerance: 1 })).toBe('improving');
    expect(calculateTrendStatus({ direction: 'lower-is-better', previous: 270, latest: 275, stableTolerance: 1 })).toBe('declining');
  });

  it('classifies changes within the configured tolerance as stable', () => {
    expect(calculateTrendStatus({ direction: 'higher-is-better', previous: 135, latest: 135, stableTolerance: 0.1 })).toBe('stable');
    expect(calculateTrendStatus({ direction: 'higher-is-better', previous: 135, latest: 135.05, stableTolerance: 0.1 })).toBe('stable');
  });

  it('describes BMI movement without calling it improvement or decline', () => {
    expect(calculateBmiTrendStatus(26.1, 24.8, 0.1)).toBe('decreasing');
    expect(calculateBmiTrendStatus(24.8, 26.1, 0.1)).toBe('increasing');
    expect(calculateBmiTrendStatus(25, 25.05, 0.1)).toBe('stable');
  });
});
