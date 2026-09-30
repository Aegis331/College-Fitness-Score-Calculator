import type { EventEntry, EventId, Grade, YearRecord } from './fitness';
import type { FinalScoreSummary, ScoreResult } from './scoring';

export type HistoricalGrade = 'year1' | 'year2' | 'year3';
export type HistoricalYears = Pick<Record<Grade, YearRecord>, HistoricalGrade>;
export type PredictionTargetGrade = Exclude<Grade, 'year1'>;
export type PredictionYears = Record<Grade, YearRecord>;

export const PREDICTION_TARGET_GRADES = ['year2', 'year3', 'year4'] as const satisfies readonly PredictionTargetGrade[];

export const PREDICTION_HISTORY_GRADES = {
  year2: ['year1'],
  year3: ['year1', 'year2'],
  year4: ['year1', 'year2', 'year3'],
} as const satisfies Record<PredictionTargetGrade, readonly HistoricalGrade[]>;

export function getPredictionHistoryGrades(targetGrade: PredictionTargetGrade): readonly HistoricalGrade[] {
  return PREDICTION_HISTORY_GRADES[targetGrade];
}

export interface TrendForecast {
  hold: number;
  recent: number | null;
  long: number | null;
  center: number;
  scenarioMin: number;
  scenarioMax: number;
}

export type PredictionAvailability =
  | { status: 'complete' }
  | { status: 'recent-change-only' }
  | { status: 'insufficient-data'; missingYears: HistoricalGrade[] }
  | {
      status: 'unavailable';
      reason: 'direct-mode' | 'invalid-raw' | 'out-of-range';
    };

export interface NormalizedPrediction {
  available: boolean;
  value: number | null;
  reason?: 'non-finite' | 'out-of-range';
}

export type TrendStatus = 'improving' | 'stable' | 'declining';
export type BmiTrendStatus = 'decreasing' | 'stable' | 'increasing';

export interface PredictedEventResult {
  event: EventId;
  availability: PredictionAvailability;
  rawValues: Array<number | null>;
  recentChange: number | null;
  forecast: TrendForecast | null;
  normalizedCenter: NormalizedPrediction;
  normalizedScenarioMin: NormalizedPrediction;
  normalizedScenarioMax: NormalizedPrediction;
  historyVolatile: boolean;
  trendStatus: TrendStatus | BmiTrendStatus | null;
  predictedEventScore: ScoreResult | null;
}

export interface PredictedYearScore {
  targetGrade: PredictionTargetGrade;
  predictableEvents: number;
  totalEvents: number;
  eventResults: Partial<Record<EventId, PredictedEventResult>>;
  completed: boolean;
  score: number | null;
}

export interface PredictionSummary {
  targetGrade: PredictionTargetGrade;
  eventResults: Partial<Record<EventId, PredictedEventResult>>;
  predictedYear: PredictedYearScore;
  predictedFinal: FinalScoreSummary | null;
}

export type HistoricalEventEntries = Record<Grade, EventEntry>;
