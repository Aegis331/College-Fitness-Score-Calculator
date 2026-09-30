import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EventId } from '../types/fitness';
import type { PredictionSummary, PredictionTargetGrade, PredictedEventResult } from '../types/prediction';
import { TrendPredictionPanel } from './TrendPredictionPanel';

const DISCLAIMER = '趋势预测仅根据目标学年之前的历史体测数据估算，用于参考，不代表实际测试结果。';

function score(baseScore: number) {
  return {
    baseScore,
    bonusScore: 0,
    totalScore: baseScore,
    matchedScore: baseScore,
    sourceId: 'test',
  };
}

function completeResult(
  event: EventId,
  rawValues: number[],
  center: number,
  trendStatus: PredictedEventResult['trendStatus'],
  historyVolatile = false,
): PredictedEventResult {
  return {
    event,
    availability: { status: 'complete' },
    rawValues,
    recentChange: rawValues.length > 1 ? rawValues.at(-1)! - rawValues.at(-2)! : null,
    forecast: {
      hold: center,
      recent: rawValues.length > 1 ? center : null,
      long: rawValues.length === 3 ? center : null,
      center,
      scenarioMin: center,
      scenarioMax: center,
    },
    normalizedCenter: { available: true, value: center },
    normalizedScenarioMin: { available: true, value: center },
    normalizedScenarioMax: { available: true, value: center },
    historyVolatile,
    trendStatus,
    predictedEventScore: score(90),
  };
}

function incompleteResult(event: EventId): PredictedEventResult {
  return {
    event,
    availability: { status: 'insufficient-data', missingYears: ['year2'] },
    rawValues: [100, null, 120],
    recentChange: null,
    forecast: null,
    normalizedCenter: { available: false, value: null },
    normalizedScenarioMin: { available: false, value: null },
    normalizedScenarioMax: { available: false, value: null },
    historyVolatile: false,
    trendStatus: null,
    predictedEventScore: null,
  };
}

function completeSummary(targetGrade: PredictionTargetGrade = 'year4'): PredictionSummary {
  const historyLength = targetGrade === 'year2' ? 1 : targetGrade === 'year3' ? 2 : 3;
  const eventResults: Partial<Record<EventId, PredictedEventResult>> = {
    bmi: completeResult('bmi', [27.2, 26.1, 24.8].slice(0, historyLength), 23.9, targetGrade === 'year2' ? null : 'decreasing'),
    vitalCapacity: completeResult('vitalCapacity', [4000, 4100, 4200].slice(0, historyLength), 4200, targetGrade === 'year2' ? null : 'improving'),
    fiftyMeter: completeResult('fiftyMeter', [7.8, 7.5, 7.2].slice(0, historyLength), 7.1, targetGrade === 'year2' ? null : 'improving'),
    sitAndReach: completeResult('sitAndReach', [8, 9, 10].slice(0, historyLength), 10.5, targetGrade === 'year2' ? null : 'improving'),
    standingLongJump: completeResult('standingLongJump', [220, 225, 230].slice(0, historyLength), 232, targetGrade === 'year2' ? null : 'improving'),
    pullUp: completeResult('pullUp', [10, 11, 12].slice(0, historyLength), 13, targetGrade === 'year2' ? null : 'improving'),
    enduranceRun: completeResult('enduranceRun', [285, 270, 258].slice(0, historyLength), 252, targetGrade === 'year2' ? null : 'improving'),
  };

  return {
    targetGrade,
    eventResults,
    predictedYear: { targetGrade, predictableEvents: 7, totalEvents: 7, eventResults, completed: true, score: 84.35 },
    predictedFinal: targetGrade === 'year4' ? { completed: true, firstThreeAverage: 80, score: 82.17 } : null,
  };
}

function completeSummaries(): Record<PredictionTargetGrade, PredictionSummary> {
  return {
    year2: completeSummary('year2'),
    year3: completeSummary('year3'),
    year4: completeSummary('year4'),
  };
}

function partialSummaries(): Record<PredictionTargetGrade, PredictionSummary> {
  const eventResults = completeSummary('year4').eventResults;
  eventResults.pullUp = incompleteResult('pullUp');
  eventResults.enduranceRun = incompleteResult('enduranceRun');

  return {
    year2: completeSummary('year2'),
    year3: completeSummary('year3'),
    year4: {
      targetGrade: 'year4',
      eventResults,
      predictedYear: { targetGrade: 'year4', predictableEvents: 5, totalEvents: 7, eventResults, completed: false, score: null },
      predictedFinal: null,
    },
  };
}

describe('TrendPredictionPanel', () => {
  it('renders complete cards with units, time formatting, BMI wording and totals', () => {
    render(<TrendPredictionPanel gender="male" summaries={completeSummaries()} />);

    expect(screen.getByRole('heading', { name: '趋势预测' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '开始趋势预测' })).toBeTruthy();
    expect(screen.queryByText('预测大四体测成绩')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getByRole('heading', { name: '大四趋势预测' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '大二' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '大三' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '大四' })).toBeTruthy();
    expect(screen.getByText('可预测项目')).toBeTruthy();
    expect(screen.getByText('7 / 7')).toBeTruthy();
    expect(screen.getByText('4:12')).toBeTruthy();
    expect(screen.getAllByText('4200 mL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('13 个').length).toBeGreaterThan(0);
    expect(screen.getByText('BMI下降')).toBeTruthy();
    expect(screen.queryByText('BMI改善')).toBeNull();
    expect(screen.getByText('预测大四体测成绩')).toBeTruthy();
    expect(screen.getByText('预测毕业总评')).toBeTruthy();
    expect(screen.getByText(DISCLAIMER)).toBeTruthy();
  });

  it('renders partial availability without a fabricated annual or final total', () => {
    render(<TrendPredictionPanel gender="male" summaries={partialSummaries()} />);

    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getByText('可预测项目')).toBeTruthy();
    expect(screen.getByText('5 / 7')).toBeTruthy();
    expect(screen.getByText('其余项目需要大一、大二、大三原始体测数据。')).toBeTruthy();
    expect(screen.queryByText('预测大四体测成绩')).toBeNull();
    expect(screen.queryByText('预测毕业总评')).toBeNull();
  });

  it('keeps the prediction entry collapsed by default and does not persist the toggle', () => {
    render(<TrendPredictionPanel gender="male" summaries={completeSummaries()} />);

    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));
    expect(screen.getByRole('button', { name: '收起预测' })).toBeTruthy();
    expect(localStorage.getItem('college-fitness-score-calculator:prediction')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '收起预测' }));
    expect(screen.getByRole('button', { name: '开始趋势预测' })).toBeTruthy();
    expect(screen.queryByText('预测大四体测成绩')).toBeNull();
  });

  it('shows compact sequences, recent changes and volatility without duplicate score or boilerplate labels', () => {
    const summaries = completeSummaries();
    summaries.year4.eventResults.vitalCapacity = completeResult(
      'vitalCapacity',
      [5094, 5438, 5411],
      5455,
      'declining',
      true,
    );

    render(<TrendPredictionPanel gender="male" summaries={summaries} />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    const vitalCard = screen.getByRole('article', { name: '肺活量' });
    const sequence = screen.getByRole('list', { name: '肺活量历史与预测序列' });
    expect(within(sequence).getByText('大四预测')).toBeTruthy();
    expect(within(sequence).getAllByText('5411 mL')).toHaveLength(1);
    expect(within(sequence).getByText('5455 mL')).toBeTruthy();
    expect(within(vitalCard).getByText('-27 mL')).toBeTruthy();
    expect(within(vitalCard).getByText('历史波动较大，预测参考价值较低')).toBeTruthy();
    expect(within(vitalCard).getByText('预测得分 90.00 分')).toBeTruthy();
    expect(within(vitalCard).queryByText('预测项目得分')).toBeNull();
    expect(within(vitalCard).queryByText('前三年有效原始成绩')).toBeNull();
    expect(within(vitalCard).queryByText('下降')).toBeNull();

    const runCard = screen.getByRole('article', { name: '1000 米跑' });
    expect(within(runCard).getByText('-12 秒')).toBeTruthy();
  });

  it('prioritizes volatility over BMI direction while retaining the numeric BMI label', () => {
    const summaries = completeSummaries();
    summaries.year4.eventResults.bmi = completeResult(
      'bmi',
      [26.9, 20.9, 30.9],
      34.9,
      'increasing',
      true,
    );

    render(<TrendPredictionPanel gender="male" summaries={summaries} />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    const bmiCard = screen.getByRole('article', { name: 'BMI / 身高体重' });
    expect(within(bmiCard).getByText('历史波动较大，预测参考价值较低')).toBeTruthy();
    expect(within(bmiCard).getByText('BMI上升')).toBeTruthy();
  });

  it('switches between year-two, year-three and year-four predictions with dynamic sequences', () => {
    render(<TrendPredictionPanel gender="male" summaries={completeSummaries()} />);
    fireEvent.click(screen.getByRole('button', { name: '开始趋势预测' }));

    expect(screen.getByRole('button', { name: '大四' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: '大二' }));
    expect(screen.getByRole('heading', { name: '大二趋势预测' })).toBeTruthy();
    expect(screen.getByText('预测大二体测成绩')).toBeTruthy();
    expect(screen.queryByText('大一、大二前的原始体测数据')).toBeNull();
    expect(screen.getByRole('list', { name: '肺活量历史与预测序列' }).querySelectorAll('li')).toHaveLength(2);
    expect(within(screen.getByRole('list', { name: '肺活量历史与预测序列' })).getByText('大二预测')).toBeTruthy();
    expect(screen.queryByText('大三预测')).toBeNull();
    expect(screen.queryByText('预测毕业总评')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '大三' }));
    expect(screen.getByRole('heading', { name: '大三趋势预测' })).toBeTruthy();
    expect(screen.getByText('预测大三体测成绩')).toBeTruthy();
    expect(screen.getByRole('list', { name: '肺活量历史与预测序列' }).querySelectorAll('li')).toHaveLength(3);
    expect(within(screen.getByRole('list', { name: '肺活量历史与预测序列' })).getByText('大三预测')).toBeTruthy();
    expect(screen.queryByText('预测毕业总评')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '大四' }));
    expect(screen.getByRole('heading', { name: '大四趋势预测' })).toBeTruthy();
    expect(screen.getByRole('list', { name: '肺活量历史与预测序列' }).querySelectorAll('li')).toHaveLength(4);
    expect(screen.getByText('预测毕业总评')).toBeTruthy();
    expect(screen.queryByText('预测大一')).toBeNull();
  });
});
