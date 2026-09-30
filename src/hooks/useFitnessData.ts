import { useCallback, useEffect, useState } from 'react';
import type { EventEntry, EventId, FitnessState, Gender, Grade } from '../types/fitness';
import { createInitialFitnessState, getActiveYears } from '../types/fitness';
import { clearFitnessState, loadFitnessState, saveFitnessState } from '../utils/storage';

export function useFitnessData() {
  const [state, setState] = useState<FitnessState>(() => loadFitnessState());

  useEffect(() => {
    saveFitnessState(state);
  }, [state]);

  const setGender = useCallback((gender: Gender) => {
    setState((previous) => ({ ...previous, gender }));
  }, []);

  const setCurrentGrade = useCallback((currentGrade: Grade) => {
    setState((previous) => ({ ...previous, currentGrade }));
  }, []);

  const updateEvent = useCallback((grade: Grade, event: EventId, update: Partial<EventEntry>) => {
    setState((previous) => {
      const years = getActiveYears(previous);
      return {
        ...previous,
        profiles: {
          ...previous.profiles,
          [previous.gender]: {
            years: {
              ...years,
              [grade]: {
                ...years[grade],
                [event]: { ...years[grade][event], ...update },
              },
            },
          },
        },
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    clearFitnessState();
    setState(createInitialFitnessState(state.gender));
  }, [state.gender]);

  return { state, activeYears: getActiveYears(state), setGender, setCurrentGrade, updateEvent, clearAll };
}
