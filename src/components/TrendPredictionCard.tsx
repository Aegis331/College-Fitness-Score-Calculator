import type { EventId, Gender } from '../types/fitness';
import {
  getPredictionHistoryGrades,
  type PredictionTargetGrade,
  type PredictedEventResult,
} from '../types/prediction';
import { EVENT_DEFINITIONS } from '../types/fitness';
import { getMeasurementSpec } from '../data/eventMeasurementRules';
import { formatRunTime } from '../utils/time';

function displayName(event: EventId, gender: Gender): string {
  if (event === 'enduranceRun') {
    return gender === 'male' ? '1000 米跑' : '800 米跑';
  }

  return EVENT_DEFINITIONS[event].label;
}

function formatValue(event: EventId, value: number | null): string {
  if (value === null) {
    return '—';
  }

  if (event === 'enduranceRun') {
    const time = formatRunTime(value);
    return `${time.minutes}:${String(time.seconds).padStart(2, '0')}`;
  }

  const spec = getMeasurementSpec(event);
  const formatted = value.toFixed(spec.decimals);
  if (event === 'bmi') {
    return formatted;
  }
  if (event === 'pullUp' || event === 'sitUp') {
    return `${formatted} 个`;
  }
  if (event === 'vitalCapacity') {
    return `${formatted} mL`;
  }

  return `${formatted} ${EVENT_DEFINITIONS[event].unit}`;
}

function formatMagnitude(event: EventId, value: number): string {
  if (event === 'enduranceRun') {
    const decimals = getMeasurementSpec(event).decimals;
    return `${Math.abs(value).toFixed(decimals)} 秒`;
  }

  return formatValue(event, Math.abs(value));
}

function formatRecentChange(event: EventId, value: number | null): string {
  if (value === null) {
    return '—';
  }

  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatMagnitude(event, value)}`;
}

const GRADE_LABELS: Record<PredictionTargetGrade | 'year1', string> = {
  year1: '大一',
  year2: '大二',
  year3: '大三',
  year4: '大四',
};

function predictionMethod(targetGrade: PredictionTargetGrade): string {
  if (targetGrade === 'year2') {
    return '保持型估算';
  }
  if (targetGrade === 'year3') {
    return '保持型 + 最近趋势型';
  }
  return '保持型 + 最近趋势型 + 长期趋势型';
}

function recentChangeLabel(targetGrade: PredictionTargetGrade): string | null {
  if (targetGrade === 'year2') {
    return null;
  }

  const historyGrades = getPredictionHistoryGrades(targetGrade);
  const previous = historyGrades.at(-2)!;
  const latest = historyGrades.at(-1)!;
  return `最近变化（${GRADE_LABELS[previous]} → ${GRADE_LABELS[latest]}）`;
}

function bmiTrendLabel(status: PredictedEventResult['trendStatus']): string | null {
  if (status === 'decreasing') {
    return 'BMI下降';
  }
  if (status === 'increasing') {
    return 'BMI上升';
  }
  if (status === 'stable') {
    return 'BMI基本稳定';
  }
  return null;
}

export interface TrendPredictionCardProps {
  gender: Gender;
  targetGrade: PredictionTargetGrade;
  result: PredictedEventResult;
}

export function TrendPredictionCard({ gender, targetGrade, result }: TrendPredictionCardProps) {
  const label = displayName(result.event, gender);
  const predictedScore = result.predictedEventScore;
  const bmiLabel = result.event === 'bmi' ? bmiTrendLabel(result.trendStatus) : null;
  const historyGrades = getPredictionHistoryGrades(targetGrade);
  const changeLabel = recentChangeLabel(targetGrade);
  const complete = result.availability.status === 'complete'
    && result.normalizedCenter.value !== null
    && result.normalizedScenarioMin.value !== null
    && result.normalizedScenarioMax.value !== null
    && predictedScore !== null;

  return (
    <article className="trend-card" aria-label={label}>
      <div className="trend-card-heading">
        <h3>{label}</h3>
        {complete && (
          <strong className="event-score-badge">预测得分 {predictedScore.totalScore.toFixed(2)} 分</strong>
        )}
      </div>

      <ol className="trend-sequence" aria-label={`${label}历史与预测序列`}>
        {historyGrades.map((grade, index) => (
          <li key={grade}>
            <strong>{formatValue(result.event, result.rawValues[index])}</strong>
            <span>{GRADE_LABELS[grade]}</span>
          </li>
        ))}
        {complete && (
          <li className="trend-sequence-predicted">
            <strong>{formatValue(result.event, result.normalizedCenter.value)}</strong>
            <span>{targetLabel(targetGrade)}预测</span>
          </li>
        )}
      </ol>

      {result.historyVolatile && (
        <p className="trend-volatility">历史波动较大，预测参考价值较低</p>
      )}

      {bmiLabel && (
        <p className="trend-bmi-status">{bmiLabel}</p>
      )}

      <div className="trend-detail-row">
        {changeLabel ? (
          <div>
            <span>{changeLabel}</span>
            <strong>{formatRecentChange(result.event, result.recentChange)}</strong>
          </div>
        ) : (
          <>
            <div>
              <span>预测依据</span>
              <strong>{GRADE_LABELS[historyGrades[0]]}</strong>
            </div>
            <div>
              <span>预测方式</span>
              <strong>{predictionMethod(targetGrade)}</strong>
            </div>
          </>
        )}
        {complete && (
          <div>
            <span>趋势情景范围</span>
            <strong>
              {formatValue(result.event, result.normalizedScenarioMin.value)} ～ {formatValue(result.event, result.normalizedScenarioMax.value)}
            </strong>
          </div>
        )}
      </div>
    </article>
  );
}

function targetLabel(targetGrade: PredictionTargetGrade): string {
  return GRADE_LABELS[targetGrade];
}
