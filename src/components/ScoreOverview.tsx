import type { Grade } from '../types/fitness';
import type { YearScoreSummary } from '../types/scoring';

const YEAR_LABELS: Record<Grade, string> = {
  year1: '大一',
  year2: '大二',
  year3: '大三',
  year4: '大四',
};

interface ScoreOverviewProps {
  summaries: Record<Grade, YearScoreSummary>;
}

export function ScoreOverview({ summaries }: ScoreOverviewProps) {
  return (
    <section className="overview-card" aria-labelledby="overview-heading">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">PROGRESS</span>
          <h2 id="overview-heading">四年成绩总览</h2>
        </div>
      </div>
      <div className="overview-list">
        {(['year1', 'year2', 'year3', 'year4'] as Grade[]).map((grade) => {
          const summary = summaries[grade];
          return (
            <div className="overview-row" key={grade}>
              <span>{YEAR_LABELS[grade]}</span>
              <div className="overview-progress"><span style={{ width: `${(summary.completedEvents / summary.totalEvents) * 100}%` }} /></div>
              <strong>{summary.score === null ? '--' : summary.score.toFixed(2)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
