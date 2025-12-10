import { getIntensityWave } from '../strength/strengthProgression';

export type Zone = 2 | 3 | 4 | 5;

export type ConditioningDayType =
  | 'strength_day'
  | 'mixed_day'
  | 'engine_day'
  | 'rest';

export type ConditioningStyle = 'z2' | 'tempo' | 'intervals' | 'hyrox' | 'race_simulation';

export interface ConditioningPrescription {
  zone: Zone;
  duration: number;
  style: ConditioningStyle;
  dayType: ConditioningDayType;
  wave: 'base' | 'load' | 'peak' | 'deload';
}

export function getConditioningDayType(dayIndex: number): ConditioningDayType {
  const mod = dayIndex % 7;
  switch (mod) {
    case 0:
      return 'strength_day';
    case 1:
      return 'mixed_day';
    case 2:
      return 'engine_day';
    case 3:
      return 'strength_day';
    case 4:
      return 'mixed_day';
    case 5:
      return 'engine_day';
    default:
      return 'rest';
  }
}

/**
 * Returns conditioning zone + duration based on day type + user goal + intensity wave.
 */
export function getConditioningPrescription(
  dayIndex: number,
  goal: string,
  timeAvailability: string
): ConditioningPrescription {
  const wave = getIntensityWave(dayIndex).wave;
  const dayType = getConditioningDayType(dayIndex);

  // Map timeAvailability → duration base
  const baseDuration =
    timeAvailability === 'short'
      ? 8
      : timeAvailability === 'standard'
        ? 12
        : 20; // full session

  // Start with defaults
  let zone: Zone = 2;
  let duration = baseDuration;
  let style: ConditioningStyle = 'z2';

  if (dayType === 'strength_day') {
    zone = 2;
    style = 'z2';
    duration = baseDuration;
  }

  if (dayType === 'mixed_day') {
    zone = goal === 'hybrid' ? 3 : 2;
    style = goal === 'hybrid' ? 'tempo' : 'z2';
    duration = baseDuration + 5;
  }

  if (dayType === 'engine_day') {
    zone = goal === 'conditioning' ? 4 : 3;
    style = 'intervals';
    duration = baseDuration + 10;
  }

  // Apply intensity wave scaling
  if (wave === 'load') duration += 3;
  if (wave === 'peak') duration += 6;
  if (wave === 'deload') duration = Math.floor(duration * 0.6);

  return { zone, duration, style, dayType, wave };
}

