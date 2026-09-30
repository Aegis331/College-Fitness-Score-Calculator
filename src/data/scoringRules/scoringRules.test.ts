import { describe, expect, it } from 'vitest';
import type { Gender, Grade } from '../../types/fitness';
import { getRuleSet } from './index';

const grades: Grade[] = ['year1', 'year2', 'year3', 'year4'];

describe('source scoring rule registry', () => {
  it('provides seven applicable weighted events for every gender and grade', () => {
    for (const gender of ['male', 'female'] as Gender[]) {
      for (const grade of grades) {
        const ruleSet = getRuleSet(gender, grade);
        const rules = Object.values(ruleSet.events).filter(Boolean);
        expect(rules).toHaveLength(7);
        expect(rules.reduce((sum, rule) => sum + (rule?.weight ?? 0), 0)).toBeCloseTo(1, 8);
        expect(ruleSet.source.url).toBe('/docs/scoring-standards/国家学生体质健康标准评分表.pdf');
      }
    }
  });

  it('keeps gender-specific events separate', () => {
    const maleEvents = Object.keys(getRuleSet('male', 'year1').events);
    const femaleEvents = Object.keys(getRuleSet('female', 'year1').events);

    expect(maleEvents).toContain('pullUp');
    expect(maleEvents).not.toContain('sitUp');
    expect(femaleEvents).toContain('sitUp');
    expect(femaleEvents).not.toContain('pullUp');
  });

  it('preserves lower and upper year thresholds from the reference table', () => {
    const maleLower = getRuleSet('male', 'year1');
    const maleUpper = getRuleSet('male', 'year3');

    expect(maleLower.id).not.toBe(maleUpper.id);
    expect(maleLower.events.fiftyMeter?.thresholds[0]).toEqual({ value: 6.7, score: 100 });
    expect(maleUpper.events.fiftyMeter?.thresholds[0]).toEqual({ value: 6.6, score: 100 });
    expect(maleLower.events.enduranceRun?.thresholds[0]).toEqual({ value: 197, score: 100 });
    expect(maleLower.events.pullUp?.thresholds).not.toContainEqual({ value: 16, score: 78 });
  });

  it('keeps the configured BMI ranges without bonus rules', () => {
    const female = getRuleSet('female', 'year1');
    const bmi = female.events.bmi;
    const sitUp = female.events.sitUp;

    expect(bmi?.ranges).toEqual(expect.arrayContaining([
      { min: 17.2, max: 23.9, score: 100 },
      { min: 28, max: Number.POSITIVE_INFINITY, score: 60 },
    ]));
    expect(sitUp).not.toHaveProperty('bonusRules');
  });
});
