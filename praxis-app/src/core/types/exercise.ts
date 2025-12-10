// -----------------------------
//   EXERCISE DATA MODELS
// -----------------------------

/**
 * Movement patterns for exercise classification
 */
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'carry'
  | 'core'
  | 'lunge'
  | 'unilateral_lower'
  | 'unilateral_upper'
  | 'locomotion'
  | 'conditioning';

/**
 * Equipment modality for exercises
 */
export type Modality =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'cardio_machine'
  | 'sled'
  | 'band'
  | 'other';

/**
 * Exercise difficulty level
 */
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Exercise tags for filtering and categorization
 */
export type ExerciseTag =
  | 'strength'
  | 'hypertrophy'
  | 'power'
  | 'conditioning'
  | 'hyrox'
  | 'warmup'
  | 'primer'
  | 'finisher'
  | 'unilateral'
  | 'bilateral'
  | 'posterior_chain'
  | 'anterior_chain'
  | 'upper'
  | 'lower'
  | 'full_body'
  | 'core_anti_extension'
  | 'core_anti_rotation'
  | 'carry'
  | 'grip'
  | 'unilateral_lower'
  | 'unilateral_upper'
  | 'locomotion';

/**
 * Primary muscle groups (aligned with existing MuscleGroup type)
 */
export type PrimaryMuscle =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body';

/**
 * Exercise model for the exercise library
 */
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  primaryMuscles: PrimaryMuscle[];
  secondaryMuscles?: PrimaryMuscle[];
  pattern: MovementPattern;
  modality: Modality;
  equipmentIds: string[]; // Must match equipment IDs from onboarding/preferences
  difficulty: ExerciseDifficulty;
  tags: ExerciseTag[];
  isUnilateral?: boolean;
  notes?: string;
}

