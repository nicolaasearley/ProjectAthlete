import type { WorkoutBlock, MovementPattern, StrengthNumbers } from '@core/types';
import type { Exercise, ExerciseDifficulty } from '@core/types/exercise';
import { EXERCISES, getExercisesByPatternAndEquipment } from '@core/data/exercises';
import { getIntensityWave, getRepScheme, buildStrengthSets } from '../strength/strengthProgression';
import { useUserStore } from '@core/store/useUserStore';

interface GenerateStrengthBlockOptions {
  pattern: MovementPattern;
  dayIndex: number;
  equipmentIds: string[];
  experienceLevel: ExerciseDifficulty;
  strengthNumbers?: Record<string, number>;
  focusPatternOverride?: string; // NEW — weekly template override
  weekIndex?: number; // NEW — future periodization
}

/**
 * Check if user has equipment for an exercise
 */
function userHasEquipmentFor(
  exercise: Exercise,
  equipmentIds: string[]
): boolean {
  // If exercise requires no equipment, user always has it
  if (exercise.equipmentIds.length === 0) {
    return true;
  }
  // User must have at least one required equipment
  return exercise.equipmentIds.some((id) => equipmentIds.includes(id));
}

/**
 * Map exercise ID to corresponding 1RM field in strengthNumbers
 */
function getOneRmForExercise(
  exerciseId: string,
  strengthNumbers: StrengthNumbers | undefined
): number | null {
  if (!strengthNumbers) return null;

  // Map exercise IDs to 1RM fields
  const exerciseTo1Rm: Record<string, keyof StrengthNumbers> = {
    back_squat: 'squat1RM',
    front_squat: 'squat1RM',
    bench_press: 'bench1RM',
    db_bench_press: 'bench1RM',
    deadlift: 'deadlift1RM',
    sumo_deadlift: 'deadlift1RM',
    rdl: 'deadlift1RM',
    overhead_press: 'press1RM',
  };

  const field = exerciseTo1Rm[exerciseId];
  if (field && strengthNumbers[field]) {
    return strengthNumbers[field] as number;
  }

  return null;
}

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateStrengthBlock(options: GenerateStrengthBlockOptions): WorkoutBlock | null {
  const { pattern, dayIndex, equipmentIds, experienceLevel, strengthNumbers, focusPatternOverride } = options;

  /**
   * Map override → actual pattern
   * Strength-only (conditioning + rest handled upstream)
   */
  function resolveOverridePattern(override?: string): MovementPattern | null {
    if (!override) return pattern;

    switch (override) {
      case 'squat':
        return 'squat';

      case 'hinge':
        return 'hinge';

      case 'upper_push_pull':
        const upperPatterns: MovementPattern[] = [
          'horizontal_push',
          'horizontal_pull',
          'vertical_push',
          'vertical_pull',
        ];
        return upperPatterns[dayIndex % 4];

      case 'mixed_full_body':
        const fullBodyPatterns: MovementPattern[] = [
          'squat',
          'hinge',
          'horizontal_push',
          'horizontal_pull',
        ];
        return fullBodyPatterns[dayIndex % 4];

      case 'conditioning':
      case 'rest':
        // Should never reach strength engine — handled in dailyWorkout
        return null;

      default:
        return pattern;
    }
  }

  const resolvedPattern = resolveOverridePattern(focusPatternOverride);

  if (!resolvedPattern) {
    return {
      id: generateId('no-strength'),
      type: 'strength',
      title: 'No Strength Block',
      strengthMain: null,
      estimatedDurationMinutes: 0,
    };
  }

  /**
   * Fallback biomechanical patterns built into strength engine
   */
  function getFallbackStrengthPatterns(primary: MovementPattern): MovementPattern[] {
    switch (primary) {
      case 'squat':
        return ['hinge', 'lunge'];
      case 'hinge':
        return ['squat', 'lunge'];
      case 'horizontal_push':
        return ['vertical_push'];
      case 'vertical_push':
        return ['horizontal_push'];
      case 'horizontal_pull':
        return ['vertical_pull', 'hinge'];
      case 'vertical_pull':
        return ['horizontal_pull', 'hinge'];
      default:
        return ['squat', 'hinge'];
    }
  }

  /**
   * Try to find a main lift by progressively relaxing constraints
   */
  function selectStrengthExercise(pattern: MovementPattern): Exercise | null {
    // 1 — Try exact match + appropriate modality
    let candidates = EXERCISES.filter(
      (e) =>
        e.pattern === pattern &&
        e.tags.includes('strength') &&
        userHasEquipmentFor(e, equipmentIds)
    );

    // Filter by difficulty (prefer exact match, but allow any if none found)
    const difficultyFiltered = candidates.filter(
      (ex) => ex.difficulty === experienceLevel
    );
    if (difficultyFiltered.length > 0) {
      candidates = difficultyFiltered;
    }

    if (candidates.length > 0) {
      return candidates[dayIndex % candidates.length];
    }

    // 2 — Try biomechanical fallbacks
    const fallbacks = getFallbackStrengthPatterns(pattern);
    for (const fb of fallbacks) {
      let fbMatches = getExercisesByPatternAndEquipment(fb, equipmentIds);
      fbMatches = fbMatches.filter(
        (e) =>
          e.tags.includes('strength') && userHasEquipmentFor(e, equipmentIds)
      );

      // Filter by difficulty
      const fbDifficultyFiltered = fbMatches.filter(
        (ex) => ex.difficulty === experienceLevel
      );
      if (fbDifficultyFiltered.length > 0) {
        fbMatches = fbDifficultyFiltered;
      }

      if (fbMatches.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[StrengthEngine] Using fallback pattern:', fb);
        }
        return fbMatches[dayIndex % fbMatches.length];
      }
    }

    // 3 — Try ANY strength exercise user can do
    const global = EXERCISES.filter(
      (e) => e.tags.includes('strength') && userHasEquipmentFor(e, equipmentIds)
    );

    // Filter by difficulty
    const globalDifficultyFiltered = global.filter(
      (ex) => ex.difficulty === experienceLevel
    );
    const finalGlobal = globalDifficultyFiltered.length > 0 ? globalDifficultyFiltered : global;

    if (finalGlobal.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[StrengthEngine] Global fallback selection');
      }
      return finalGlobal[dayIndex % finalGlobal.length];
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn('[StrengthEngine] No valid strength exercises available');
    }
    return null;
  }

  // SELECT EXERCISE (override-aware)
  const mainLift = selectStrengthExercise(resolvedPattern);

  if (!mainLift) {
    return {
      id: generateId('no-strength'),
      type: 'strength',
      title: 'No Strength Exercise Available',
      strengthMain: null,
      estimatedDurationMinutes: 0,
    };
  }

  /**
   * Build the strength prescription using wave-based progression
   */
  const intensity = getIntensityWave(dayIndex);
  const repScheme = getRepScheme(experienceLevel, intensity.wave);

  // Pull 1RM from user store
  const userStore = useUserStore.getState();
  const oneRm = getOneRmForExercise(mainLift.id, userStore.strengthNumbers);

  const sets = buildStrengthSets(repScheme, intensity, oneRm);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[StrengthEngine] Selected main lift:', mainLift.name, {
      pattern: resolvedPattern,
      difficulty: mainLift.difficulty,
      wave: intensity.wave,
      sets: repScheme.sets,
      reps: repScheme.reps,
      rpe: intensity.rpe,
      oneRm,
    });
  }

  return {
    id: generateId('strength-main'),
    type: 'strength' as const,
    title: `Main Lift – ${mainLift.name}`,
    strengthMain: {
      exerciseId: mainLift.id,
      sets,
      wave: intensity.wave,
      rpe: intensity.rpe,
      percent: intensity.percent,
      oneRmUsed: oneRm ?? null,
    },
    estimatedDurationMinutes: 25 + repScheme.sets * 2, // ~2 min per set including rest
  };
}

