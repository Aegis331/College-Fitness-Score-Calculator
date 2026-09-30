import { describe, expect, it } from 'vitest';
import type { EventEntry } from '../types/fitness';
import { getActiveRawEventValue } from './extractRawEventValue';

function rawEntry(raw: EventEntry['raw']): EventEntry {
  return { mode: 'raw', raw, directScore: null };
}

describe('getActiveRawEventValue', () => {
  it('returns scalar raw values and endurance seconds without formatting', () => {
    expect(getActiveRawEventValue('vitalCapacity', rawEntry(4200))).toBe(4200);
    expect(getActiveRawEventValue('sitAndReach', rawEntry(-3.2))).toBe(-3.2);
    expect(getActiveRawEventValue('enduranceRun', rawEntry({ seconds: 252 }))).toBe(252);
  });

  it('derives scored BMI from the active year height and weight', () => {
    expect(getActiveRawEventValue('bmi', rawEntry({ heightCm: 170, weightKg: 72 }))).toBe(24.9);
  });

  it('rejects invalid active raw payloads', () => {
    expect(getActiveRawEventValue('vitalCapacity', rawEntry(0))).toBeNull();
    expect(getActiveRawEventValue('vitalCapacity', rawEntry(Number.NaN))).toBeNull();
    expect(getActiveRawEventValue('enduranceRun', rawEntry({ seconds: 0 }))).toBeNull();
    expect(getActiveRawEventValue('bmi', rawEntry({ heightCm: null, weightKg: 72 }))).toBeNull();
  });

  it('ignores direct score mode and hidden stale raw data', () => {
    const staleRaw: EventEntry = { mode: 'direct', raw: 4200, directScore: 85 };

    expect(getActiveRawEventValue('vitalCapacity', staleRaw)).toBeNull();
    expect(getActiveRawEventValue('vitalCapacity', { mode: 'direct', raw: null, directScore: 85 })).toBeNull();
  });
});
