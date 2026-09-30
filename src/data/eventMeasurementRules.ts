import type { EventId } from '../types/fitness';

export type MeasurementStorageUnit = 'mL' | 'seconds' | 'cm' | 'count' | 'bmi';
export type MeasurementRounding = 'nearest';

export interface MeasurementSpec {
  event: EventId;
  storageUnit: MeasurementStorageUnit;
  decimals: number;
  rounding: MeasurementRounding;
  minimum?: number;
  minimumInclusive?: boolean;
  maximum?: number;
  maximumInclusive?: boolean;
}

export interface MeasurementFieldSpec {
  decimals: number;
  step: number;
  minimum?: number;
  maximum?: number;
}

export const EVENT_MEASUREMENT_SPECS: Readonly<Record<EventId, MeasurementSpec>> = {
  bmi: { event: 'bmi', storageUnit: 'bmi', decimals: 1, rounding: 'nearest' },
  vitalCapacity: {
    event: 'vitalCapacity',
    storageUnit: 'mL',
    decimals: 0,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: false,
  },
  fiftyMeter: {
    event: 'fiftyMeter',
    storageUnit: 'seconds',
    decimals: 2,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: false,
  },
  sitAndReach: {
    event: 'sitAndReach',
    storageUnit: 'cm',
    decimals: 1,
    rounding: 'nearest',
  },
  standingLongJump: {
    event: 'standingLongJump',
    storageUnit: 'cm',
    decimals: 0,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: false,
  },
  pullUp: {
    event: 'pullUp',
    storageUnit: 'count',
    decimals: 0,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: true,
  },
  sitUp: {
    event: 'sitUp',
    storageUnit: 'count',
    decimals: 0,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: true,
  },
  enduranceRun: {
    event: 'enduranceRun',
    storageUnit: 'seconds',
    decimals: 0,
    rounding: 'nearest',
    minimum: 0,
    minimumInclusive: false,
  },
};

export const BMI_INPUT_FIELD_SPECS: Readonly<{
  heightCm: MeasurementFieldSpec;
  weightKg: MeasurementFieldSpec;
}> = {
  heightCm: { decimals: 1, step: 0.1, minimum: 100, maximum: 250 },
  weightKg: { decimals: 1, step: 0.1, minimum: 20, maximum: 300 },
};

export const TIME_INPUT_FIELD_SPECS: Readonly<{
  minutes: MeasurementFieldSpec;
  seconds: MeasurementFieldSpec;
}> = {
  minutes: { decimals: 0, step: 1, minimum: 0 },
  seconds: { decimals: 0, step: 1, minimum: 0, maximum: 59 },
};

export function getMeasurementSpec(event: EventId): MeasurementSpec {
  return EVENT_MEASUREMENT_SPECS[event];
}
