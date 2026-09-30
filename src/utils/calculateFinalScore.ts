import type { FinalScoreSummary } from '../types/scoring';

export function calculateFinalScore(yearScores: Array<number | null>): FinalScoreSummary {
  const firstThree = yearScores.slice(0, 3);
  const firstThreeComplete = firstThree.length === 3 && firstThree.every((score): score is number => score !== null);
  const firstThreeAverage = firstThreeComplete
    ? firstThree.reduce((sum, score) => sum + score, 0) / 3
    : null;
  const year4 = yearScores[3] ?? null;
  const completed = firstThreeAverage !== null && year4 !== null;

  return {
    firstThreeAverage,
    score: completed ? firstThreeAverage * 0.5 + year4 * 0.5 : null,
    completed,
  };
}
