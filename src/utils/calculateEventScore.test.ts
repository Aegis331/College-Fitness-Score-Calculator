import { describe, expect, it } from 'vitest';
import { resolveEventScore, scoreDirectEvent, scoreRawEvent } from './calculateEventScore';

describe('event scoring engine', () => {
  it('selects exact and between-threshold rows for higher-is-better values', () => {
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'vitalCapacity', value: 5040 })).toMatchObject({
      baseScore: 100,
      bonusScore: 0,
      totalScore: 100,
    });
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'vitalCapacity', value: 5039 })?.baseScore).toBe(95);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'vitalCapacity', value: 2300 })?.baseScore).toBe(10);
  });

  it('selects the first qualifying row for lower-is-better time values', () => {
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 6.7 })?.baseScore).toBe(100);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 6.71 })?.baseScore).toBe(95);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 7.0 })?.baseScore).toBe(85);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 7.01 })?.baseScore).toBe(80);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 7.1 })?.baseScore).toBe(80);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 7.11 })?.baseScore).toBe(78);
  });

  it('keeps male pull-up scoring on the published discrete rows', () => {
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'pullUp', value: 15 })?.baseScore).toBe(80);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'pullUp', value: 14 })?.baseScore).toBe(76);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'pullUp', value: 13 })?.baseScore).toBe(72);
  });

  it('returns zero below the male lower-year pull-up minimum', () => {
    const score = (value: number) => scoreRawEvent({
      gender: 'male',
      grade: 'year1',
      event: 'pullUp',
      value,
    })?.baseScore;

    expect(score(0)).toBe(0);
    expect(score(1)).toBe(0);
    expect(score(4)).toBe(0);
    expect(score(5)).toBe(10);
  });

  it('returns zero below the male upper-year pull-up minimum', () => {
    const score = (value: number) => scoreRawEvent({
      gender: 'male',
      grade: 'year3',
      event: 'pullUp',
      value,
    })?.baseScore;

    expect(score(0)).toBe(0);
    expect(score(1)).toBe(0);
    expect(score(5)).toBe(0);
    expect(score(6)).toBe(10);
  });

  it('returns zero above the worst lower-is-better threshold', () => {
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 10.1 })?.baseScore).toBe(10);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'fiftyMeter', value: 10.11 })?.baseScore).toBe(0);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'enduranceRun', value: 372 })?.baseScore).toBe(10);
    expect(scoreRawEvent({ gender: 'male', grade: 'year1', event: 'enduranceRun', value: 373 })?.baseScore).toBe(0);
  });

  it('scores both endurance distances as lower-is-better events', () => {
    expect(scoreRawEvent({ gender: 'female', grade: 'year1', event: 'enduranceRun', value: 198 })?.baseScore).toBe(100);
    expect(scoreRawEvent({ gender: 'female', grade: 'year1', event: 'enduranceRun', value: 204 })?.baseScore).toBe(95);
  });

  it('scores BMI using the one-decimal rounded value for male and female boundaries', () => {
    const maleBmi = (value: number) => scoreRawEvent({ gender: 'male', grade: 'year1', event: 'bmi', value })?.baseScore;
    const femaleBmi = (value: number) => scoreRawEvent({ gender: 'female', grade: 'year1', event: 'bmi', value })?.baseScore;

    expect(maleBmi(17.84)).toBe(80);
    expect(maleBmi(17.85)).toBe(100);
    expect(maleBmi(17.89)).toBe(100);
    expect(maleBmi(23.94)).toBe(100);
    expect(maleBmi(23.95)).toBe(80);
    expect(maleBmi(27.94)).toBe(80);
    expect(maleBmi(27.95)).toBe(60);

    expect(maleBmi(17.8)).toBe(80);
    expect(maleBmi(17.9)).toBe(100);
    expect(maleBmi(23.9)).toBe(100);
    expect(maleBmi(24.0)).toBe(80);
    expect(maleBmi(27.9)).toBe(80);
    expect(maleBmi(28.0)).toBe(60);

    expect(femaleBmi(17.14)).toBe(80);
    expect(femaleBmi(17.15)).toBe(100);
    expect(femaleBmi(23.94)).toBe(100);
    expect(femaleBmi(23.95)).toBe(80);
    expect(femaleBmi(27.95)).toBe(60);

    expect(femaleBmi(17.1)).toBe(80);
    expect(femaleBmi(17.2)).toBe(100);
    expect(femaleBmi(23.9)).toBe(100);
    expect(femaleBmi(24.0)).toBe(80);
    expect(femaleBmi(27.9)).toBe(80);
    expect(femaleBmi(28.0)).toBe(60);
  });

  it('does not apply an extra score above the local 100-point rows', () => {
    const pullUp = scoreRawEvent({ gender: 'male', grade: 'year1', event: 'pullUp', value: 29 });
    const run = scoreRawEvent({ gender: 'male', grade: 'year1', event: 'enduranceRun', value: 162 });

    expect(pullUp).toMatchObject({ baseScore: 100, bonusScore: 0, totalScore: 100 });
    expect(run).toMatchObject({ baseScore: 100, bonusScore: 0, totalScore: 100 });
  });

  it('bypasses raw scoring for direct score mode', () => {
    expect(resolveEventScore({
      gender: 'male',
      grade: 'year1',
      event: 'fiftyMeter',
      mode: 'direct',
      rawValue: 1,
      directScore: 85,
    })).toEqual(scoreDirectEvent(85));
    expect(resolveEventScore({
      gender: 'male',
      grade: 'year1',
      event: 'fiftyMeter',
      mode: 'raw',
      rawValue: null,
      directScore: 85,
    })).toBeNull();
  });

  it('rejects direct scores outside the 0-to-100 range at the scoring boundary', () => {
    expect(scoreDirectEvent(0)).not.toBeNull();
    expect(scoreDirectEvent(100)).not.toBeNull();
    expect(scoreDirectEvent(100.01)).toBeNull();
    expect(scoreDirectEvent(106)).toBeNull();
    expect(scoreDirectEvent(-1)).toBeNull();
  });
});
