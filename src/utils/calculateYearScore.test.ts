import { describe, expect, it } from 'vitest';
import { createEmptyYearRecord, getEventsForGender } from '../types/fitness';
import type { EventEntry, EventId, Gender, YearRecord } from '../types/fitness';
import type { ScoreResult } from '../types/scoring';
import { calculateWeightedYearScore, calculateYearScore } from './calculateYearScore';

function directYear(gender: Gender, score: number): YearRecord {
  const entries = createEmptyYearRecord();
  for (const event of getEventsForGender(gender)) {
    const entry: EventEntry = { mode: 'direct', raw: null, directScore: score };
    entries[event] = entry;
  }
  return entries;
}

function eventScore(baseScore: number): ScoreResult {
  return {
    baseScore,
    bonusScore: 0,
    totalScore: baseScore,
    matchedScore: baseScore,
    sourceId: 'test',
  };
}

function completeEventScores(gender: Gender, score: number): Partial<Record<EventId, ScoreResult>> {
  return Object.fromEntries(getEventsForGender(gender).map((event) => [event, eventScore(score)]));
}

describe('calculateYearScore', () => {
  it('aggregates a complete supplied ScoreResult set with formal weights', () => {
    const result = calculateWeightedYearScore({
      gender: 'male',
      grade: 'year4',
      eventScores: completeEventScores('male', 80),
    });

    expect(result.completed).toBe(true);
    expect(result.completedEvents).toBe(7);
    expect(result.totalEvents).toBe(7);
    expect(result.score).toBeCloseTo(80, 8);
  });

  it('returns a null annual score when one applicable event is absent', () => {
    const eventScores = completeEventScores('female', 80);
    delete eventScores.sitUp;

    const result = calculateWeightedYearScore({ gender: 'female', grade: 'year4', eventScores });

    expect(result.completed).toBe(false);
    expect(result.completedEvents).toBe(6);
    expect(result.totalEvents).toBe(7);
    expect(result.score).toBeNull();
  });

  it('does not re-normalize a five-of-seven partial result', () => {
    const events = getEventsForGender('male');
    const eventScores = Object.fromEntries(events.slice(0, 5).map((event) => [event, eventScore(100)]));

    const result = calculateWeightedYearScore({ gender: 'male', grade: 'year4', eventScores });

    expect(result.completedEvents).toBe(5);
    expect(result.totalEvents).toBe(7);
    expect(result.score).toBeNull();
  });

  it('calculates a complete annual weighted score from mixed direct entries', () => {
    const entries = directYear('male', 100);
    entries.fiftyMeter = { mode: 'direct', raw: null, directScore: 0 };

    const result = calculateYearScore({ gender: 'male', grade: 'year1', entries });

    expect(result.completed).toBe(true);
    expect(result.completedEvents).toBe(7);
    expect(result.score).toBeCloseTo(80, 8);
    expect(result.eventScores.fiftyMeter?.totalScore).toBe(0);
  });

  it('keeps an annual score null while any applicable event is missing', () => {
    const entries = directYear('female', 80);
    entries.sitUp = { mode: 'direct', raw: null, directScore: null };

    const result = calculateYearScore({ gender: 'female', grade: 'year3', entries });

    expect(result.completed).toBe(false);
    expect(result.completedEvents).toBe(6);
    expect(result.score).toBeNull();
  });

  it('does not count invalid raw values or out-of-range direct scores', () => {
    const invalidRawEntries = directYear('male', 80);
    invalidRawEntries.fiftyMeter = { mode: 'raw', raw: -1, directScore: null };

    const invalidRawResult = calculateYearScore({
      gender: 'male',
      grade: 'year1',
      entries: invalidRawEntries,
    });

    expect(invalidRawResult.completed).toBe(false);
    expect(invalidRawResult.completedEvents).toBe(6);

    const invalidDirectEntries = directYear('male', 80);
    invalidDirectEntries.fiftyMeter = { mode: 'direct', raw: null, directScore: 101 };

    const invalidDirectResult = calculateYearScore({
      gender: 'male',
      grade: 'year1',
      entries: invalidDirectEntries,
    });

    expect(invalidDirectResult.completed).toBe(false);
    expect(invalidDirectResult.completedEvents).toBe(6);
  });

  it('keeps the annual maximum at 100 when raw results exceed the 100-point rows', () => {
    const entries = directYear('male', 100);
    entries.pullUp = { mode: 'raw', raw: 29, directScore: null };
    entries.enduranceRun = { mode: 'raw', raw: { seconds: 162 }, directScore: null };

    const result = calculateYearScore({ gender: 'male', grade: 'year1', entries });

    expect(result.score).toBe(100);
  });

  it('keeps a weighted annual score at its standard value', () => {
    const result = calculateYearScore({
      gender: 'male',
      grade: 'year1',
      entries: directYear('male', 85.5),
    });

    expect(result.score).toBe(85.5);
  });

  it('uses the rounded BMI value when scoring a raw height and weight entry', () => {
    const entries = directYear('male', 100);
    entries.bmi = {
      mode: 'raw',
      raw: { heightCm: 100, weightKg: 23.94 },
      directScore: null,
    };

    const result = calculateYearScore({ gender: 'male', grade: 'year1', entries });

    expect(result.eventScores.bmi?.baseScore).toBe(100);
    expect(result.score).toBe(100);
  });
});
