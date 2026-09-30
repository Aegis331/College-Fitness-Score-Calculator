import type { EventId } from '../types/fitness';
import { getMeasurementSpec } from '../data/eventMeasurementRules';

export interface HistoryConsistencyAnalysis {
  recentChange: number | null;
  historyVolatile: boolean;
}

function getTolerance(event: EventId): number {
  return 10 ** -getMeasurementSpec(event).decimals;
}

export function analyzeHistoryConsistency(
  event: EventId,
  values: readonly (number | null)[],
): HistoryConsistencyAnalysis {
  const first = values[0] ?? null;
  const previous = values[1] ?? null;
  const latest = values[2] ?? null;
  const recentChange = previous !== null && latest !== null
    ? latest - previous
    : first !== null && previous !== null
      ? previous - first
      : null;

  if (first === null || previous === null || latest === null) {
    return { recentChange, historyVolatile: false };
  }

  const firstChange = previous - first;
  const recent = latest - previous;
  const tolerance = getTolerance(event);
  const hasMeaningfulFirstChange = Math.abs(firstChange) > tolerance;
  const hasMeaningfulRecentChange = Math.abs(recent) > tolerance;

  return {
    recentChange,
    historyVolatile: hasMeaningfulFirstChange
      && hasMeaningfulRecentChange
      && firstChange * recent < 0,
  };
}
