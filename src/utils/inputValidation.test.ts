import { describe, expect, it } from 'vitest';
import type { BmiRawValue } from '../types/fitness';
import { validateEventInput } from './inputValidation';

describe('fitness input validation', () => {
  it('validates BMI ranges and required fields', () => {
    const invalidBmi: BmiRawValue = { heightCm: 90, weightKg: 301 };
    const errors = validateEventInput('bmi', invalidBmi, null);

    expect(errors).toEqual(expect.arrayContaining(['身高应在 100～250 cm 之间', '体重应在 20～300 kg 之间']));
  });

  it('validates positive measurements and non-negative integer repetitions', () => {
    expect(validateEventInput('vitalCapacity', 0, null)).toContain('肺活量必须大于 0');
    expect(validateEventInput('fiftyMeter', -1, null)).toContain('50 米跑必须大于 0');
    expect(validateEventInput('pullUp', 2.5, null)).toContain('引体向上必须为非负整数');
    expect(validateEventInput('sitAndReach', -3.2, null)).toEqual([]);
  });

  it('validates run seconds and direct score bounds', () => {
    expect(validateEventInput('enduranceRun', { seconds: 0 }, null)).toContain('耐力跑时间必须大于 0');
    expect(validateEventInput('fiftyMeter', 8, 101)).toContain('直接得分应在 0～100 分之间');
    expect(validateEventInput('pullUp', null, 0)).toEqual([]);
    expect(validateEventInput('pullUp', null, 100)).toEqual([]);
    expect(validateEventInput('pullUp', null, 100.01)).toContain('直接得分应在 0～100 分之间');
    expect(validateEventInput('pullUp', null, 106)).toContain('直接得分应在 0～100 分之间');
    expect(validateEventInput('pullUp', null, -1)).toContain('直接得分应在 0～100 分之间');
    expect(validateEventInput('fiftyMeter', null, 85)).toEqual([]);
  });
});
