import { describe, expect, it } from 'vitest';
import { analyzeHistoryConsistency } from './analyzeHistoryConsistency';

describe('analyzeHistoryConsistency', () => {
  it('does not flag a consistent three-year direction reversal', () => {
    expect(analyzeHistoryConsistency('vitalCapacity', [100, 120, 140])).toEqual({
      recentChange: 20,
      historyVolatile: false,
    });
  });

  it('flags a reversal when both adjacent changes exceed the event tolerance', () => {
    expect(analyzeHistoryConsistency('vitalCapacity', [100, 140, 135])).toEqual({
      recentChange: -5,
      historyVolatile: true,
    });
  });

  it('ignores a reversal made only of changes at the minimum recorded unit', () => {
    expect(analyzeHistoryConsistency('vitalCapacity', [100, 101, 100])).toEqual({
      recentChange: -1,
      historyVolatile: false,
    });
  });

  it('uses BMI precision for volatility and keeps the recent BMI change', () => {
    expect(analyzeHistoryConsistency('bmi', [26.9, 20.9, 30.9])).toEqual({
      recentChange: 10,
      historyVolatile: true,
    });
  });

  it('reports an adjacent recent change without declaring volatility for incomplete history', () => {
    expect(analyzeHistoryConsistency('vitalCapacity', [100, 130, null])).toEqual({
      recentChange: 30,
      historyVolatile: false,
    });
  });
});
