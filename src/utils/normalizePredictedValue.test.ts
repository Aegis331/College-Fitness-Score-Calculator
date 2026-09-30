import { describe, expect, it } from 'vitest';
import { normalizePredictedValue } from './normalizePredictedValue';

describe('normalizePredictedValue', () => {
  it('rounds count predictions to the nearest integer', () => {
    expect(normalizePredictedValue('pullUp', 12.67)).toEqual({ available: true, value: 13 });
    expect(normalizePredictedValue('sitUp', 23.49)).toEqual({ available: true, value: 23 });
  });

  it('preserves event-specific decimal precision and units', () => {
    expect(normalizePredictedValue('fiftyMeter', 12.345)).toEqual({ available: true, value: 12.35 });
    expect(normalizePredictedValue('enduranceRun', 252.6)).toEqual({ available: true, value: 253 });
    expect(normalizePredictedValue('bmi', 23.96)).toEqual({ available: true, value: 24 });
  });

  it('rounds negative sit-and-reach values symmetrically and keeps them valid', () => {
    expect(normalizePredictedValue('sitAndReach', -3.25)).toEqual({ available: true, value: -3.3 });
  });

  it('rejects configured lower-bound violations without clamping', () => {
    expect(normalizePredictedValue('fiftyMeter', 0)).toEqual({ available: false, value: null, reason: 'out-of-range' });
    expect(normalizePredictedValue('vitalCapacity', -1)).toEqual({ available: false, value: null, reason: 'out-of-range' });
    expect(normalizePredictedValue('pullUp', -1)).toEqual({ available: false, value: null, reason: 'out-of-range' });
  });

  it('rejects non-finite predictions', () => {
    expect(normalizePredictedValue('bmi', Number.NaN)).toEqual({ available: false, value: null, reason: 'non-finite' });
    expect(normalizePredictedValue('enduranceRun', Number.POSITIVE_INFINITY)).toEqual({ available: false, value: null, reason: 'non-finite' });
  });

  it('does not invent an upper bound where current raw rules define none', () => {
    expect(normalizePredictedValue('vitalCapacity', 100000)).toEqual({ available: true, value: 100000 });
  });
});
