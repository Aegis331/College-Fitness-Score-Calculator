import type { EventId, Gender, Grade, InputMode } from '../types/fitness';
import type { EventRule, ScoreResult, Threshold } from '../types/scoring';
import { getRuleSet } from '../data/scoringRules';
import { roundBMIForScoring } from './calculateBMI';

const PRECISION = 1000;
const MAX_DIRECT_SCORE = 100;

function normalized(value: number): number {
  return Math.round(value * PRECISION);
}

function selectThreshold(rule: EventRule, value: number): Threshold | null {
  if (rule.direction === 'range') {
    const matchingRange = [...(rule.ranges ?? [])]
      .sort((left, right) => left.max - right.max)
      .find((range) => value <= range.max);
    return matchingRange ? { value, score: matchingRange.score } : null;
  }

  const thresholds = [...rule.thresholds].sort((left, right) => left.value - right.value);
  if (thresholds.length === 0) {
    return null;
  }

  if (rule.direction === 'higher-is-better') {
    const qualifying = thresholds.filter((threshold) => normalized(threshold.value) <= normalized(value));
    return qualifying.at(-1) ?? { value, score: 0 };
  }

  const qualifying = thresholds.filter((threshold) => normalized(threshold.value) >= normalized(value));
  return qualifying[0] ?? { value, score: 0 };
}

export function scoreRawEvent(args: {
  gender: Gender;
  grade: Grade;
  event: EventId;
  value: number;
}): ScoreResult | null {
  if (!Number.isFinite(args.value)) {
    return null;
  }

  const ruleSet = getRuleSet(args.gender, args.grade);
  const rule = ruleSet.events[args.event];
  if (!rule) {
    return null;
  }

  const scoringValue = args.event === 'bmi' ? roundBMIForScoring(args.value) : args.value;
  const matched = selectThreshold(rule, scoringValue);
  if (!matched) {
    return null;
  }

  return {
    baseScore: matched.score,
    bonusScore: 0,
    totalScore: matched.score,
    matchedScore: matched.score,
    sourceId: `${ruleSet.id}:${args.event}`,
  };
}

export function scoreDirectEvent(
  score: number,
  sourceId = 'direct-input',
): ScoreResult | null {
  if (!Number.isFinite(score) || score < 0 || score > MAX_DIRECT_SCORE) {
    return null;
  }

  return {
    baseScore: score,
    bonusScore: 0,
    totalScore: score,
    matchedScore: score,
    sourceId,
  };
}

export function resolveEventScore(args: {
  gender: Gender;
  grade: Grade;
  event: EventId;
  mode: InputMode;
  rawValue: number | null;
  directScore: number | null;
}): ScoreResult | null {
  const ruleSet = getRuleSet(args.gender, args.grade);
  const rule = ruleSet.events[args.event];
  if (!rule) {
    return null;
  }

  if (args.mode === 'direct') {
    return args.directScore === null ? null : scoreDirectEvent(args.directScore);
  }

  return args.rawValue === null
    ? null
    : scoreRawEvent({
        gender: args.gender,
        grade: args.grade,
        event: args.event,
        value: args.rawValue,
      });
}
