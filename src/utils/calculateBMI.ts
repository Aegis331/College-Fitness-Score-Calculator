const BMI_ROUNDING_FACTOR = 10;

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error('身高必须大于 0');
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('体重必须大于 0');
  }

  const heightMeters = heightCm / 100;
  return weightKg / (heightMeters * heightMeters);
}

export function roundBMIForScoring(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('BMI 必须是有限数值');
  }

  const scaledValue = value * BMI_ROUNDING_FACTOR;
  const floatingPointAdjustment = Number.EPSILON * Math.max(1, Math.abs(scaledValue));
  return Math.round(scaledValue + floatingPointAdjustment) / BMI_ROUNDING_FACTOR;
}
