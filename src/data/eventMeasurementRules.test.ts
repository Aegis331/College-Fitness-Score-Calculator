import { describe, expect, it } from 'vitest';
import type { EventId } from '../types/fitness';
import {
  BMI_INPUT_FIELD_SPECS,
  EVENT_MEASUREMENT_SPECS,
  TIME_INPUT_FIELD_SPECS,
  getMeasurementSpec,
} from './eventMeasurementRules';

describe('event measurement rules', () => {
  it('defines storage units, precision and explicit range semantics for every raw event', () => {
    const expected: Record<EventId, Partial<typeof EVENT_MEASUREMENT_SPECS[EventId]>> = {
      bmi: { storageUnit: 'bmi', decimals: 1 },
      vitalCapacity: { storageUnit: 'mL', decimals: 0, minimum: 0, minimumInclusive: false },
      fiftyMeter: { storageUnit: 'seconds', decimals: 2, minimum: 0, minimumInclusive: false },
      sitAndReach: { storageUnit: 'cm', decimals: 1 },
      standingLongJump: { storageUnit: 'cm', decimals: 0, minimum: 0, minimumInclusive: false },
      pullUp: { storageUnit: 'count', decimals: 0, minimum: 0, minimumInclusive: true },
      sitUp: { storageUnit: 'count', decimals: 0, minimum: 0, minimumInclusive: true },
      enduranceRun: { storageUnit: 'seconds', decimals: 0, minimum: 0, minimumInclusive: false },
    };

    for (const [event, fields] of Object.entries(expected) as [EventId, typeof expected[EventId]][]) {
      expect(getMeasurementSpec(event)).toMatchObject(fields);
      expect(EVENT_MEASUREMENT_SPECS[event].rounding).toBe('nearest');
    }
  });

  it('keeps BMI and time input field constraints in the shared source', () => {
    expect(BMI_INPUT_FIELD_SPECS.heightCm).toMatchObject({ decimals: 1, step: 0.1, minimum: 100, maximum: 250 });
    expect(BMI_INPUT_FIELD_SPECS.weightKg).toMatchObject({ decimals: 1, step: 0.1, minimum: 20, maximum: 300 });
    expect(TIME_INPUT_FIELD_SPECS.minutes).toMatchObject({ decimals: 0, step: 1, minimum: 0 });
    expect(TIME_INPUT_FIELD_SPECS.seconds).toMatchObject({ decimals: 0, step: 1, minimum: 0, maximum: 59 });
  });
});
