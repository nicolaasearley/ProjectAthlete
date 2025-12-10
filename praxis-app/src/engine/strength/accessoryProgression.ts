import { getIntensityWave } from './strengthProgression';
import type { Exercise } from '@core/types/exercise';

export interface AccessoryVolume {
  sets: number;
  reps: number;
}

/**
 * Accessory volume is wave-scaled but lighter than main lift.
 */
export function getAccessoryVolume(dayIndex: number): AccessoryVolume {
  const wave = getIntensityWave(dayIndex).wave;

  switch (wave) {
    case 'base':
      return { sets: 2, reps: 10 };
    case 'load':
      return { sets: 3, reps: 10 };
    case 'peak':
      return { sets: 4, reps: 8 };
    case 'deload':
      return { sets: 2, reps: 12 };
    default:
      return { sets: 2, reps: 10 };
  }
}

/**
 * Accessory pattern balancing templates.
 */
export function getAccessoryTagsForPattern(pattern: string): string[] {
  switch (pattern) {
    case 'squat':
      return ['unilateral_lower', 'posterior_chain', 'core'];
    case 'hinge':
      return ['posterior_chain', 'unilateral_lower', 'core'];
    case 'horizontal_push':
      return ['horizontal_pull', 'triceps', 'scapular_stability'];
    case 'horizontal_pull':
      return ['horizontal_push', 'biceps', 'core_anti_rotation'];
    case 'vertical_push':
      return ['vertical_pull', 'triceps', 'scapular_stability'];
    case 'vertical_pull':
      return ['vertical_push', 'biceps', 'core'];
    default:
      return ['core', 'posterior_chain'];
  }
}

/**
 * Rotating selection to avoid repeating the same accessory every day.
 */
export function pickRotating(
  exercises: Exercise[],
  dayIndex: number
): Exercise | null {
  if (exercises.length === 0) return null;
  const index = dayIndex % exercises.length;
  return exercises[index];
}

