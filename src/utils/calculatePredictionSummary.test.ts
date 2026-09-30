import { describe, expect, it } from 'vitest';
import { createEmptyYearRecord } from '../types/fitness';
import type { EventEntry, Grade, YearRecord } from '../types/fitness';
import { calculatePredictionSummary } from './calculatePredictionSummary';

function rawEntry(raw: EventEntry['raw']): EventEntry {
  return { mode: 'raw', raw, directScore: null };
}

function completeYear(offset: number): YearRecord {
  const year = createEmptyYearRecord();
  year.bmi = rawEntry({ heightCm: 170, weightKg: 68 + offset });
  year.vitalCapacity = rawEntry(4000 + offset * 100);
  year.fiftyMeter = rawEntry(7.5 - offset * 0.1);
  year.sitAndReach = rawEntry(10 + offset);
  year.standingLongJump = rawEntry(230 + offset * 2);
  year.pullUp = rawEntry(12 + offset);
  year.enduranceRun = rawEntry({ seconds: 250 - offset * 2 });
  return year;
}

function completeYears(): Record<Grade, YearRecord> {
  return {
    year1: completeYear(0),
    year2: completeYear(1),
    year3: completeYear(2),
    year4: completeYear(3),
  };
}

describe('calculatePredictionSummary', () => {
  it('calculates the predicted final score from three real years and a complete predicted year', () => {
    const summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year4',
      years: completeYears(),
      actualYearScores: [82.5, 85.3, 87.1],
    });

    expect(summary.targetGrade).toBe('year4');
    expect(summary.predictedYear.completed).toBe(true);
    expect(summary.predictedFinal?.completed).toBe(true);
    expect(summary.predictedFinal?.firstThreeAverage).toBeCloseTo((82.5 + 85.3 + 87.1) / 3, 10);
    expect(summary.predictedFinal?.score).toBeCloseTo(
      ((82.5 + 85.3 + 87.1) / 3) * 0.5 + (summary.predictedYear.score ?? 0) * 0.5,
      10,
    );
  });

  it('keeps predicted graduation total unavailable when a real year is incomplete', () => {
    const summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year4',
      years: completeYears(),
      actualYearScores: [82.5, null, 87.1],
    });

    expect(summary.predictedYear.completed).toBe(true);
    expect(summary.predictedFinal).toBeNull();
  });

  it('keeps predicted graduation total unavailable when predicted year four is incomplete', () => {
    const years = completeYears();
    years.year2.pullUp = { mode: 'direct', raw: 13, directScore: 80 };

    const summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year4',
      years,
      actualYearScores: [82.5, 85.3, 87.1],
    });

    expect(summary.predictedYear.completed).toBe(false);
    expect(summary.predictedFinal).toBeNull();
  });

  it('does not create a graduation prediction for year two or year three targets', () => {
    const years = completeYears();

    const year2Summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year2',
      years,
      actualYearScores: [82.5, 85.3, 87.1],
    });
    const year3Summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year3',
      years,
      actualYearScores: [82.5, 85.3, 87.1],
    });

    expect(year2Summary.predictedYear.completed).toBe(true);
    expect(year3Summary.predictedYear.completed).toBe(true);
    expect(year2Summary.predictedFinal).toBeNull();
    expect(year3Summary.predictedFinal).toBeNull();
  });

  it('keeps target-year and future data out of a historical prediction summary', () => {
    const years = completeYears();
    years.year1.vitalCapacity = rawEntry(5040);
    years.year2.vitalCapacity = rawEntry(9999);
    years.year3.vitalCapacity = rawEntry(9999);
    years.year4.vitalCapacity = rawEntry(9999);

    const summary = calculatePredictionSummary({
      gender: 'male',
      targetGrade: 'year2',
      years,
      actualYearScores: [82.5, 85.3, 87.1],
    });

    expect(summary.eventResults.vitalCapacity?.rawValues).toEqual([5040]);
    expect(summary.eventResults.vitalCapacity?.normalizedCenter.value).toBe(5040);
  });
});
