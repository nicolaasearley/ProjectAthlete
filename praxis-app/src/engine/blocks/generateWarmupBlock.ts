import type { WorkoutBlock } from '@core/types';
import { getExercisesByTag } from '@core/data/exercises';

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface GenerateWarmupBlockOptions {
  pattern?: string | null;
  experienceLevel: string;
  equipmentIds?: string[];
  dayIndex?: number;
}

/**
 * Generate warmup block
 */
export function generateWarmupBlock(
  options: GenerateWarmupBlockOptions
): WorkoutBlock | null {
  const { equipmentIds = [], dayIndex = 0 } = options;

  // Get exercises tagged as warmup, primer, or core_anti_extension
  const warmupCandidates = [
    ...getExercisesByTag('warmup'),
    ...getExercisesByTag('primer'),
    ...getExercisesByTag('core_anti_extension'),
  ].filter(
    (exercise) =>
      exercise.equipmentIds.length === 0 ||
      exercise.equipmentIds.some((id) => equipmentIds.includes(id))
  );

  // Remove duplicates by id
  const uniqueWarmups = Array.from(
    new Map(warmupCandidates.map((ex) => [ex.id, ex])).values()
  );

  if (uniqueWarmups.length === 0) {
    return null;
  }

  // Select 2-3 exercises, rotating based on dayIndex
  const selected: typeof uniqueWarmups = [];
  const count = Math.min(3, uniqueWarmups.length);
  for (let i = 0; i < count; i++) {
    const index = (dayIndex + i) % uniqueWarmups.length;
    selected.push(uniqueWarmups[index]);
  }

  return {
    id: generateId('warmup'),
    type: 'warmup',
    title: 'Warm-Up',
    warmupItems: selected.map((ex) => ex.name),
    estimatedDurationMinutes: 5 + selected.length * 2, // ~2 min per exercise
  };
}

