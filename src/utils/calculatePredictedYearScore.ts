import { getEventsForGender } from '../types/fitness';
import type { EventId, Gender } from '../types/fitness';
import type { PredictionTargetGrade, PredictionYears, PredictedEventResult, PredictedYearScore } from '../types/prediction';
import { calculateEventPrediction } from './calculateEventPrediction';
import { calculateWeightedYearScore } from './calculateYearScore';

export interface CalculatePredictedYearScoreInput {
  gender: Gender;
  targetGrade: PredictionTargetGrade;
  years: PredictionYears;
}

export function calculatePredictedYearScore({
  gender,
  targetGrade,
  years,
}: CalculatePredictedYearScoreInput): PredictedYearScore {
  const events = getEventsForGender(gender);
  const eventResults: Partial<Record<EventId, PredictedEventResult>> = {};
  const eventScores = {} as Partial<Record<EventId, NonNullable<PredictedEventResult['predictedEventScore']>>>;

  for (const event of events) {
    const result = calculateEventPrediction({
      gender,
      event,
      targetGrade,
      entries: {
        year1: years.year1[event],
        year2: years.year2[event],
        year3: years.year3[event],
        year4: years.year4[event],
      },
    });
    eventResults[event] = result;
    if (result.availability.status === 'complete' && result.predictedEventScore !== null) {
      eventScores[event] = result.predictedEventScore;
    }
  }

  const predictableEvents = Object.keys(eventScores).length;
  const totalEvents = events.length;
  if (predictableEvents !== totalEvents) {
    return {
      targetGrade,
      predictableEvents,
      totalEvents,
      eventResults,
      completed: false,
      score: null,
    };
  }

  const weightedScore = calculateWeightedYearScore({
    gender,
    grade: targetGrade,
    eventScores,
  });

  return {
    targetGrade,
    predictableEvents,
    totalEvents,
    eventResults,
    completed: weightedScore.completed,
    score: weightedScore.completed ? weightedScore.score : null,
  };
}
