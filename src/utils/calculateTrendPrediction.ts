import { getPredictionHistoryGrades, type PredictionTargetGrade, type TrendForecast } from '../types/prediction';

export interface TrendPredictionInput {
  targetGrade: PredictionTargetGrade;
  historicalValues: readonly number[];
}

export function calculateTrendPrediction(input: TrendPredictionInput): TrendForecast | null {
  const expectedPointCount = getPredictionHistoryGrades(input.targetGrade).length;

  if (
    input.historicalValues.length !== expectedPointCount
    || !input.historicalValues.every(Number.isFinite)
  ) {
    return null;
  }

  const latest = input.historicalValues.at(-1)!;
  const previous = input.historicalValues.at(-2);
  const first = input.historicalValues[0];
  const hold = latest;
  const recent = previous === undefined ? null : latest + (latest - previous);
  const long = input.historicalValues.length === 3
    ? latest + (latest - first) / 2
    : null;
  const modelValues = [hold, recent, long].filter((value): value is number => value !== null);
  const center = modelValues.reduce((total, value) => total + value, 0) / modelValues.length;

  return {
    hold,
    recent,
    long,
    center,
    scenarioMin: Math.min(...modelValues),
    scenarioMax: Math.max(...modelValues),
  };
}
