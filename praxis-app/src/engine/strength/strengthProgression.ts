/**
 * Wave-1 Intensity Cycle:
 * 0 = Base
 * 1 = Load
 * 2 = Peak
 * 3 = Deload
 */
export interface IntensityWave {
  wave: 'base' | 'load' | 'peak' | 'deload';
  rpe: number;
  percent: number;
}

export function getIntensityWave(dayIndex: number): IntensityWave {
  const waveIndex = dayIndex % 4;

  switch (waveIndex) {
    case 0:
      return { wave: 'base', rpe: 7, percent: 0.7 };
    case 1:
      return { wave: 'load', rpe: 8, percent: 0.75 };
    case 2:
      return { wave: 'peak', rpe: 9, percent: 0.8 };
    case 3:
      return { wave: 'deload', rpe: 6, percent: 0.6 };
    default:
      return { wave: 'base', rpe: 7, percent: 0.7 };
  }
}

export interface RepScheme {
  sets: number;
  reps: number;
}

/**
 * Rep scheme selection based on experience + wave.
 */
export function getRepScheme(
  experienceLevel: string,
  wave: string
): RepScheme {
  if (experienceLevel === 'advanced') {
    switch (wave) {
      case 'base':
        return { sets: 4, reps: 6 };
      case 'load':
        return { sets: 5, reps: 5 };
      case 'peak':
        return { sets: 6, reps: 3 };
      case 'deload':
        return { sets: 3, reps: 8 };
      default:
        return { sets: 4, reps: 6 };
    }
  }

  if (experienceLevel === 'intermediate') {
    switch (wave) {
      case 'base':
        return { sets: 3, reps: 8 };
      case 'load':
        return { sets: 4, reps: 6 };
      case 'peak':
        return { sets: 5, reps: 5 };
      case 'deload':
        return { sets: 2, reps: 10 };
      default:
        return { sets: 3, reps: 8 };
    }
  }

  // Beginners
  return { sets: 3, reps: 10 };
}

import type { SetPrescription } from '@core/types';

/**
 * Build set prescription array.
 */
export function buildStrengthSets(
  repScheme: RepScheme,
  intensity: IntensityWave,
  oneRm: number | null | undefined
): SetPrescription[] {
  const sets = repScheme.sets;

  return Array.from({ length: sets }).map(() => ({
    targetReps: repScheme.reps,
    targetRpe: intensity.rpe,
    targetPercent1RM: oneRm ? intensity.percent : undefined,
  }));
}

