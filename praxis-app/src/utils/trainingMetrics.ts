import type { WorkoutPlanDay } from '@core/types';
import { getExerciseById } from '@core/data/exercises';

/**
 * Pattern multipliers for strength volume calculation
 * Approximate load using reps × sets × movement multiplier
 */
const patternMultiplier: Record<string, number> = {
  squat: 1.6,
  hinge: 1.8,
  horizontal_push: 1.3,
  horizontal_pull: 1.4,
  vertical_push: 1.4,
  vertical_pull: 1.5,
  full_body: 1.7,
  core: 0.5,
  conditioning: 0,
};

/**
 * Calculate weekly strength volume based on reps, sets, and movement pattern
 */
export function calculateWeeklyStrengthVolume(
  week: WorkoutPlanDay[]
): number {
  let totalVolume = 0;

  week.forEach((day) => {
    day?.blocks?.forEach((block) => {
      if (block.type !== 'strength') return;

      // Try to get pattern from exercise, fallback to full_body
      let pattern = 'full_body';
      if (block.strengthMain?.exerciseId) {
        const exercise = getExerciseById(block.strengthMain.exerciseId);
        if (exercise) {
          pattern = exercise.pattern;
        }
      }

      const sets = block.strengthMain?.sets ?? [];
      const totalReps = sets.reduce(
        (acc, set) => acc + (set.targetReps ?? 0),
        0
      );

      const multiplier = patternMultiplier[pattern] ?? 1;
      totalVolume += totalReps * multiplier;
    });
  });

  return Math.round(totalVolume);
}

/**
 * Calculate total weekly engine (conditioning) time in minutes
 */
export function calculateWeeklyEngineTime(week: WorkoutPlanDay[]): number {
  let totalMinutes = 0;

  week.forEach((day) => {
    const engineBlock = day?.blocks?.find((b) => b.type === 'conditioning');
    if (!engineBlock) return;
    totalMinutes += engineBlock.estimatedDurationMinutes ?? 0;
  });

  return totalMinutes;
}

/**
 * Calculate hybrid score combining strength volume and engine time
 * Normalizes into a single "load" score
 */
export function calculateHybridScore(
  strengthVolume: number,
  engineMinutes: number
): number {
  return Math.round(strengthVolume * 2 + engineMinutes * 3);
}

/**
 * Determine the best (longest) training day in a week
 */
export function determineBestTrainingDay(
  week: WorkoutPlanDay[]
): WorkoutPlanDay | null {
  return (
    week
      .filter((d) => (d?.estimatedDurationMinutes ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.estimatedDurationMinutes ?? 0) -
          (a.estimatedDurationMinutes ?? 0)
      )[0] ?? null
  );
}

