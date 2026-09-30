function toNumber(value: number | string): number | null {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRunTime(
  minutes: number | string,
  seconds: number | string,
): number | null {
  const minuteValue = toNumber(minutes);
  const secondValue = toNumber(seconds);

  if (
    minuteValue === null ||
    secondValue === null ||
    !Number.isInteger(minuteValue) ||
    !Number.isInteger(secondValue) ||
    minuteValue < 0 ||
    secondValue < 0 ||
    secondValue > 59
  ) {
    return null;
  }

  return minuteValue * 60 + secondValue;
}

export function parseRunTimeText(value: string): number | null {
  const match = value.trim().match(/^(\d+)\s*:\s*(\d{1,2})$/);
  return match ? parseRunTime(match[1], match[2]) : null;
}

export function formatRunTime(totalSeconds: number | null): { minutes: number; seconds: number } {
  if (totalSeconds === null || !Number.isInteger(totalSeconds) || totalSeconds < 0) {
    return { minutes: 0, seconds: 0 };
  }

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}
