import type { Exercise } from '@core/types/exercise';

/**
 * Check if user has equipment for an exercise
 */
export function userHasEquipmentFor(
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

