import type { WorkoutBlock } from '@core/types';
import { EXERCISES } from '@core/data/exercises';
import {
  getAccessoryVolume,
  getAccessoryTagsForPattern,
  pickRotating,
} from '../strength/accessoryProgression';

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface GenerateAccessoryBlockOptions {
  mainLiftId?: string | null;
  experienceLevel: string;
  focusPatternOverride?: string;
  dayIndex: number;
  equipmentIds: string[];
  mainPattern?: string; // Actual movement pattern (squat, hinge, etc.)
}

/**
 * Unified Accessory Block Generator (override-aware)
 */
export function generateAccessoryBlock(
  options: GenerateAccessoryBlockOptions
): WorkoutBlock | null {
  const {
    mainLiftId,
    experienceLevel,
    focusPatternOverride,
    dayIndex,
    equipmentIds,
  } = options;

  // No accessories on non-strength days
  if (
    focusPatternOverride === 'conditioning' ||
    focusPatternOverride === 'rest'
  ) {
    return null;
  }

  /**
   * Resolve main pattern from override
   */
  function resolveMainPattern(override?: string): string {
    if (!override) return 'squat';

    switch (override) {
      case 'squat':
      case 'hinge':
      case 'horizontal_push':
      case 'horizontal_pull':
      case 'vertical_push':
      case 'vertical_pull':
        return override;
      case 'upper_push_pull':
        const upperPatterns = [
          'horizontal_push',
          'horizontal_pull',
          'vertical_push',
          'vertical_pull',
        ];
        return upperPatterns[dayIndex % 4];
      case 'mixed_full_body':
        const fullBodyPatterns = [
          'squat',
          'hinge',
          'horizontal_push',
          'horizontal_pull',
        ];
        return fullBodyPatterns[dayIndex % 4];
      default:
        return 'squat';
    }
  }

  // Resolve main pattern from override or use provided pattern
  const mainPattern = options.mainPattern || resolveMainPattern(focusPatternOverride);

  // Balanced accessory tag templates
  const tags = getAccessoryTagsForPattern(mainPattern);

  // Volume progression
  const volume = getAccessoryVolume(dayIndex);

  // Build list of candidates per tag
  const chosen = tags
    .map((tag) => {
      const matches = EXERCISES.filter(
        (e) =>
          e.tags?.includes(tag) &&
          (!equipmentIds.length ||
            e.equipmentIds.some((eq) => equipmentIds.includes(eq))) &&
          e.id !== mainLiftId // avoid duplicating main lift
      );
      return pickRotating(matches, dayIndex);
    })
    .filter((ex): ex is NonNullable<typeof ex> => ex !== null); // remove nulls

  if (chosen.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AccessoryEngine] No accessory exercises available');
    }
    return null;
  }

  // Convert into block structure
  const accessory = chosen.map((ex) => ({
    exerciseId: ex.id,
    sets: Array.from({ length: volume.sets }, () => ({
      targetReps: volume.reps,
      targetRpe: 7,
    })),
  }));

  if (process.env.NODE_ENV !== 'production') {
    console.log('[AccessoryEngine] Selected accessory exercises:', {
      tags,
      count: chosen.length,
      exercises: chosen.map((e) => e.name),
      volume,
    });
  }

  return {
    id: generateId('accessory'),
    type: 'accessory',
    title: 'Accessory Work',
    accessory,
    estimatedDurationMinutes: 10 * accessory.length,
  };
}

