import type { EventId, Gender } from './fitness';

export type Direction = 'higher-is-better' | 'lower-is-better' | 'range';

export interface Threshold {
  value: number;
  score: number;
}

export interface RuleSource {
  name: string;
  url: string;
  note: string;
}

export interface EventRule {
  event: EventId;
  unit: string;
  weight: number;
  direction: Direction;
  thresholds: Threshold[];
  ranges?: Array<{ min: number; max: number; score: number }>;
}

export interface RuleSet {
  id: string;
  gender: Gender;
  gradeBand: 'lower' | 'upper';
  source: RuleSource;
  events: Partial<Record<EventId, EventRule>>;
}

export interface ScoreResult {
  baseScore: number;
  bonusScore: number;
  totalScore: number;
  matchedScore: number;
  sourceId: string;
}

export interface YearScoreSummary {
  score: number | null;
  completed: boolean;
  completedEvents: number;
  totalEvents: number;
  eventScores: Partial<Record<EventId, ScoreResult>>;
}

export interface FinalScoreSummary {
  score: number | null;
  firstThreeAverage: number | null;
  completed: boolean;
}

export interface EventDefinition {
  id: EventId;
  label: string;
  unit: string;
  inputKind: 'number' | 'bmi' | 'time';
}
