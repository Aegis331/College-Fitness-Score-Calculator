import { describe, expect, it } from 'vitest';
import { calculateTrendPrediction } from './calculateTrendPrediction';

describe('calculateTrendPrediction', () => {
  it('keeps a completely stable sequence stable', () => {
    expect(calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [70, 70, 70] })).toEqual({
      hold: 70,
      recent: 70,
      long: 70,
      center: 70,
      scenarioMin: 70,
      scenarioMax: 70,
    });
  });

  it('uses a one-point hold estimate for year two', () => {
    expect(calculateTrendPrediction({ targetGrade: 'year2', historicalValues: [100] })).toEqual({
      hold: 100,
      recent: null,
      long: null,
      center: 100,
      scenarioMin: 100,
      scenarioMax: 100,
    });
  });

  it('averages hold and recent estimates for year three', () => {
    expect(calculateTrendPrediction({ targetGrade: 'year3', historicalValues: [100, 110] })).toEqual({
      hold: 110,
      recent: 120,
      long: null,
      center: 115,
      scenarioMin: 110,
      scenarioMax: 120,
    });
  });

  it('combines hold, recent and long forecasts for an increasing sequence', () => {
    const result = calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [100, 110, 120] });

    expect(result).toMatchObject({ hold: 120, recent: 130, long: 130, scenarioMin: 120, scenarioMax: 130 });
    expect(result?.center).toBeCloseTo(126.6666666667, 8);
  });

  it('preserves a decreasing numeric direction without reversing it', () => {
    const result = calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [300, 280, 260] });

    expect(result).toMatchObject({ hold: 260, recent: 240, long: 240, scenarioMin: 240, scenarioMax: 260 });
    expect(result?.center).toBeCloseTo(246.6666666667, 8);
  });

  it('keeps recent and long forecasts distinct when the trend changes', () => {
    const result = calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [100, 130, 135] });

    expect(result).toMatchObject({ hold: 135, recent: 140, long: 152.5, scenarioMin: 135, scenarioMax: 152.5 });
    expect(result?.center).toBeCloseTo(142.5, 8);
  });

  it('rejects non-finite model inputs', () => {
    expect(calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [Number.NaN, 1, 2] })).toBeNull();
    expect(calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [1, Number.POSITIVE_INFINITY, 2] })).toBeNull();
    expect(calculateTrendPrediction({ targetGrade: 'year4', historicalValues: [1, 2, Number.NEGATIVE_INFINITY] })).toBeNull();
  });
});
