import { createEmptyYearRecord } from '../types/fitness';
import type { EventEntry, Gender, YearRecord } from '../types/fitness';

export function populatedYear(gender: Gender): YearRecord {
  const year = createEmptyYearRecord();
  const entry = (raw: EventEntry['raw']): EventEntry => ({ mode: 'raw', raw, directScore: null });
  year.bmi = entry({ heightCm: 170, weightKg: 60 });
  year.vitalCapacity = entry(gender === 'male' ? 5000 : 3500);
  year.fiftyMeter = entry(gender === 'male' ? 7.1 : 8.2);
  year.sitAndReach = entry(20);
  year.standingLongJump = entry(gender === 'male' ? 250 : 200);
  year.enduranceRun = entry({ seconds: gender === 'male' ? 260 : 230 });
  year[gender === 'male' ? 'pullUp' : 'sitUp'] = entry(gender === 'male' ? 15 : 45);
  return year;
}
