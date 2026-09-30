import type { EventEntry, Gender, Grade, YearRecord } from '../types/fitness';
import { getEventsForGender } from '../types/fitness';
import type { YearScoreSummary } from '../types/scoring';
import { getRuleSet } from '../data/scoringRules';
import { EventInput } from './EventInput';

const YEAR_LABELS: Record<Grade, string> = {
  year1: '大一',
  year2: '大二',
  year3: '大三',
  year4: '大四',
};

interface YearCardProps {
  gender: Gender;
  grade: Grade;
  entries: YearRecord;
  summary: YearScoreSummary;
  onUpdate: (event: keyof YearRecord, update: Partial<EventEntry>) => void;
}

export function YearCard({ gender, grade, entries, summary, onUpdate }: YearCardProps) {
  return (
    <section className="year-card" aria-labelledby={`${grade}-heading`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CURRENT YEAR</span>
          <h2 id={`${grade}-heading`}>{YEAR_LABELS[grade]} · {gender === 'male' ? '男生' : '女生'}</h2>
        </div>
        <div className="year-score">
          <span>学年成绩</span>
          <strong>{summary.score === null ? '--' : summary.score.toFixed(2)}</strong>
        </div>
      </div>
      <div className="completion-bar" aria-label={`已完成 ${summary.completedEvents} / ${summary.totalEvents} 个项目`}>
        <span style={{ width: `${(summary.completedEvents / summary.totalEvents) * 100}%` }} />
      </div>
      <div className="event-list">
        {getEventsForGender(gender).map((event) => (
          <EventInput
            key={event}
            event={event}
            gender={gender}
            grade={grade}
            entry={entries[event]}
            result={summary.eventScores[event] ?? null}
            weight={getRuleSet(gender, grade).events[event]?.weight ?? 0}
            onChange={(update) => onUpdate(event, update)}
          />
        ))}
      </div>
      <p className="year-footnote">权重按当前参考评分表计算；未填写项目不会被当作 0 分。</p>
    </section>
  );
}
