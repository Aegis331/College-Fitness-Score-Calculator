import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { createInitialFitnessState } from './types/fitness';
import { STORAGE_KEY } from './utils/storage';

afterEach(() => {
  localStorage.clear();
});

function getCurrentYearEventCard(eventName: string): HTMLElement {
  const heading = screen
    .getAllByText(eventName)
    .find((element) => element.closest('.year-card'));

  if (!heading) {
    throw new Error(`Current year event card not found: ${eventName}`);
  }

  const card = heading.closest('.event-card');
  if (!card) {
    throw new Error(`Event card not found: ${eventName}`);
  }

  return card as HTMLElement;
}

function createVitalHistoryState() {
  const state = createInitialFitnessState('male');
  state.profiles[state.gender].years.year1.vitalCapacity = { mode: 'raw', raw: 4000, directScore: null };
  state.profiles[state.gender].years.year2.vitalCapacity = { mode: 'raw', raw: 4100, directScore: null };
  state.profiles[state.gender].years.year3.vitalCapacity = { mode: 'raw', raw: 4200, directScore: null };
  return state;
}

function seedState(state: ReturnType<typeof createInitialFitnessState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

describe('fitness calculator interface', () => {
  it('renders the male event set and the incomplete final-score message', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '大学生体测成绩计算器' })).toBeTruthy();
    expect(screen.getAllByText('引体向上').length).toBeGreaterThan(0);
    expect(screen.queryByText('一分钟仰卧起坐')).toBeNull();
    expect(screen.getByText('请完成四个学年的成绩后计算最终成绩')).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始趋势预测' })).toBeTruthy();
    expect(screen.queryByText('预测大四体测成绩')).toBeNull();
  });

  it('switches the event set with gender and supports per-event direct-score mode', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '女生' }));
    expect(screen.getAllByText('一分钟仰卧起坐').length).toBeGreaterThan(0);
    expect(screen.queryByText('引体向上')).toBeNull();

    fireEvent.click(screen.getAllByRole('radio', { name: '直接得分' })[0]);
    expect(screen.getAllByLabelText('项目得分').length).toBeGreaterThan(0);
  });

  it('recomputes the derived trend prediction when a historical raw value changes', () => {
    seedState(createVitalHistoryState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getAllByText('4267 mL').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '大一' }));
    const vitalCard = getCurrentYearEventCard('肺活量');
    fireEvent.change(within(vitalCard).getByRole('spinbutton', { name: '测试成绩' }), {
      target: { value: '3900' },
    });

    expect(screen.getAllByText('4283 mL').length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').prediction).toBeUndefined();
  });

  it('disables a prediction when a year switches to direct mode, even if stale raw remains', async () => {
    seedState(createVitalHistoryState());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getAllByText('大四预测').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '大二' }));
    const vitalCard = getCurrentYearEventCard('肺活量');
    fireEvent.click(within(vitalCard).getByRole('radio', { name: '直接得分' }));

    await waitFor(() => {
      expect(screen.queryByText('大四预测')).toBeNull();
      expect(screen.getByText('当前没有可预测项目。请先录入大一、大二、大三原始体测数据。')).toBeTruthy();
    });

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persisted.profiles.male.years.year2.vitalCapacity.raw).toBe(4100);
    expect(persisted.profiles.male.years.year2.vitalCapacity.mode).toBe('direct');
  });

  it('rehydrates predictions without persisting predictions or mutating year4 actual data', () => {
    const state = createVitalHistoryState();
    state.currentGrade = 'year4';
    state.profiles[state.gender].years.year4.vitalCapacity = { mode: 'raw', raw: 999, directScore: null };
    seedState(state);

    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getAllByText('4267 mL').length).toBeGreaterThan(0);
    const persistedAfterFirstRender = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persistedAfterFirstRender.prediction).toBeUndefined();
    expect(persistedAfterFirstRender.profiles.male.years.year4.vitalCapacity.raw).toBe(999);

    unmount();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getAllByText('4267 mL').length).toBeGreaterThan(0);
    const persistedAfterRemount = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(persistedAfterRemount.prediction).toBeUndefined();
    expect(persistedAfterRemount.profiles.male.years.year4.vitalCapacity.raw).toBe(999);
  });
});


describe('active gender archive interface', () => {
  it('keeps common and gender-specific raw inputs independent after repeated UI switches', () => {
    render(<App />);
    const fill = (name: string, label: string, value: string) => fireEvent.change(within(getCurrentYearEventCard(name)).getByRole('spinbutton', { name: label }), { target: { value } });
    fill('肺活量', '测试成绩', '5000');
    fill('引体向上', '测试成绩', '15');
    fill('1000 米跑', '分钟', '4');
    fill('1000 米跑', '秒', '20');
    fireEvent.click(screen.getByRole('button', { name: '女生' }));
    for (const input of document.querySelectorAll<HTMLInputElement>('.year-card input[type="number"]')) expect(input.value).toBe('');
    fill('肺活量', '测试成绩', '3500');
    fill('一分钟仰卧起坐', '测试成绩', '45');
    fill('800 米跑', '分钟', '3');
    fill('800 米跑', '秒', '50');
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '男生' }));
      expect((within(getCurrentYearEventCard('肺活量')).getByRole('spinbutton', { name: '测试成绩' }) as HTMLInputElement).value).toBe('5000');
      expect((within(getCurrentYearEventCard('引体向上')).getByRole('spinbutton', { name: '测试成绩' }) as HTMLInputElement).value).toBe('15');
      expect((within(getCurrentYearEventCard('1000 米跑')).getByRole('spinbutton', { name: '秒' }) as HTMLInputElement).value).toBe('20');
      fireEvent.click(screen.getByRole('button', { name: '女生' }));
      expect((within(getCurrentYearEventCard('肺活量')).getByRole('spinbutton', { name: '测试成绩' }) as HTMLInputElement).value).toBe('3500');
      expect((within(getCurrentYearEventCard('一分钟仰卧起坐')).getByRole('spinbutton', { name: '测试成绩' }) as HTMLInputElement).value).toBe('45');
      expect((within(getCurrentYearEventCard('800 米跑')).getByRole('spinbutton', { name: '秒' }) as HTMLInputElement).value).toBe('50');
    }
  });
});
