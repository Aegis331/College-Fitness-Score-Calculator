import type { Grade } from '../types/fitness';

const GRADES: Array<{ id: Grade; label: string }> = [
  { id: 'year1', label: '大一' },
  { id: 'year2', label: '大二' },
  { id: 'year3', label: '大三' },
  { id: 'year4', label: '大四' },
];

interface YearTabsProps {
  currentGrade: Grade;
  onChange: (grade: Grade) => void;
}

export function YearTabs({ currentGrade, onChange }: YearTabsProps) {
  return (
    <div className="year-tabs" role="tablist" aria-label="学年选择">
      {GRADES.map((grade) => (
        <button
          key={grade.id}
          type="button"
          role="tab"
          aria-selected={currentGrade === grade.id}
          onClick={() => onChange(grade.id)}
        >
          {grade.label}
        </button>
      ))}
    </div>
  );
}
