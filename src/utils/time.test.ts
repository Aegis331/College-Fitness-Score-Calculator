import { describe, expect, it } from 'vitest';
import { formatRunTime, parseRunTime, parseRunTimeText } from './time';

describe('run time utilities', () => {
  it('converts minutes and seconds to integer seconds', () => {
    expect(parseRunTime(4, 12)).toBe(252);
    expect(parseRunTime('0', '00')).toBe(0);
  });

  it('rejects non-integer minutes and seconds outside 0 through 59', () => {
    expect(parseRunTime(4, 60)).toBeNull();
    expect(parseRunTime(-1, 20)).toBeNull();
    expect(parseRunTime(4.5, 12)).toBeNull();
  });

  it('parses and formats the compact display form', () => {
    expect(parseRunTimeText('4:12')).toBe(252);
    expect(parseRunTimeText('4:60')).toBeNull();
    expect(formatRunTime(252)).toEqual({ minutes: 4, seconds: 12 });
  });
});
