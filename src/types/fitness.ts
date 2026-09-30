import type { EventDefinition, FinalScoreSummary, YearScoreSummary } from './scoring';

export type Gender = 'male' | 'female';
export type Grade = 'year1' | 'year2' | 'year3' | 'year4';
export type GradeBand = 'lower' | 'upper';
export type InputMode = 'raw' | 'direct';

export type EventId =
  | 'bmi'
  | 'vitalCapacity'
  | 'fiftyMeter'
  | 'sitAndReach'
  | 'standingLongJump'
  | 'pullUp'
  | 'sitUp'
  | 'enduranceRun';

export type BmiRawValue = {
  heightCm: number | null;
  weightKg: number | null;
};

export type TimeRawValue = {
  seconds: number | null;
};

export type RawValue = number | BmiRawValue | TimeRawValue;

export interface EventEntry {
  mode: InputMode;
  raw: RawValue | null;
  directScore: number | null;
}

export type YearRecord = Record<EventId, EventEntry>;

export interface GenderFitnessProfile {
  years: Record<Grade, YearRecord>;
}

export interface FitnessState {
  version: 2;
  gender: Gender;
  currentGrade: Grade;
  profiles: Record<Gender, GenderFitnessProfile>;
}

export const ALL_EVENT_IDS: EventId[] = [
  'bmi',
  'vitalCapacity',
  'fiftyMeter',
  'sitAndReach',
  'standingLongJump',
  'pullUp',
  'sitUp',
  'enduranceRun',
];

const MALE_EVENT_IDS: EventId[] = [
  'bmi',
  'vitalCapacity',
  'fiftyMeter',
  'sitAndReach',
  'standingLongJump',
  'pullUp',
  'enduranceRun',
];

const FEMALE_EVENT_IDS: EventId[] = [
  'bmi',
  'vitalCapacity',
  'fiftyMeter',
  'sitAndReach',
  'standingLongJump',
  'sitUp',
  'enduranceRun',
];

const GRADES: Grade[] = ['year1', 'year2', 'year3', 'year4'];

export const EVENT_DEFINITIONS: Record<EventId, EventDefinition> = {
  bmi: { id: 'bmi', label: 'BMI / 身高体重', unit: '', inputKind: 'bmi' },
  vitalCapacity: { id: 'vitalCapacity', label: '肺活量', unit: 'mL', inputKind: 'number' },
  fiftyMeter: { id: 'fiftyMeter', label: '50 米跑', unit: '秒', inputKind: 'number' },
  sitAndReach: { id: 'sitAndReach', label: '坐位体前屈', unit: 'cm', inputKind: 'number' },
  standingLongJump: { id: 'standingLongJump', label: '立定跳远', unit: 'cm', inputKind: 'number' },
  pullUp: { id: 'pullUp', label: '引体向上', unit: '个', inputKind: 'number' },
  sitUp: { id: 'sitUp', label: '一分钟仰卧起坐', unit: '个', inputKind: 'number' },
  enduranceRun: { id: 'enduranceRun', label: '耐力跑', unit: '秒', inputKind: 'time' },
};

function createEmptyEventEntry(): EventEntry {
  return { mode: 'raw', raw: null, directScore: null };
}

export function createEmptyYearRecord(): YearRecord {
  return ALL_EVENT_IDS.reduce<YearRecord>((record, event) => {
    record[event] = createEmptyEventEntry();
    return record;
  }, {} as YearRecord);
}

export function createEmptyProfile(): GenderFitnessProfile {
  return {
    years: GRADES.reduce<Record<Grade, YearRecord>>((years, grade) => {
      years[grade] = createEmptyYearRecord();
      return years;
    }, {} as Record<Grade, YearRecord>),
  };
}

export function createInitialFitnessState(gender: Gender = 'male'): FitnessState {
  return {
    version: 2,
    gender,
    currentGrade: 'year1',
    profiles: { male: createEmptyProfile(), female: createEmptyProfile() },
  };
}

export function getActiveYears(state: FitnessState): Record<Grade, YearRecord> {
  return state.profiles[state.gender].years;
}

export function getEventsForGender(gender: Gender): EventId[] {
  return [...(gender === 'male' ? MALE_EVENT_IDS : FEMALE_EVENT_IDS)];
}

export function getGradeBand(grade: Grade): GradeBand {
  return grade === 'year1' || grade === 'year2' ? 'lower' : 'upper';
}

export type ComputedYearScores = Record<Grade, YearScoreSummary>;
export type ComputedFinalScore = FinalScoreSummary;
