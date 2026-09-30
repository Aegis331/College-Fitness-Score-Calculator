import type { ChangeEvent } from 'react';
import type { EventEntry, EventId, Gender, Grade, RawValue } from '../types/fitness';
import type { ScoreResult } from '../types/scoring';
import { EVENT_DEFINITIONS } from '../types/fitness';
import { BMI_INPUT_FIELD_SPECS, getMeasurementSpec, TIME_INPUT_FIELD_SPECS } from '../data/eventMeasurementRules';
import { calculateBMI, roundBMIForScoring } from '../utils/calculateBMI';
import { validateEventInput } from '../utils/inputValidation';
import { formatRunTime, parseRunTime } from '../utils/time';

interface EventInputProps {
  event: EventId;
  gender: Gender;
  grade: Grade;
  entry: EventEntry;
  result: ScoreResult | null;
  weight: number;
  onChange: (update: Partial<EventEntry>) => void;
}

function isBmiValue(raw: RawValue | null): raw is { heightCm: number | null; weightKg: number | null } {
  return typeof raw === 'object' && raw !== null && 'heightCm' in raw && 'weightKg' in raw;
}

function isTimeValue(raw: RawValue | null): raw is { seconds: number | null } {
  return typeof raw === 'object' && raw !== null && 'seconds' in raw;
}

function displayName(event: EventId, gender: Gender): string {
  if (event === 'enduranceRun') {
    return gender === 'male' ? '1000 米跑' : '800 米跑';
  }

  return EVENT_DEFINITIONS[event].label;
}

function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

export function EventInput({ event, gender, grade, entry, result, weight, onChange }: EventInputProps) {
  const definition = EVENT_DEFINITIONS[event];
  const raw = entry.raw;
  const hasCurrentInput = entry.mode === 'raw' ? raw !== null : entry.directScore !== null;
  const rawErrors = hasCurrentInput
    ? validateEventInput(event, entry.mode === 'raw' ? raw : null, entry.mode === 'direct' ? entry.directScore : null)
    : [];
  const timeParts = formatRunTime(isTimeValue(raw) ? raw.seconds : null);
  const scoredBMI = isBmiValue(raw) && raw.heightCm !== null && raw.weightKg !== null
    ? (() => {
        try {
          const rawBMI = calculateBMI(raw.heightCm, raw.weightKg);
          return roundBMIForScoring(rawBMI);
        } catch {
          return null;
        }
      })()
    : null;
  const directMax = 100;
  const measurementSpec = getMeasurementSpec(event);
  const inputId = `event-${grade}-${event}`;

  const handleNumberChange = (change: ChangeEvent<HTMLInputElement>) => {
    onChange({ raw: numberOrNull(change.target.value) });
  };

  const handleBmiChange = (field: 'heightCm' | 'weightKg', value: string) => {
    const current = isBmiValue(raw) ? raw : { heightCm: null, weightKg: null };
    onChange({ raw: { ...current, [field]: numberOrNull(value) } });
  };

  const handleTimeChange = (field: 'minutes' | 'seconds', value: string) => {
    const minutes = field === 'minutes' ? value : timeParts.minutes;
    const seconds = field === 'seconds' ? value : timeParts.seconds;
    onChange({ raw: { seconds: parseRunTime(minutes, seconds) } });
  };

  return (
    <article className="event-card">
      <div className="event-heading">
        <div>
          <h3>{displayName(event, gender)}</h3>
          <span className="event-unit">{definition.unit || '自动计算'} · {Math.round(weight * 100)}%</span>
        </div>
        {result ? <strong className="event-score-badge">{result.totalScore.toFixed(2)} 分</strong> : <span className="pending-badge">未完成</span>}
      </div>

      <div className="mode-switch" role="group" aria-label={`${displayName(event, gender)}录入方式`}>
        <label>
          <input
            type="radio"
            name={`${inputId}-mode`}
            checked={entry.mode === 'raw'}
            onChange={() => onChange({ mode: 'raw' })}
          />
          测试成绩
        </label>
        <label>
          <input
            type="radio"
            name={`${inputId}-mode`}
            checked={entry.mode === 'direct'}
            onChange={() => onChange({ mode: 'direct' })}
          />
          直接得分
        </label>
      </div>

      {entry.mode === 'raw' ? (
        <div className="raw-input-area">
          {definition.inputKind === 'bmi' && (
            <div className="field-grid two-columns">
              <label>
                身高（cm）
                <input
                  aria-label="身高（cm）"
                  type="number"
                  min={BMI_INPUT_FIELD_SPECS.heightCm.minimum}
                  max={BMI_INPUT_FIELD_SPECS.heightCm.maximum}
                  step={BMI_INPUT_FIELD_SPECS.heightCm.step}
                  value={isBmiValue(raw) && raw.heightCm !== null ? raw.heightCm : ''}
                  onChange={(change) => handleBmiChange('heightCm', change.target.value)}
                />
              </label>
              <label>
                体重（kg）
                <input
                  aria-label="体重（kg）"
                  type="number"
                  min={BMI_INPUT_FIELD_SPECS.weightKg.minimum}
                  max={BMI_INPUT_FIELD_SPECS.weightKg.maximum}
                  step={BMI_INPUT_FIELD_SPECS.weightKg.step}
                  value={isBmiValue(raw) && raw.weightKg !== null ? raw.weightKg : ''}
                  onChange={(change) => handleBmiChange('weightKg', change.target.value)}
                />
              </label>
            </div>
          )}

          {definition.inputKind === 'number' && (
            <label>
              测试成绩（{definition.unit}）
              <input
                aria-label="测试成绩"
                type="number"
                min={measurementSpec.minimum}
                max={measurementSpec.maximum}
                step={10 ** -measurementSpec.decimals}
                value={typeof raw === 'number' ? raw : ''}
                onChange={handleNumberChange}
              />
            </label>
          )}

          {definition.inputKind === 'time' && (
            <div className="field-grid two-columns time-fields">
              <label>
                分钟
                <input
                aria-label="分钟"
                type="number"
                min={TIME_INPUT_FIELD_SPECS.minutes.minimum}
                step={TIME_INPUT_FIELD_SPECS.minutes.step}
                  value={isTimeValue(raw) && raw.seconds !== null ? timeParts.minutes : ''}
                  onChange={(change) => handleTimeChange('minutes', change.target.value)}
                />
              </label>
              <label>
                秒
                <input
                aria-label="秒"
                type="number"
                min={TIME_INPUT_FIELD_SPECS.seconds.minimum}
                max={TIME_INPUT_FIELD_SPECS.seconds.maximum}
                step={TIME_INPUT_FIELD_SPECS.seconds.step}
                  value={isTimeValue(raw) && raw.seconds !== null ? timeParts.seconds : ''}
                  onChange={(change) => handleTimeChange('seconds', change.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <label>
          项目得分（0～{directMax} 分）
          <input
            aria-label="项目得分"
            type="number"
            min="0"
            max={directMax}
            step="0.01"
            value={entry.directScore ?? ''}
            onChange={(change) => onChange({ directScore: numberOrNull(change.target.value) })}
          />
        </label>
      )}

      {entry.mode === 'raw' && event === 'bmi' && scoredBMI !== null && (
        <p className="calculated-note">BMI：{scoredBMI.toFixed(1)}</p>
      )}
      {result && (
        <div className="score-result" aria-live="polite">
          <span>项目得分</span>
          <strong>{result.totalScore.toFixed(2)} 分</strong>
          {result.bonusScore > 0 && <small>基础 {result.baseScore} + 加分 {result.bonusScore}</small>}
        </div>
      )}
      {rawErrors.length > 0 && (
        <ul className="field-errors" role="alert">
          {rawErrors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </article>
  );
}
