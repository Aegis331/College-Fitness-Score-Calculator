import type { Gender } from '../types/fitness';
import type { PredictionSummary, PredictionTargetGrade, PredictionYears } from '../types/prediction';
import { calculateFinalScore } from './calculateFinalScore';
import { calculatePredictedYearScore } from './calculatePredictedYearScore';

export interface CalculatePredictionSummaryInput {
  gender: Gender;
  targetGrade: PredictionTargetGrade;
  years: PredictionYears;
  actualYearScores: readonly [number | null, number | null, number | null];
}

export function calculatePredictionSummary({
  gender,
  targetGrade,
  years,
  actualYearScores,
}: CalculatePredictionSummaryInput): PredictionSummary {
  const predictedYear = calculatePredictedYearScore({ gender, targetGrade, years });
  const [year1, year2, year3] = actualYearScores;
  const predictedYearScore = predictedYear.score;
  const canCalculateFinal = targetGrade === 'year4'
    && year1 !== null
    && year2 !== null
    && year3 !== null
    && predictedYear.completed
    && predictedYearScore !== null;

  const predictedFinal = canCalculateFinal
    ? calculateFinalScore([year1, year2, year3, predictedYearScore])
    : null;

  return {
    targetGrade,
    eventResults: predictedYear.eventResults,
    predictedYear,
    predictedFinal,
  };
}
