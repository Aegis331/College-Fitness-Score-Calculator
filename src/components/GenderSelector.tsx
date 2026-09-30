import type { Gender } from '../types/fitness';

interface GenderSelectorProps {
  gender: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderSelector({ gender, onChange }: GenderSelectorProps) {
  return (
    <div className="segmented-control" aria-label="性别选择">
      <button type="button" aria-pressed={gender === 'male'} onClick={() => onChange('male')}>
        男生
      </button>
      <button type="button" aria-pressed={gender === 'female'} onClick={() => onChange('female')}>
        女生
      </button>
    </div>
  );
}
