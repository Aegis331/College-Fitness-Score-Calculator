import type {
  EventEntry,
  EventId,
  FitnessState,
  Gender,
  Grade,
  GenderFitnessProfile,
  RawValue,
} from '../types/fitness';
import {
  ALL_EVENT_IDS,
  createEmptyProfile,
  createInitialFitnessState,
} from '../types/fitness';

export const STORAGE_KEY = 'college-fitness-score-calculator:v2';
export const LEGACY_STORAGE_KEY = 'college-fitness-score-calculator:v1';

const GRADES: Grade[] = ['year1', 'year2', 'year3', 'year4'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeRaw(event: EventId, raw: unknown): RawValue | null {
  const numeric = finiteOrNull(raw);
  if (numeric !== null) {
    return numeric;
  }

  if (!isRecord(raw)) {
    return null;
  }

  if (event === 'bmi') {
    return {
      heightCm: finiteOrNull(raw.heightCm),
      weightKg: finiteOrNull(raw.weightKg),
    };
  }

  if (event === 'enduranceRun') {
    return { seconds: finiteOrNull(raw.seconds) };
  }

  return null;
}

function normalizeEntry(event: EventId, value: unknown): EventEntry {
  if (!isRecord(value)) {
    return { mode: 'raw', raw: null, directScore: null };
  }

  return {
    mode: value.mode === 'direct' ? 'direct' : 'raw',
    raw: normalizeRaw(event, value.raw),
    directScore: finiteOrNull(value.directScore),
  };
}

function isGender(value: unknown): value is Gender {
  return value === 'male' || value === 'female';
}

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade);
}

function normalizeYears(value: unknown): GenderFitnessProfile['years'] | null {
  if (!isRecord(value) || !GRADES.every((grade) => isRecord(value[grade]))) {
    return null;
  }
  const years = createEmptyProfile().years;
  for (const grade of GRADES) {
    const storedYear = value[grade] as Record<string, unknown>;
    for (const event of ALL_EVENT_IDS) {
      years[grade][event] = normalizeEntry(event, storedYear[event]);
    }
  }
  return years;
}

function normalizeState(value: unknown): FitnessState | null {
  if (!isRecord(value) || value.version !== 2 || !isGender(value.gender)
    || !isGrade(value.currentGrade) || !isRecord(value.profiles)
    || !isRecord(value.profiles.male) || !isRecord(value.profiles.female)) {
    return null;
  }
  const maleYears = normalizeYears(value.profiles.male.years);
  const femaleYears = normalizeYears(value.profiles.female.years);
  if (!maleYears || !femaleYears) return null;
  return {
    version: 2, gender: value.gender, currentGrade: value.currentGrade,
    profiles: { male: { years: maleYears }, female: { years: femaleYears } },
  };
}

function migrateLegacyState(value: unknown): FitnessState | null {
  if (!isRecord(value) || value.version !== 1 || !isGender(value.gender)
    || !isGrade(value.currentGrade)) return null;
  const years = normalizeYears(value.years);
  if (!years) return null;
  const state = createInitialFitnessState(value.gender);
  state.currentGrade = value.currentGrade;
  state.profiles[value.gender].years = years;
  return state;
}

function resolveStorage(storage?: Storage): Storage | null {
  try {
    return storage ?? (typeof window === 'undefined' ? null : window.localStorage);
  } catch {
    return null;
  }
}

function readState(target: Storage, key: string): unknown {
  try {
    const raw = target.getItem(key);
    return raw ? JSON.parse(raw) as unknown : null;
  } catch {
    return null;
  }
}

export function loadFitnessState(storage?: Storage): FitnessState {
  const target = resolveStorage(storage);
  if (!target) return createInitialFitnessState();
  const current = normalizeState(readState(target, STORAGE_KEY));
  if (current) return current;
  const migrated = migrateLegacyState(readState(target, LEGACY_STORAGE_KEY));
  if (!migrated) return createInitialFitnessState();
  try {
    // Keep the legacy backup unless writing the full v2 payload succeeds.
    target.setItem(STORAGE_KEY, JSON.stringify(migrated));
    target.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Use migrated data in memory while retaining the legacy backup on failure.
  }
  return migrated;
}

export function saveFitnessState(state: FitnessState, storage?: Storage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; quota or privacy settings must not crash the calculator.
  }
}

export function clearFitnessState(storage?: Storage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      target.removeItem(key);
    } catch {
      // Still attempt the other key and allow the caller to reset in-memory state.
    }
  }
}
