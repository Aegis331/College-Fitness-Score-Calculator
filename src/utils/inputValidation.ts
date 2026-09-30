import type { EventId, RawValue } from '../types/fitness';
import {
  BMI_INPUT_FIELD_SPECS,
  getMeasurementSpec,
  type MeasurementFieldSpec,
  type MeasurementSpec,
} from '../data/eventMeasurementRules';

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function validateDirectScore(event: EventId, score: number | null): string[] {
  if (score === null) {
    return [];
  }

  const max = 100;
  if (!Number.isFinite(score) || score < 0 || score > max) {
    return [`直接得分应在 0～${max} 分之间`];
  }

  return [];
}

function isWithinRange(value: number, spec: MeasurementSpec | MeasurementFieldSpec): boolean {
  if (spec.minimum !== undefined) {
    const minimumInclusive = 'minimumInclusive' in spec ? spec.minimumInclusive !== false : true;
    const meetsMinimum = minimumInclusive ? value >= spec.minimum : value > spec.minimum;
    if (!meetsMinimum) {
      return false;
    }
  }

  if (spec.maximum !== undefined && value > spec.maximum) {
    return false;
  }

  return true;
}

export function validateEventInput(
  event: EventId,
  rawValue: RawValue | null,
  directScore: number | null,
): string[] {
  const errors = validateDirectScore(event, directScore);

  if (rawValue === null) {
    return directScore === null ? [...errors, '请输入成绩'] : errors;
  }

  if (event === 'bmi') {
    if (typeof rawValue !== 'object' || 'heightCm' in rawValue === false || 'weightKg' in rawValue === false) {
      return [...errors, '请输入身高和体重'];
    }

    const height = numberValue(rawValue.heightCm);
    const weight = numberValue(rawValue.weightKg);
    if (height === null || !isWithinRange(height, BMI_INPUT_FIELD_SPECS.heightCm)) {
      errors.push('身高应在 100～250 cm 之间');
    }
    if (weight === null || !isWithinRange(weight, BMI_INPUT_FIELD_SPECS.weightKg)) {
      errors.push('体重应在 20～300 kg 之间');
    }
    return errors;
  }

  if (event === 'enduranceRun') {
    if (typeof rawValue !== 'object' || 'seconds' in rawValue === false) {
      return [...errors, '请输入耐力跑时间'];
    }

    const seconds = numberValue(rawValue.seconds);
    if (seconds === null || !isWithinRange(seconds, getMeasurementSpec(event)) || !Number.isInteger(seconds)) {
      errors.push('耐力跑时间必须大于 0');
    }
    return errors;
  }

  const value = numberValue(rawValue);
  if (value === null) {
    return [...errors, '请输入有效数字'];
  }

  if (event === 'pullUp' || event === 'sitUp') {
    if (!isWithinRange(value, getMeasurementSpec(event)) || !Number.isInteger(value)) {
      errors.push(`${event === 'pullUp' ? '引体向上' : '仰卧起坐'}必须为非负整数`);
    }
  } else if (event === 'vitalCapacity' && !isWithinRange(value, getMeasurementSpec(event))) {
    errors.push('肺活量必须大于 0');
  } else if (event === 'fiftyMeter' && !isWithinRange(value, getMeasurementSpec(event))) {
    errors.push('50 米跑必须大于 0');
  } else if (event === 'standingLongJump' && !isWithinRange(value, getMeasurementSpec(event))) {
    errors.push('立定跳远必须大于 0');
  }

  return errors;
}
