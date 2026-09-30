import type { EventId, Gender } from '../types/fitness';
import { getRuleSet } from '../data/scoringRules';
import { getMeasurementSpec } from '../data/eventMeasurementRules';
import type {
  HistoricalEventEntries,
  NormalizedPrediction,
  PredictionAvailability,
  PredictionTargetGrade,
  PredictedEventResult,
  TrendStatus,
} from '../types/prediction';
import { getPredictionHistoryGrades } from '../types/prediction';
import { getActiveRawEventValue } from './extractRawEventValue';
import { calculateTrendPrediction } from './calculateTrendPrediction';
import { normalizePredictedValue } from './normalizePredictedValue';
import { calculateBmiTrendStatus, calculateTrendStatus } from './calculateTrendStatus';
import { analyzeHistoryConsistency } from './analyzeHistoryConsistency';
import { scoreRawEvent } from './calculateEventScore';

function unavailableNormalization(): NormalizedPrediction {
  return { available: false, value: null };
}

function createUnavailableResult(
  event: EventId,
  availability: PredictionAvailability,
  rawValues: Array<number | null>,
  recentChange: number | null = null,
  historyVolatile = false,
): PredictedEventResult {
  return {
    event,
    availability,
    rawValues,
    recentChange,
    forecast: null,
    normalizedCenter: unavailableNormalization(),
    normalizedScenarioMin: unavailableNormalization(),
    normalizedScenarioMax: unavailableNormalization(),
    historyVolatile,
    trendStatus: null,
    predictedEventScore: null,
  };
}

function calculateTrendStatusForEvent(
  gender: Gender,
  event: EventId,
  targetGrade: PredictionTargetGrade,
  previous: number,
  latest: number,
): TrendStatus | 'decreasing' | 'increasing' | 'stable' | null {
  const stableTolerance = 10 ** -getMeasurementSpec(event).decimals;
  if (event === 'bmi') {
    return calculateBmiTrendStatus(previous, latest, stableTolerance);
  }

  const direction = getRuleSet(gender, targetGrade).events[event]?.direction;
  if (direction !== 'higher-is-better' && direction !== 'lower-is-better') {
    return null;
  }

  return calculateTrendStatus({ direction, previous, latest, stableTolerance });
}

export interface CalculateEventPredictionInput {
  gender: Gender;
  event: EventId;
  targetGrade: PredictionTargetGrade;
  entries: HistoricalEventEntries;
}

export function calculateEventPrediction({
  gender,
  event,
  targetGrade,
  entries,
}: CalculateEventPredictionInput): PredictedEventResult {
  const historicalGrades = getPredictionHistoryGrades(targetGrade);
  const historicalEntries = historicalGrades.map((grade) => entries[grade]);
  const rawValues = historicalEntries.map((entry) => getActiveRawEventValue(event, entry));
  const directYear = historicalEntries.find((entry) => entry.mode === 'direct');

  if (directYear) {
    return createUnavailableResult(event, { status: 'unavailable', reason: 'direct-mode' }, rawValues);
  }

  const invalidRaw = historicalEntries.some((entry, index) => entry.raw !== null && rawValues[index] === null);
  if (invalidRaw) {
    return createUnavailableResult(event, { status: 'unavailable', reason: 'invalid-raw' }, rawValues);
  }

  const historyAnalysis = analyzeHistoryConsistency(event, rawValues);
  const completeHistory = rawValues.every((value): value is number => value !== null);
  if (!completeHistory) {
    const hasFirstPairOnly = rawValues.length === 3
      && rawValues[0] !== null
      && rawValues[1] !== null
      && rawValues[2] === null;
    const hasRecentPairOnly = rawValues.length === 3
      && rawValues[0] === null
      && rawValues[1] !== null
      && rawValues[2] !== null;

    if (hasFirstPairOnly || hasRecentPairOnly) {
      return createUnavailableResult(
        event,
        { status: 'recent-change-only' },
        rawValues,
        historyAnalysis.recentChange,
      );
    }

    return createUnavailableResult(event, {
      status: 'insufficient-data',
      missingYears: historicalGrades.filter((_, index) => rawValues[index] === null),
    }, rawValues);
  }

  const forecast = calculateTrendPrediction({ targetGrade, historicalValues: rawValues });
  if (!forecast) {
    return createUnavailableResult(event, { status: 'unavailable', reason: 'invalid-raw' }, rawValues, historyAnalysis.recentChange);
  }

  const normalizedCenter = normalizePredictedValue(event, forecast.center);
  const normalizedScenarioMin = normalizePredictedValue(event, forecast.scenarioMin);
  const normalizedScenarioMax = normalizePredictedValue(event, forecast.scenarioMax);
  const previous = rawValues.at(-2);
  const latest = rawValues.at(-1)!;
  const trendStatus = previous === undefined
    ? null
    : calculateTrendStatusForEvent(gender, event, targetGrade, previous, latest);

  if (
    !normalizedCenter.available || normalizedCenter.value === null
    || !normalizedScenarioMin.available || normalizedScenarioMin.value === null
    || !normalizedScenarioMax.available || normalizedScenarioMax.value === null
  ) {
    return {
      event,
      availability: { status: 'unavailable', reason: 'out-of-range' },
      rawValues,
      recentChange: historyAnalysis.recentChange,
      forecast,
      normalizedCenter,
      normalizedScenarioMin,
      normalizedScenarioMax,
      historyVolatile: historyAnalysis.historyVolatile,
      trendStatus,
      predictedEventScore: null,
    };
  }

  const predictedEventScore = scoreRawEvent({
    gender,
    grade: targetGrade,
    event,
    value: normalizedCenter.value,
  });

  if (!predictedEventScore) {
    return {
      event,
      availability: { status: 'unavailable', reason: 'out-of-range' },
      rawValues,
      recentChange: historyAnalysis.recentChange,
      forecast,
      normalizedCenter,
      normalizedScenarioMin,
      normalizedScenarioMax,
      historyVolatile: historyAnalysis.historyVolatile,
      trendStatus,
      predictedEventScore: null,
    };
  }

  return {
    event,
    availability: { status: 'complete' },
    rawValues,
    recentChange: historyAnalysis.recentChange,
    forecast,
    normalizedCenter,
    normalizedScenarioMin,
    normalizedScenarioMax,
    historyVolatile: historyAnalysis.historyVolatile,
    trendStatus,
    predictedEventScore,
  };
}
