import type { EventEntry, Grade } from './types/fitness';
import { useFitnessData } from './hooks/useFitnessData';
import { calculateFinalScore } from './utils/calculateFinalScore';
import { calculateYearScore } from './utils/calculateYearScore';
import { GenderSelector } from './components/GenderSelector';
import { YearTabs } from './components/YearTabs';
import { YearCard } from './components/YearCard';
import { ScoreOverview } from './components/ScoreOverview';
import { FinalScoreCard } from './components/FinalScoreCard';
import { TrendPredictionPanel } from './components/TrendPredictionPanel';
import { getRuleSet } from './data/scoringRules';
import type { PredictionSummary, PredictionTargetGrade } from './types/prediction';
import { PREDICTION_TARGET_GRADES } from './types/prediction';
import { calculatePredictionSummary } from './utils/calculatePredictionSummary';

const GRADES: Grade[] = ['year1', 'year2', 'year3', 'year4'];

function App() {
  const { state, activeYears, setGender, setCurrentGrade, updateEvent, clearAll } = useFitnessData();
  const summaries = GRADES.reduce((result, grade) => {
    result[grade] = calculateYearScore({
      gender: state.gender,
      grade,
      entries: activeYears[grade],
    });
    return result;
  }, {} as Record<Grade, ReturnType<typeof calculateYearScore>>);
  const yearScores = GRADES.map((grade) => summaries[grade].score);
  const finalSummary = calculateFinalScore(yearScores);
  const predictionSummaries = PREDICTION_TARGET_GRADES.reduce<Record<PredictionTargetGrade, PredictionSummary>>(
    (result, targetGrade) => {
      result[targetGrade] = calculatePredictionSummary({
        gender: state.gender,
        targetGrade,
        years: activeYears,
        actualYearScores: [summaries.year1.score, summaries.year2.score, summaries.year3.score],
      });
      return result;
    },
    {} as Record<PredictionTargetGrade, PredictionSummary>,
  );
  const currentSummary = summaries[state.currentGrade];
  const source = getRuleSet(state.gender, state.currentGrade).source;

  const handleClear = () => {
    if (window.confirm('确定要清空男生和女生的全部四年体测数据吗？此操作不可撤销。')) {
      clearAll();
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">COLLEGE FITNESS · 2014 REFERENCE</span>
          <h1>大学生体测成绩计算器</h1>
          <p>记录四年体测成绩，自动计算单项得分、学年成绩与大学总评。</p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span>FIT</span>
          <strong>4</strong>
        </div>
      </header>

      <main className="dashboard">
        <section className="workspace-column">
          <div className="control-card">
            <div>
              <span className="eyebrow">PROFILE</span>
              <h2>选择性别与学年</h2>
            </div>
            <GenderSelector gender={state.gender} onChange={setGender} />
          </div>

          <YearTabs currentGrade={state.currentGrade} onChange={setCurrentGrade} />

          <YearCard
            gender={state.gender}
            grade={state.currentGrade}
            entries={activeYears[state.currentGrade]}
            summary={currentSummary}
            onUpdate={(event, update: Partial<EventEntry>) => updateEvent(state.currentGrade, event, update)}
          />
        </section>

        <aside className="summary-column">
          <FinalScoreCard summary={finalSummary} yearScores={yearScores} />
          <ScoreOverview summaries={summaries} />
          <section className="source-card">
            <span className="eyebrow">RULE SOURCE</span>
            <p>{source.note}</p>
            <a href={source.url} target="_blank" rel="noreferrer">查看评分表来源 ↗</a>
            <button type="button" className="clear-button" onClick={handleClear}>清空全部数据</button>
          </section>
        </aside>
      </main>

      <TrendPredictionPanel gender={state.gender} summaries={predictionSummaries} />

      <footer className="app-footer">
        <span>本地自动保存 · 未填写项目不会计为 0 分</span>
        <span>当前版本 v2</span>
      </footer>
    </div>
  );
}

export default App;
