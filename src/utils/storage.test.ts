import { describe, expect, it, vi } from 'vitest';
import { createEmptyYearRecord, createInitialFitnessState } from '../types/fitness';
import { clearFitnessState, loadFitnessState, saveFitnessState, STORAGE_KEY } from './storage';

describe('fitness state storage', () => {
  it('round-trips gender, mode, raw data, and direct score', () => {
    const state = createInitialFitnessState('female');
    state.currentGrade = 'year3';
    state.profiles.female.years.year1.bmi = {
      mode: 'raw',
      raw: { heightCm: 165, weightKg: 55 },
      directScore: null,
    };
    state.profiles.female.years.year3.fiftyMeter = {
      mode: 'direct',
      raw: 8.2,
      directScore: 85,
    };

    state.profiles.male.years.year4.pullUp = { mode: 'raw', raw: 15, directScore: 90 };
    saveFitnessState(state);
    const restored = loadFitnessState();

    expect(restored).toEqual(state);
    expect(restored.gender).toBe('female');
    expect(restored.currentGrade).toBe('year3');
    expect(restored.profiles.female.years.year1.bmi.raw).toEqual({ heightCm: 165, weightKg: 55 });
    expect(restored.profiles.female.years.year3.fiftyMeter).toEqual({ mode: 'direct', raw: 8.2, directScore: 85 });
  });

  it('falls back to a clean state when the stored payload is malformed', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-json');

    const restored = loadFitnessState();

    expect(restored).toEqual(createInitialFitnessState('male'));
  });

  it('clears the versioned key', () => {
    window.localStorage.setItem(STORAGE_KEY, '{}');

    clearFitnessState();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});


const LEGACY_KEY = 'college-fitness-score-calculator:v1';

function legacyState(gender: 'male' | 'female') {
  const years = { year1: createEmptyYearRecord(), year2: createEmptyYearRecord(), year3: createEmptyYearRecord(), year4: createEmptyYearRecord() };
  years.year1.bmi = { mode: 'direct' as const, raw: { heightCm: 165, weightKg: 55 }, directScore: 85 };
  years.year2.enduranceRun = { mode: 'raw' as const, raw: { seconds: 260 }, directScore: 70 };
  years.year3.pullUp = { mode: 'raw' as const, raw: 15, directScore: 90 };
  years.year4.sitUp = { mode: 'direct' as const, raw: 45, directScore: 95 };
  return { version: 1, gender, currentGrade: 'year3', years };
}

describe('v1 to v2 migration', () => {
  it.each(['male', 'female'] as const)('archives old %s data by recorded gender preserving every active and inactive field', (gender) => {
    const old = legacyState(gender);
    localStorage.setItem(LEGACY_KEY, JSON.stringify(old));
    const restored = loadFitnessState();
    expect(restored.version).toBe(2);
    expect(restored.gender).toBe(gender);
    expect(restored.currentGrade).toBe('year3');
    expect(restored.profiles[gender].years).toEqual(old.years);
    expect(restored.profiles[gender === 'male' ? 'female' : 'male'].years).toEqual(createInitialFitnessState().profiles.male.years);
    expect(JSON.parse(localStorage.getItem('college-fitness-score-calculator:v2') ?? '{}')).toEqual(restored);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(loadFitnessState()).toEqual(restored);
  });

  it('prefers existing valid v2 without overwriting it or touching v1', () => {
    const state = createInitialFitnessState('female');
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify(state));
    const old = JSON.stringify(legacyState('male'));
    localStorage.setItem(LEGACY_KEY, old);
    expect(loadFitnessState()).toEqual(state);
    expect(localStorage.getItem(LEGACY_KEY)).toBe(old);
  });

  it('recovers valid legacy data when v2 is corrupt', () => {
    localStorage.setItem('college-fitness-score-calculator:v2', '{broken');
    const old = legacyState('female');
    localStorage.setItem(LEGACY_KEY, JSON.stringify(old));
    const restored = loadFitnessState();
    expect(restored.version).toBe(2);
    expect(restored.profiles.female.years).toEqual(old.years);
  });

  it('preserves v1 if writing v2 fails and returns migrated data in memory', () => {
    const old = JSON.stringify(legacyState('female'));
    localStorage.setItem(LEGACY_KEY, old);
    const storage: Storage = {
      length: localStorage.length, key: (i) => localStorage.key(i), clear: () => localStorage.clear(),
      getItem: (key) => localStorage.getItem(key), removeItem: (key) => localStorage.removeItem(key),
      setItem: () => { throw new Error('quota'); },
    };
    const restored = loadFitnessState(storage);
    expect(restored.version).toBe(2);
    expect(restored.profiles.female.years).toEqual(JSON.parse(old).years);
    expect(localStorage.getItem(LEGACY_KEY)).toBe(old);
    expect(localStorage.getItem('college-fitness-score-calculator:v2')).toBeNull();
  });

  it('uses saved v2 when removing v1 fails after successful migration', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyState('male')));
    const storage: Storage = {
      length: localStorage.length, key: (i) => localStorage.key(i), clear: () => localStorage.clear(),
      getItem: (key) => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: () => { throw new Error('blocked removal'); },
    };
    const restored = loadFitnessState(storage);
    expect(restored.version).toBe(2);
    expect(loadFitnessState()).toEqual(restored);
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it('rejects legacy gender that cannot safely identify an archive', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ ...legacyState('female'), gender: 'unknown' }));
    expect(loadFitnessState()).toEqual(createInitialFitnessState());
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it('clears both version keys so legacy data cannot reappear', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyState('female')));
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify(createInitialFitnessState()));
    clearFitnessState();
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(localStorage.getItem('college-fitness-score-calculator:v2')).toBeNull();
    expect(loadFitnessState()).toEqual(createInitialFitnessState());
  });
});

describe('v2 validation and unavailable persistence', () => {
  it.each([
    { version: 1 }, { gender: 'unknown' }, { currentGrade: 'year5' },
    { profiles: null }, { profiles: { male: null, female: null } },
    { profiles: { male: { years: {} }, female: { years: {} } } },
    { profiles: { male: { years: [] }, female: { years: [] } } },
  ])('falls back for invalid v2 envelope %j', (invalid) => {
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify({ ...createInitialFitnessState(), ...invalid }));
    expect(loadFitnessState()).toEqual(createInitialFitnessState());
  });

  it.each(['male', 'female'] as const)('rejects a missing %s profile', (gender) => {
    const stored = JSON.parse(JSON.stringify(createInitialFitnessState()));
    delete stored.profiles[gender];
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify(stored));
    expect(loadFitnessState()).toEqual(createInitialFitnessState());
  });

  it.each(['male', 'female'] as const)('validates all four years in the %s archive', (gender) => {
    const state = createInitialFitnessState();
    const stored = JSON.parse(JSON.stringify(state));
    delete stored.profiles[gender].years.year3;
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify(stored));
    expect(loadFitnessState()).toEqual(createInitialFitnessState());
  });

  it('normalizes malformed event entries without crashing or mixing profiles', () => {
    const state = createInitialFitnessState();
    const stored = JSON.parse(JSON.stringify(state));
    stored.profiles.male.years.year1.bmi = null;
    stored.profiles.female.years.year2.enduranceRun = { mode: 'direct', raw: { seconds: 'bad' }, directScore: 'bad' };
    localStorage.setItem('college-fitness-score-calculator:v2', JSON.stringify(stored));
    const restored = loadFitnessState();
    expect(restored.profiles.male.years.year1.bmi).toEqual({ mode: 'raw', raw: null, directScore: null });
    expect(restored.profiles.female.years.year2.enduranceRun).toEqual({ mode: 'direct', raw: { seconds: null }, directScore: null });
  });

  it('handles an inaccessible window.localStorage getter', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('privacy'); });
    try {
      expect(loadFitnessState()).toEqual(createInitialFitnessState());
      expect(() => saveFitnessState(createInitialFitnessState())).not.toThrow();
      expect(() => clearFitnessState()).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});
