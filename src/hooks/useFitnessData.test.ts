import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFitnessData } from './useFitnessData';
import { ALL_EVENT_IDS, createInitialFitnessState } from '../types/fitness';
import type { Gender, Grade } from '../types/fitness';
import { populatedYear } from '../test/profileFixtures';
import { calculateYearScore } from '../utils/calculateYearScore';
import { calculateFinalScore } from '../utils/calculateFinalScore';
import { calculatePredictionSummary } from '../utils/calculatePredictionSummary';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../utils/storage';

const grades: Grade[] = ['year1', 'year2', 'year3', 'year4'];

describe('gender fitness profiles', () => {
  it('creates two independent empty four-year archives down to each event entry', () => {
    const state = createInitialFitnessState();
    expect(state.version).toBe(2);
    const { male, female } = state.profiles;
    expect(male).not.toBe(female);
    expect(male.years).not.toBe(female.years);
    for (const grade of grades) {
      expect(male.years[grade]).not.toBe(female.years[grade]);
      for (const event of ALL_EVENT_IDS) {
        expect(male.years[grade][event]).not.toBe(female.years[grade][event]);
        expect(female.years[grade][event]).toEqual({ mode: 'raw', raw: null, directScore: null });
        expect(male.years[grade][event]).toEqual({ mode: 'raw', raw: null, directScore: null });
      }
    }
    male.years.year1.bmi.raw = { heightCm: 180, weightKg: 70 };
    expect(female.years.year1.bmi.raw).toBeNull();
    expect(male.years.year2.bmi.raw).toBeNull();
  });

  it.each<Gender>(['male', 'female'])('isolates %s input, real scores and all three prediction targets across switches', (gender) => {
    const { result } = renderHook(() => useFitnessData());
    act(() => result.current.setGender(gender));
    const year = populatedYear(gender);
    for (const grade of grades) {
      for (const event of ALL_EVENT_IDS) {
        act(() => result.current.updateEvent(grade, event, year[event]));
      }
    }
    expect(result.current.activeYears).toBeDefined();
    const original = result.current.state;
    const summaries = () => grades.map((grade) => calculateYearScore({ gender: result.current.state.gender, grade, entries: result.current.activeYears[grade] }));
    const originalScores = summaries().map((summary) => summary.score);
    expect(calculateFinalScore(originalScores).completed).toBe(true);
    const prediction = (targetGrade: 'year2' | 'year3' | 'year4') => calculatePredictionSummary({
      gender: result.current.state.gender, targetGrade, years: result.current.activeYears,
      actualYearScores: [summaries()[0].score, summaries()[1].score, summaries()[2].score],
    });
    const originalPredictions = ['year2', 'year3', 'year4'].map((target) => prediction(target as 'year2' | 'year3' | 'year4'));
    expect(originalPredictions.map((p) => p.predictedYear.predictableEvents)).toEqual([7, 7, 7]);
    expect(originalPredictions[2].predictedFinal?.completed).toBe(true);
    act(() => result.current.setGender(gender === 'male' ? 'female' : 'male'));
    expect(result.current.state.profiles).toBe(original.profiles);
    for (const grade of grades) for (const event of ALL_EVENT_IDS) {
      expect(result.current.activeYears[grade][event]).toEqual({ mode: 'raw', raw: null, directScore: null });
    }
    expect(summaries().map((summary) => summary.completed)).toEqual([false, false, false, false]);
    expect(calculateFinalScore(summaries().map((summary) => summary.score)).completed).toBe(false);
    for (const target of ['year2', 'year3', 'year4'] as const) {
      expect(prediction(target).predictedYear.predictableEvents).toBe(0);
      expect(prediction(target).predictedFinal).toBeNull();
    }
    act(() => result.current.setGender(gender));
    expect(result.current.activeYears).toEqual(original.profiles[gender].years);
    expect(summaries().map((summary) => summary.score)).toEqual(originalScores);
    expect(['year2', 'year3', 'year4'].map((target) => prediction(target as 'year2' | 'year3' | 'year4'))).toEqual(originalPredictions);
  });

  it('keeps separately edited profiles, inactive raw/direct fields and currentGrade through hydrate', () => {
    const { result, unmount } = renderHook(() => useFitnessData());
    expect(result.current.state.version).toBe(2);
    act(() => result.current.updateEvent('year1', 'enduranceRun', { raw: { seconds: 260 }, directScore: 80, mode: 'direct' }));
    act(() => result.current.updateEvent('year1', 'pullUp', { raw: 15 }));
    act(() => result.current.setGender('female'));
    act(() => result.current.updateEvent('year1', 'enduranceRun', { raw: { seconds: 230 } }));
    act(() => result.current.updateEvent('year1', 'sitUp', { raw: 45 }));
    act(() => result.current.setCurrentGrade('year3'));
    for (let i = 0; i < 3; i++) {
      act(() => result.current.setGender('male'));
      expect(result.current.activeYears.year1.enduranceRun).toEqual({ mode: 'direct', raw: { seconds: 260 }, directScore: 80 });
      expect(result.current.activeYears.year1.sitUp.raw).toBeNull();
      act(() => result.current.setGender('female'));
      expect(result.current.activeYears.year1.enduranceRun.raw).toEqual({ seconds: 230 });
      expect(result.current.activeYears.year1.pullUp.raw).toBeNull();
    }
    const before = result.current.state;
    unmount();
    const hydrated = renderHook(() => useFitnessData());
    expect(hydrated.result.current.state).toEqual(before);
    expect(hydrated.result.current.state.gender).toBe('female');
    expect(hydrated.result.current.state.currentGrade).toBe('year3');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2);
  });

  it('clear all resets both profiles and remains empty on hydrate', () => {
    const { result, unmount } = renderHook(() => useFitnessData());
    expect(result.current.state.version).toBe(2);
    act(() => result.current.updateEvent('year1', 'vitalCapacity', { raw: 5000 }));
    act(() => result.current.setGender('female'));
    act(() => result.current.updateEvent('year4', 'sitUp', { raw: 45 }));
    act(() => result.current.clearAll());
    expect(result.current.state).toEqual(createInitialFitnessState('female'));
    unmount();
    expect(renderHook(() => useFitnessData()).result.current.state).toEqual(createInitialFitnessState('female'));
  });

  it('persists cleared v2 even when the legacy key cannot be removed', () => {
    const years = { year1: populatedYear('female'), year2: populatedYear('female'), year3: populatedYear('female'), year4: populatedYear('female') };
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, gender: 'female', currentGrade: 'year3', years }));
    const removeItem = localStorage.removeItem.bind(localStorage);
    const spy = vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
      if (key === LEGACY_STORAGE_KEY) throw new Error('legacy removal denied');
      removeItem(key);
    });
    try {
      const { result, unmount } = renderHook(() => useFitnessData());
      expect(result.current.activeYears.year1.sitUp.raw).toBe(45);
      act(() => result.current.clearAll());
      expect(result.current.state).toEqual(createInitialFitnessState('female'));
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();
      unmount();
      const restored = renderHook(() => useFitnessData());
      expect(restored.result.current.state).toEqual(createInitialFitnessState('female'));
      restored.unmount();
    } finally {
      spy.mockRestore();
    }
  });

});
