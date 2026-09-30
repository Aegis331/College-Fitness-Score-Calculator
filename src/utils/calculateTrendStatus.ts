import type { BmiTrendStatus, TrendStatus } from '../types/prediction';

export interface TrendStatusInput {
  direction: 'higher-is-better' | 'lower-is-better';
  previous: number;
  latest: number;
  stableTolerance: number;
}

export function calculateTrendStatus(input: TrendStatusInput): TrendStatus {
  const deltaRecent = input.latest - input.previous;
  if (Math.abs(deltaRecent) <= input.stableTolerance) {
    return 'stable';
  }

  if (input.direction === 'higher-is-better') {
    return deltaRecent > 0 ? 'improving' : 'declining';
  }

  return deltaRecent < 0 ? 'improving' : 'declining';
}

export function calculateBmiTrendStatus(
  previous: number,
  latest: number,
  stableTolerance: number,
): BmiTrendStatus {
  const deltaRecent = latest - previous;
  if (Math.abs(deltaRecent) <= stableTolerance) {
    return 'stable';
  }

  return deltaRecent < 0 ? 'decreasing' : 'increasing';
}
