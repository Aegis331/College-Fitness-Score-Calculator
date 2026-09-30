import type { BmiRawValue, EventEntry, EventId, RawValue, TimeRawValue } from '../types/fitness';
import { calculateBMI, roundBMIForScoring } from './calculateBMI';
import { validateEventInput } from './inputValidation';

function isBmiRawValue(value: RawValue | null): value is BmiRawValue {
  return typeof value === 'object' && value !== null && 'heightCm' in value && 'weightKg' in value;
}

function isTimeRawValue(value: RawValue | null): value is TimeRawValue {
  return typeof value === 'object' && value !== null && 'seconds' in value;
}

export function getActiveRawEventValue(event: EventId, entry: EventEntry): number | null {
  if (entry.mode !== 'raw' || entry.raw === null) {
    return null;
  }

  if (validateEventInput(event, entry.raw, null).length > 0) {
    return null;
  }

  if (event === 'bmi' && isBmiRawValue(entry.raw) && entry.raw.heightCm !== null && entry.raw.weightKg !== null) {
    try {
      const bmi = calculateBMI(entry.raw.heightCm, entry.raw.weightKg);
      const rounded = roundBMIForScoring(bmi);
      return Number.isFinite(rounded) ? rounded : null;
    } catch {
      return null;
    }
  }

  if (event === 'enduranceRun' && isTimeRawValue(entry.raw)) {
    return typeof entry.raw.seconds === 'number' && Number.isFinite(entry.raw.seconds)
      ? entry.raw.seconds
      : null;
  }

  return typeof entry.raw === 'number' && Number.isFinite(entry.raw) ? entry.raw : null;
}
