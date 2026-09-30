import { describe, expect, it } from 'vitest';
import {
  createInitialFitnessState,
  getEventsForGender,
  getGradeBand,
} from '../types/fitness';

describe('fitness domain model', () => {
  it('creates four empty years with seven events for the selected gender', () => {
    const state = createInitialFitnessState('female');

    expect(Object.keys(state.profiles[state.gender].years)).toHaveLength(4);
    expect(getEventsForGender('female')).toEqual([
      'bmi',
      'vitalCapacity',
      'fiftyMeter',
      'sitAndReach',
      'standingLongJump',
      'sitUp',
      'enduranceRun',
    ]);
    expect(state.profiles[state.gender].years.year1.bmi.directScore).toBeNull();
    expect(state.profiles[state.gender].years.year1.bmi.raw).toBeNull();
  });

  it('maps the first two years and last two years to distinct rule bands', () => {
    expect(getGradeBand('year1')).toBe('lower');
    expect(getGradeBand('year2')).toBe('lower');
    expect(getGradeBand('year3')).toBe('upper');
    expect(getGradeBand('year4')).toBe('upper');
  });
});
