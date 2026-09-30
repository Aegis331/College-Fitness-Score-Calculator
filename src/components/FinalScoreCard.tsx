import type { FinalScoreSummary } from '../types/scoring';

interface FinalScoreCardProps {
  summary: FinalScoreSummary;
  yearScores: Array<number | null>;
}

export function FinalScoreCard({ summary, yearScores }: FinalScoreCardProps) {
  return (
    <section className="final-card" aria-labelledby="final-heading">
      <div className="eyebrow">FINAL RESULT</div>
      <h2 id="final-heading">大学体测总评</h2>
      <div className="final-number">{summary.score === null ? '--' : summary.score.toFixed(2)}</div>
      <span className="final-unit">分</span>
      <div className="final-breakdown">
        <div><span>大一</span><strong>{yearScores[0] === null ? '--' : yearScores[0].toFixed(2)}</strong></div>
        <div><span>大二</span><strong>{yearScores[1] === null ? '--' : yearScores[1].toFixed(2)}</strong></div>
        <div><span>大三</span><strong>{yearScores[2] === null ? '--' : yearScores[2].toFixed(2)}</strong></div>
        <div><span>大四</span><strong>{yearScores[3] === null ? '--' : yearScores[3].toFixed(2)}</strong></div>
      </div>
      <div className="formula-box">
        <span>前三年平均</span>
        <strong>{summary.firstThreeAverage === null ? '--' : summary.firstThreeAverage.toFixed(2)}</strong>
        {summary.completed ? (
          <p>{summary.firstThreeAverage?.toFixed(2)} × 50% + {yearScores[3]?.toFixed(2)} × 50% = {summary.score?.toFixed(2)}</p>
        ) : (
          <p>请完成四个学年的成绩后计算最终成绩</p>
        )}
      </div>
    </section>
  );
}
