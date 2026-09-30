import { describe, expect, it } from 'vitest';
import { calculateBMI, roundBMIForScoring } from './calculateBMI';

describe('calculateBMI', () => {
  it('calculates BMI from centimetres and kilograms', () => {
    expect(calculateBMI(181, 95)).toBeCloseTo(28.9978938, 6);
    expect(calculateBMI(100, 23.94)).toBeCloseTo(23.94, 12);
  });

  it('rounds BMI to one decimal with stable half-up boundaries', () => {
    expect(roundBMIForScoring(17.84)).toBe(17.8);
    expect(roundBMIForScoring(17.85)).toBe(17.9);
    expect(roundBMIForScoring(17.89)).toBe(17.9);
    expect(roundBMIForScoring(23.94)).toBe(23.9);
    expect(roundBMIForScoring(23.95)).toBe(24.0);
    expect(roundBMIForScoring(27.94)).toBe(27.9);
    expect(roundBMIForScoring(27.95)).toBe(28.0);
  });

  it('does not hide invalid physical measurements', () => {
    expect(() => calculateBMI(0, 95)).toThrow('身高必须大于 0');
    expect(() => calculateBMI(181, -1)).toThrow('体重必须大于 0');
  });
});
