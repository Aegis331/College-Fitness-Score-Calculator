import type { EventId } from '../types/fitness';
import type { NormalizedPrediction } from '../types/prediction';
import { getMeasurementSpec, type MeasurementSpec } from '../data/eventMeasurementRules';

function isWithinRange(value: number, spec: MeasurementSpec): boolean {
  if (spec.minimum !== undefined) {
    const meetsMinimum = spec.minimumInclusive === false ? value > spec.minimum : value >= spec.minimum;
    if (!meetsMinimum) {
      return false;
    }
  }

  if (spec.maximum !== undefined) {
    const meetsMaximum = spec.maximumInclusive === false ? value < spec.maximum : value <= spec.maximum;
    if (!meetsMaximum) {
      return false;
    }
  }

  return true;
}

function roundSymmetrically(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const rounded = Math.sign(value) * Math.round(Math.abs(value) * factor) / factor;
  return rounded === 0 ? 0 : rounded;
}

export function normalizePredictedValue(event: EventId, value: number): NormalizedPrediction {
  if (!Number.isFinite(value)) {
    return { available: false, value: null, reason: 'non-finite' };
  }

  const spec = getMeasurementSpec(event);
  if (!isWithinRange(value, spec)) {
    return { available: false, value: null, reason: 'out-of-range' };
  }

  const normalized = roundSymmetrically(value, spec.decimals);
  if (!Number.isFinite(normalized) || !isWithinRange(normalized, spec)) {
    return { available: false, value: null, reason: 'out-of-range' };
  }

  return { available: true, value: normalized };
}
