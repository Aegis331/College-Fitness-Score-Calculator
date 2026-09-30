import { useState } from 'react';
import type { Gender } from '../types/fitness';
import { getEventsForGender } from '../types/fitness';
import {
  PREDICTION_TARGET_GRADES,
  type PredictionTargetGrade,
  type PredictedEventResult,
  type PredictionSummary,
} from '../types/prediction';
import { TrendPredictionCard } from './TrendPredictionCard';

const TARGET_LABELS: Record<PredictionTargetGrade, string> = {
  year2: '大二',
  year3: '大三',
  year4: '大四',
};

const PREDICTION_BASIS: Record<PredictionTargetGrade, string> = {
  year2: '大一原始体测数据',
  year3: '大一、大二原始体测数据',
  year4: '大一、大二、大三原始体测数据',
};

function getTargetLabel(targetGrade: PredictionTargetGrade): string {
  return TARGET_LABELS[targetGrade];
}

function getScoreLabel(targetGrade: PredictionTargetGrade): string {
  return `预测${getTargetLabel(targetGrade)}体测成绩`;
}

export interface TrendPredictionPanelProps {
  gender: Gender;
  summaries: Record<PredictionTargetGrade, PredictionSummary>;
}

export function TrendPredictionPanel({ gender, summaries }: TrendPredictionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [targetGrade, setTargetGrade] = useState<PredictionTargetGrade>('year4');
  const summary = summaries[targetGrade];
  const targetLabel = getTargetLabel(targetGrade);
  const events = getEventsForGender(gender);
  const visibleResults = events
    .map((event) => summary.eventResults[event])
    .filter((result): result is PredictedEventResult => (
      result?.availability.status === 'complete'
      || result?.availability.status === 'recent-change-only'
    ));

  if (!expanded) {
    return (
      <section className="trend-panel trend-panel-collapsed" aria-labelledby="trend-heading">
        <div className="trend-entry">
          <div>
            <span className="eyebrow">TREND PREDICTION</span>
            <h2 id="trend-heading">趋势预测</h2>
            <p>根据目标学年前的原始体测数据，估算大二、大三或大四各项目表现；选择大四时还可查看毕业总评。</p>
            <p className="trend-entry-note">预测结果仅作为参考，不会修改真实成绩。</p>
          </div>
          <button
            type="button"
            className="trend-toggle"
            aria-expanded={false}
            onClick={() => setExpanded(true)}
          >
            开始趋势预测
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="trend-panel" aria-labelledby="trend-heading">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">TREND PREDICTION</span>
          <h2 id="trend-heading">{targetLabel}趋势预测</h2>
        </div>
        <button
          type="button"
          className="trend-toggle trend-toggle-secondary"
          aria-expanded={true}
          onClick={() => setExpanded(false)}
        >
          收起预测
        </button>
      </div>

      <div className="trend-target-selector" aria-label="预测学年">
        <span>预测学年</span>
        <div className="trend-target-options">
          {PREDICTION_TARGET_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              className={grade === targetGrade ? 'trend-target-option active' : 'trend-target-option'}
              aria-pressed={grade === targetGrade}
              onClick={() => setTargetGrade(grade)}
            >
              {getTargetLabel(grade)}
            </button>
          ))}
        </div>
      </div>

      <p className="trend-current-target">当前预测：{targetLabel}趋势预测</p>
      <p className="trend-overview-note">预测依据：{PREDICTION_BASIS[targetGrade]}。</p>

      <div className="trend-overview" aria-label={`${targetLabel}预测总览`}>
        <div>
          <span>可预测项目</span>
          <strong>{summary.predictedYear.predictableEvents} / {summary.predictedYear.totalEvents}</strong>
        </div>
        {summary.predictedYear.completed && summary.predictedYear.score !== null && (
          <div>
            <span>{getScoreLabel(targetGrade)}</span>
            <strong>{summary.predictedYear.score.toFixed(2)} 分</strong>
          </div>
        )}
        {targetGrade === 'year4' && summary.predictedFinal?.completed && summary.predictedFinal.score !== null && (
          <div>
            <span>预测毕业总评</span>
            <strong>{summary.predictedFinal.score.toFixed(2)} 分</strong>
          </div>
        )}
      </div>

      {summary.predictedYear.predictableEvents === 0 ? (
        <p className="trend-empty">当前没有可预测项目。请先录入{PREDICTION_BASIS[targetGrade]}。</p>
      ) : (
        <>
          {summary.predictedYear.predictableEvents < summary.predictedYear.totalEvents && (
            <p className="trend-partial-note">其余项目需要{PREDICTION_BASIS[targetGrade]}。</p>
          )}
          <div className="trend-event-list">
            {visibleResults.map((result) => (
              <TrendPredictionCard key={result.event} gender={gender} targetGrade={targetGrade} result={result} />
            ))}
          </div>
        </>
      )}

      <p className="trend-disclaimer">趋势预测仅根据目标学年之前的历史体测数据估算，用于参考，不代表实际测试结果。</p>
    </section>
  );
}
