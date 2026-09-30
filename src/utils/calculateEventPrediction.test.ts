import { describe, expect, it } from 'vitest';
import type { EventEntry, Grade, RawValue } from '../types/fitness';
import { calculateEventPrediction } from './calculateEventPrediction';

function rawEntry(raw: RawValue | null): EventEntry {
  return { mode: 'raw', raw, directScore: null };
}

function entriesFor(eventValues: readonly [RawValue | null, RawValue | null, RawValue | null]): Record<Grade, EventEntry> {
  return {
    year1: rawEntry(eventValues[0]),
    year2: rawEntry(eventValues[1]),
    year3: rawEntry(eventValues[2]),
    year4: rawEntry(null),
  };
}

describe('calculateEventPrediction', () => {
  it('creates a complete higher-is-better prediction from three raw years', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor([100, 130, 135]),
    });

    expect(result.availability).toEqual({ status: 'complete' });
    expect(result.rawValues).toEqual([100, 130, 135]);
    expect(result.recentChange).toBe(5);
    expect(result.forecast).toMatchObject({ hold: 135, recent: 140, long: 152.5, center: 142.5 });
    expect(result.normalizedCenter).toEqual({ available: true, value: 143 });
    expect(result.trendStatus).toBe('improving');
    expect(result.historyVolatile).toBe(false);
    expect(result.predictedEventScore?.sourceId).toBe('male-upper-2014-reference:vitalCapacity');
  });

  it('uses the recent x2 to x3 change for higher-is-better semantics', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor([100, 140, 135]),
    });

    expect(result.trendStatus).toBe('declining');
    expect(result.recentChange).toBe(-5);
    expect(result.historyVolatile).toBe(true);
  });

  it('uses lower-is-better semantics without reversing forecast arithmetic', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'enduranceRun',
      targetGrade: 'year4',
      entries: entriesFor([{ seconds: 300 }, { seconds: 260 }, { seconds: 265 }]),
    });

    expect(result.forecast?.recent).toBe(270);
    expect(result.trendStatus).toBe('declining');
    expect(result.predictedEventScore).not.toBeNull();
  });

  it('derives BMI history and predicts BMI without a direction label', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'bmi',
      targetGrade: 'year4',
      entries: entriesFor([
        { heightCm: 100, weightKg: 27.2 },
        { heightCm: 100, weightKg: 26.1 },
        { heightCm: 100, weightKg: 24.8 },
      ]),
    });

    expect(result.rawValues).toEqual([27.2, 26.1, 24.8]);
    expect(result.trendStatus).toBe('decreasing');
    expect(result.historyVolatile).toBe(false);
    expect(result.normalizedCenter).toEqual({ available: true, value: 24 });
    expect(result.predictedEventScore?.baseScore).toBe(80);
  });

  it.each([
    ['year1', [null, 130, 135], { status: 'recent-change-only' }, 5],
    ['year2', [100, null, 135], { status: 'insufficient-data', missingYears: ['year2'] }, null],
    ['year3', [100, 130, null], { status: 'recent-change-only' }, 30],
  ] as const)('does not create a formal forecast when %s is missing', (_missingYear, values, expectedAvailability, expectedRecentChange) => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor(values),
    });

    expect(result.availability).toEqual(expectedAvailability);
    expect(result.recentChange).toBe(expectedRecentChange);
    expect(result.forecast).toBeNull();
    expect(result.predictedEventScore).toBeNull();
  });

  it('shows recent change for two adjacent years but not a formal forecast', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor([100, 130, null]),
    });

    expect(result.availability).toEqual({ status: 'recent-change-only' });
    expect(result.recentChange).toBe(30);
    expect(result.forecast).toBeNull();
    expect(result.predictedEventScore).toBeNull();
  });

  it('does not bridge a year1/year3 gap', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor([100, null, 135]),
    });

    expect(result.availability).toEqual({ status: 'insufficient-data', missingYears: ['year2'] });
    expect(result.forecast).toBeNull();
  });

  it('rejects direct mode even when a stale raw value remains', () => {
    const entries = entriesFor([100, 130, 135]);
    entries.year2 = { mode: 'direct', raw: 130, directScore: 85 };

    const result = calculateEventPrediction({ gender: 'male', event: 'vitalCapacity', targetGrade: 'year4', entries });

    expect(result.availability).toEqual({ status: 'unavailable', reason: 'direct-mode' });
    expect(result.forecast).toBeNull();
    expect(result.predictedEventScore).toBeNull();
  });

  it('rejects malformed active raw data', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year4',
      entries: entriesFor([100, Number.NaN, 135]),
    });

    expect(result.availability).toEqual({ status: 'unavailable', reason: 'invalid-raw' });
    expect(result.predictedEventScore).toBeNull();
  });

  it('rejects an extrapolated prediction below the configured event minimum', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'pullUp',
      targetGrade: 'year4',
      entries: entriesFor([5, 1, 0]),
    });

    expect(result.availability).toEqual({ status: 'unavailable', reason: 'out-of-range' });
    expect(result.normalizedCenter.available).toBe(false);
    expect(result.predictedEventScore).toBeNull();
  });

  it('uses the year4 raw scoring rule for the predicted event score', () => {
    const result = calculateEventPrediction({
      gender: 'male',
      event: 'pullUp',
      targetGrade: 'year4',
      entries: entriesFor([14, 15, 16]),
    });

    expect(result.normalizedCenter.value).toBe(17);
    expect(result.predictedEventScore).toMatchObject({
      baseScore: 85,
      sourceId: 'male-upper-2014-reference:pullUp',
    });
  });

  it('predicts year two from year one only, ignoring target and future records', () => {
    const entries = entriesFor([5040, 999, 500]);
    entries.year2 = { mode: 'direct', raw: 999, directScore: 88 };
    entries.year4 = rawEntry(900);

    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year2',
      entries,
    });

    expect(result.rawValues).toEqual([5040]);
    expect(result.forecast).toMatchObject({ hold: 5040, center: 5040, scenarioMin: 5040, scenarioMax: 5040 });
    expect(result.recentChange).toBeNull();
    expect(result.predictedEventScore).toMatchObject({
      baseScore: 100,
      sourceId: 'male-lower-2014-reference:vitalCapacity',
    });
  });

  it('predicts year three from years one and two, ignoring the target and future records', () => {
    const entries = entriesFor([5040, 5040, 5140]);
    entries.year3 = { mode: 'direct', raw: 5140, directScore: 88 };
    entries.year4 = rawEntry(900);

    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year3',
      entries,
    });

    expect(result.rawValues).toEqual([5040, 5040]);
    expect(result.forecast).toMatchObject({ hold: 5040, recent: 5040, center: 5040, scenarioMin: 5040, scenarioMax: 5040 });
    expect(result.predictedEventScore).toMatchObject({
      baseScore: 95,
      sourceId: 'male-upper-2014-reference:vitalCapacity',
    });
  });

  it('rejects a direct historical record within the years allowed for the target', () => {
    const entries = entriesFor([5040, 5040, 5140]);
    entries.year2 = { mode: 'direct', raw: 5040, directScore: 88 };

    const result = calculateEventPrediction({
      gender: 'male',
      event: 'vitalCapacity',
      targetGrade: 'year3',
      entries,
    });

    expect(result.availability).toEqual({ status: 'unavailable', reason: 'direct-mode' });
    expect(result.predictedEventScore).toBeNull();
  });
});
