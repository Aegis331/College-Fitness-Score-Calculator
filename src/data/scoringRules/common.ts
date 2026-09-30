import type { EventId, Gender } from '../../types/fitness';
import type { EventRule, RuleSet, Threshold } from '../../types/scoring';
import { REFERENCE_SOURCE } from './metadata';

export const WEIGHTS = {
  bmi: 0.15,
  vitalCapacity: 0.15,
  fiftyMeter: 0.2,
  sitAndReach: 0.1,
  standingLongJump: 0.1,
  strength: 0.1,
  enduranceRun: 0.2,
} as const;

export function rows(values: Array<[number, number]>): Threshold[] {
  return values.map(([value, score]) => ({ value, score }));
}

export function numericRule(
  event: EventId,
  unit: string,
  weight: number,
  direction: 'higher-is-better' | 'lower-is-better',
  thresholds: Threshold[],
): EventRule {
  return { event, unit, weight, direction, thresholds };
}

export function bmiRule(gender: Gender): EventRule {
  const normalMin = gender === 'male' ? 17.9 : 17.2;
  const lowMax = gender === 'male' ? 17.8 : 17.1;

  return {
    event: 'bmi',
    unit: 'kg/m²',
    weight: WEIGHTS.bmi,
    direction: 'range',
    thresholds: [],
    ranges: [
      { min: Number.NEGATIVE_INFINITY, max: lowMax, score: 80 },
      { min: normalMin, max: 23.9, score: 100 },
      { min: 24, max: 27.9, score: 80 },
      { min: 28, max: Number.POSITIVE_INFINITY, score: 60 },
    ],
  };
}

export function createRuleSet(
  gender: Gender,
  gradeBand: 'lower' | 'upper',
  events: Partial<Record<EventId, EventRule>>,
): RuleSet {
  return {
    id: `${gender}-${gradeBand}-2014-reference`,
    gender,
    gradeBand,
    source: REFERENCE_SOURCE,
    events,
  };
}
