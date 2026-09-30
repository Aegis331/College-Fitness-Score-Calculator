import { describe, expect, it } from 'vitest';
import { calculateFinalScore } from './calculateFinalScore';

describe('calculateFinalScore', () => {
  it('applies the first-three-average and fourth-year 50/50 formula', () => {
    const result = calculateFinalScore([80, 82, 84, 90]);

    expect(result.firstThreeAverage).toBe(82);
    expect(result.score).toBe(86);
    expect(result.completed).toBe(true);
  });

  it('keeps full precision until the final score is displayed', () => {
    const result = calculateFinalScore([82.5, 85.3, 87.1, 90.2]);

    expect(result.firstThreeAverage).toBeCloseTo(84.96666666666667, 12);
    expect(result.score).toBeCloseTo(87.58333333333334, 12);
    expect(result.firstThreeAverage).not.toBe(84.97);
  });

  it('shows the first-three average without inventing a final score', () => {
    const result = calculateFinalScore([80, 82, 84, null]);

    expect(result.firstThreeAverage).toBe(82);
    expect(result.score).toBeNull();
    expect(result.completed).toBe(false);
  });

  it('keeps the final result incomplete when an earlier year is missing', () => {
    expect(calculateFinalScore([80, null, 84, 90])).toEqual({
      firstThreeAverage: null,
      score: null,
      completed: false,
    });
  });
});
