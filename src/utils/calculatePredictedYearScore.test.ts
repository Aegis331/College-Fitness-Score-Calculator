import { describe, expect, it } from 'vitest';
import { createEmptyYearRecord, getEventsForGender } from '../types/fitness';
import type { EventEntry, Gender, Grade, YearRecord } from '../types/fitness';
import { calculatePredictedYearScore } from './calculatePredictedYearScore';

function rawEntry(raw: EventEntry['raw']): EventEntry {
  return { mode: 'raw', raw, directScore: null };
}

function completeYear(gender: Gender, offset: number): YearRecord {
  const year = createEmptyYearRecord();
  year.bmi = rawEntry({ heightCm: 170, weightKg: 68 + offset });
  year.vitalCapacity = rawEntry(4000 + offset * 100);
  year.fiftyMeter = rawEntry(7.5 - offset * 0.1);
  year.sitAndReach = rawEntry(10 + offset);
  year.standingLongJump = rawEntry(230 + offset * 2);
  year.enduranceRun = rawEntry({ seconds: 250 - offset * 2 });
  if (gender === 'male') {
    year.pullUp = rawEntry(12 + offset);
  } else {
    year.sitUp = rawEntry(40 + offset);
  }
  return year;
}

function completeYears(gender: Gender): Record<Grade, YearRecord> {
  return {
    year1: completeYear(gender, 0),
    year2: completeYear(gender, 1),
    year3: completeYear(gender, 2),
    year4: completeYear(gender, 3),
  };
}

describe('calculatePredictedYearScore', () => {
  it('produces a year-four score only when all seven male events are predictable', () => {
    const result = calculatePredictedYearScore({ gender: 'male', targetGrade: 'year4', years: completeYears('male') });

    expect(result.totalEvents).toBe(7);
    expect(result.predictableEvents).toBe(7);
    expect(result.completed).toBe(true);
    expect(result.score).not.toBeNull();
    expect(Object.keys(result.eventResults)).toHaveLength(7);
  });

  it('keeps the predicted year score null for five of seven predictable events', () => {
    const years = completeYears('male');
    years.year2.pullUp = { mode: 'direct', raw: 12, directScore: 80 };
    years.year2.enduranceRun = { mode: 'direct', raw: { seconds: 248 }, directScore: 80 };

    const result = calculatePredictedYearScore({ gender: 'male', targetGrade: 'year4', years });

    expect(result.predictableEvents).toBe(5);
    expect(result.totalEvents).toBe(7);
    expect(result.completed).toBe(false);
    expect(result.score).toBeNull();
  });

  it('uses the gender-specific seven-event set', () => {
    const maleResult = calculatePredictedYearScore({ gender: 'male', targetGrade: 'year4', years: completeYears('male') });
    const femaleResult = calculatePredictedYearScore({ gender: 'female', targetGrade: 'year4', years: completeYears('female') });

    expect(maleResult.totalEvents).toBe(getEventsForGender('male').length);
    expect(femaleResult.totalEvents).toBe(getEventsForGender('female').length);
    expect(maleResult.eventResults.pullUp).toBeDefined();
    expect(maleResult.eventResults.sitUp).toBeUndefined();
    expect(femaleResult.eventResults.sitUp).toBeDefined();
    expect(femaleResult.eventResults.pullUp).toBeUndefined();
  });

  it('uses the target grade for predicted event scoring and weighted aggregation', () => {
    const years = completeYears('male');
    years.year1.vitalCapacity = rawEntry(5040);
    years.year2.vitalCapacity = rawEntry(5040);
    years.year3.vitalCapacity = rawEntry(5140);

    const year2Result = calculatePredictedYearScore({ gender: 'male', targetGrade: 'year2', years });
    const year3Result = calculatePredictedYearScore({ gender: 'male', targetGrade: 'year3', years });

    expect(year2Result.targetGrade).toBe('year2');
    expect(year3Result.targetGrade).toBe('year3');
    expect(year2Result.eventResults.vitalCapacity?.predictedEventScore).toMatchObject({
      baseScore: 100,
      sourceId: 'male-lower-2014-reference:vitalCapacity',
    });
    expect(year3Result.eventResults.vitalCapacity?.predictedEventScore).toMatchObject({
      baseScore: 95,
      sourceId: 'male-upper-2014-reference:vitalCapacity',
    });
    expect(year2Result.completed).toBe(true);
    expect(year3Result.completed).toBe(true);
  });
});
