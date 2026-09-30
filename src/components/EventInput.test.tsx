import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EventEntry } from '../types/fitness';
import { EventInput } from './EventInput';

function emptyEntry(): EventEntry {
  return { mode: 'raw', raw: null, directScore: null };
}

describe('EventInput measurement controls', () => {
  it('uses shared precision for scalar inputs and leaves sit-and-reach lower bound open', () => {
    const { rerender } = render(
      <EventInput
        event="fiftyMeter"
        gender="male"
        grade="year1"
        entry={emptyEntry()}
        result={null}
        weight={0.2}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('spinbutton', { name: '测试成绩' }).getAttribute('step')).toBe('0.01');

    rerender(
      <EventInput
        event="sitAndReach"
        gender="male"
        grade="year1"
        entry={emptyEntry()}
        result={null}
        weight={0.1}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('spinbutton', { name: '测试成绩' }).getAttribute('step')).toBe('0.1');
    expect(screen.getByRole('spinbutton', { name: '测试成绩' }).getAttribute('min')).toBeNull();
  });

  it('uses shared BMI and endurance field bounds', () => {
    const { rerender } = render(
      <EventInput
        event="bmi"
        gender="male"
        grade="year1"
        entry={emptyEntry()}
        result={null}
        weight={0.15}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText('身高（cm）').getAttribute('min')).toBe('100');
    expect(screen.getByLabelText('身高（cm）').getAttribute('max')).toBe('250');
    expect(screen.getByLabelText('身高（cm）').getAttribute('step')).toBe('0.1');
    expect(screen.getByLabelText('体重（kg）').getAttribute('min')).toBe('20');
    expect(screen.getByLabelText('体重（kg）').getAttribute('max')).toBe('300');

    rerender(
      <EventInput
        event="enduranceRun"
        gender="male"
        grade="year1"
        entry={emptyEntry()}
        result={null}
        weight={0.2}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByLabelText('分钟').getAttribute('step')).toBe('1');
    expect(screen.getByLabelText('秒').getAttribute('min')).toBe('0');
    expect(screen.getByLabelText('秒').getAttribute('max')).toBe('59');
    expect(screen.getByLabelText('秒').getAttribute('step')).toBe('1');
  });
});
