import type { WorkoutBlock } from '@core/types';
import { generateWarmupBlock } from '../blocks/generateWarmupBlock';
import { generateStrengthBlock } from '../blocks/generateStrengthBlock';
import { generateAccessoryBlock } from '../blocks/generateAccessoryBlock';
import { generateConditioningBlock } from '../blocks/generateConditioningBlock';
import { generateCooldownBlock } from '../blocks/generateCooldownBlock';
import type { MovementPattern } from '@core/types/exercise';

interface ConstructWorkoutBlocksOptions {
  focusPatternOverride?: string;
  selectedPattern: string | null;
  experienceLevel: string;
  goal: string;
  dayIndex: number;
  equipmentIds: string[];
  strengthNumbers?: Record<string, number>;
}

/**
 * Master constructor for assembling a workout day.
 * Guarantees consistent block ordering and metadata.
 */
export function constructWorkoutBlocks(
  options: ConstructWorkoutBlocksOptions
): {
  blocks: WorkoutBlock[];
  estimatedDurationMinutes: number;
} {
  const {
    focusPatternOverride,
    selectedPattern,
    experienceLevel,
    goal,
    dayIndex,
    equipmentIds,
    strengthNumbers,
  } = options;

  const blocks: WorkoutBlock[] = [];
  let totalDuration = 0;

  /**
   * 1. Warmup
   */
  const warmup = generateWarmupBlock({
    pattern: selectedPattern,
    experienceLevel,
    equipmentIds,
    dayIndex,
  });
  if (warmup) {
    blocks.push(warmup);
    totalDuration += warmup.estimatedDurationMinutes ?? 5;
  }

  /**
   * 2. Strength
   */
  const strength = generateStrengthBlock({
    pattern: (selectedPattern as MovementPattern) || 'squat',
    dayIndex,
    equipmentIds,
    experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
    strengthNumbers,
    focusPatternOverride,
  });
  if (strength) {
    blocks.push(strength);
    totalDuration += strength.estimatedDurationMinutes ?? 25;
  }

  /**
   * 3. Accessory (only if we have a strength block)
   */
  const accessory = strength
    ? generateAccessoryBlock({
        mainLiftId: strength.strengthMain?.exerciseId ?? null,
        mainPattern: selectedPattern,
        experienceLevel,
        focusPatternOverride,
        dayIndex,
        equipmentIds,
      })
    : null;
  if (accessory) {
    blocks.push(accessory);
    totalDuration += accessory.estimatedDurationMinutes ?? 15;
  }

  /**
   * 4. Conditioning (conditional based on goal and schedule)
   */
  // Determine if conditioning should be included based on goal and dayIndex
  const shouldIncludeConditioning = (() => {
    // dayIndex is 0–6 within the microcycle week
    switch (goal) {
      case 'conditioning':
        return true; // every day gets some engine work
      case 'hybrid':
        // every other day, e.g. 0, 2, 4
        return dayIndex % 2 === 0;
      case 'general':
        // ~2x per week, e.g. mid + late week
        return dayIndex === 2 || dayIndex === 5;
      case 'strength':
      default:
        // 1x per week (optional light engine focus)
        return dayIndex === 3;
    }
  })();

  if (shouldIncludeConditioning) {
    const conditioning = generateConditioningBlock({
      goal,
      experienceLevel,
      dayIndex,
      equipmentIds,
    });
    if (conditioning) {
      blocks.push(conditioning);
      totalDuration += conditioning.estimatedDurationMinutes ?? 20;
    }
  }

  /**
   * 5. Cooldown
   */
  const cooldown = generateCooldownBlock({});
  if (cooldown) {
    blocks.push(cooldown);
    totalDuration += cooldown.estimatedDurationMinutes ?? 5;
  }

  return {
    blocks,
    estimatedDurationMinutes: totalDuration,
  };
}

