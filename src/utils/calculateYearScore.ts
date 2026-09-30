import type { EventEntry, EventId, Gender, Grade, RawValue, YearRecord } from '../types/fitness';
import type { ScoreResult, YearScoreSummary } from '../types/scoring';
import { getRuleSet } from '../data/scoringRules';
import { getEventsForGender } from '../types/fitness';
import { calculateBMI } from './calculateBMI';
import { resolveEventScore } from './calculateEventScore';
import { validateEventInput } from './inputValidation';

function rawNumber(event: EventId, raw: RawValue | null): number | null {
  if (raw === null) {
    return null;
  }

  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }

  if (event === 'bmi' && 'heightCm' in raw && 'weightKg' in raw) {
    if (raw.heightCm === null || raw.weightKg === null) {
      return null;
    }

    try {
      return calculateBMI(raw.heightCm, raw.weightKg);
    } catch {
      return null;
    }
  }

  if (event === 'enduranceRun' && 'seconds' in raw) {
    return raw.seconds;
  }

  return null;
}

function scoreEntry(
  gender: Gender,
  grade: Grade,
  event: EventId,
  entry: EventEntry | undefined,
): ScoreResult | null {
  if (!entry) {
    return null;
  }

  const validationErrors = validateEventInput(
    event,
    entry.mode === 'raw' ? entry.raw : null,
    entry.mode === 'direct' ? entry.directScore : null,
  );
  if (validationErrors.length > 0) {
    return null;
  }

  return resolveEventScore({
    gender,
    grade,
    event,
    mode: entry.mode,
    rawValue: rawNumber(event, entry.raw),
    directScore: entry.directScore,
  });
}

export interface CalculateWeightedYearScoreInput {
  gender: Gender;
  grade: Grade;
  eventScores: Partial<Record<EventId, ScoreResult>>;
}

export function calculateWeightedYearScore({
  gender,
  grade,
  eventScores,
}: CalculateWeightedYearScoreInput): YearScoreSummary {
  const events = getEventsForGender(gender);
  const ruleSet = getRuleSet(gender, grade);
  const completedEvents = events.filter((event) => eventScores[event] !== undefined).length;
  const completed = completedEvents === events.length;
  const weightedTotal = events.reduce((total, event) => {
    const result = eventScores[event];
    return result ? total + result.baseScore * (ruleSet.events[event]?.weight ?? 0) : total;
  }, 0);

  return {
    score: completed ? weightedTotal : null,
    completed,
    completedEvents,
    totalEvents: events.length,
    eventScores,
  };
}

export function calculateYearScore(args: {
  gender: Gender;
  grade: Grade;
  entries: YearRecord;
}): YearScoreSummary {
  const events = getEventsForGender(args.gender);
  const eventScores: Partial<Record<EventId, ScoreResult>> = {};

  for (const event of events) {
    const result = scoreEntry(args.gender, args.grade, event, args.entries[event]);
    if (!result) {
      continue;
    }

    eventScores[event] = result;
  }

  return calculateWeightedYearScore({ gender: args.gender, grade: args.grade, eventScores });
}
