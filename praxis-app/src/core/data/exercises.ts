import {
  Exercise,
  MovementPattern,
  Modality,
  ExerciseDifficulty,
  ExerciseTag,
} from '../types/exercise';

//
// 🔥 BASE EXERCISE LIBRARY — PHASE 1 (≈ 40 EXERCISES)
// Clean, consistent, engine-friendly definitions
//

export const EXERCISES: Exercise[] = [
  //
  // ────────────────────────────────────────────
  // BARBELL — COMPOUNDS
  // ────────────────────────────────────────────
  //

  {
    id: 'back_squat',
    name: 'Back Squat',
    description: 'Barbell squat focusing on quads, glutes, and core stability.',
    pattern: 'squat',
    modality: 'barbell',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['core'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'lower', 'bilateral', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'front_squat',
    name: 'Front Squat',
    description: 'Front-loaded barbell squat emphasizing quads and upper back.',
    pattern: 'squat',
    modality: 'barbell',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['back', 'core'],
    difficulty: 'advanced',
    equipmentIds: ['barbell'],
    tags: ['strength', 'lower', 'bilateral', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'deadlift',
    name: 'Deadlift',
    description: 'Barbell deadlift emphasizing posterior chain strength.',
    pattern: 'hinge',
    modality: 'barbell',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'posterior_chain', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    description: 'Hip hinge variation targeting hamstrings and glutes.',
    pattern: 'hinge',
    modality: 'barbell',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes', 'core'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'posterior_chain', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'sumo_deadlift',
    name: 'Sumo Deadlift',
    description: 'Wide-stance deadlift emphasizing inner thighs and glutes.',
    pattern: 'hinge',
    modality: 'barbell',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['quads'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'posterior_chain'],
    isUnilateral: false,
  },

  {
    id: 'bench_press',
    name: 'Bench Press',
    description: 'Horizontal barbell press for chest, shoulders, and triceps.',
    pattern: 'horizontal_push',
    modality: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['arms', 'shoulders'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'upper', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'incline_bench',
    name: 'Incline Bench Press',
    description: 'Incline press emphasizing upper chest and shoulders.',
    pattern: 'horizontal_push',
    modality: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['arms', 'shoulders'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'upper'],
    isUnilateral: false,
  },

  {
    id: 'overhead_press',
    name: 'Overhead Press',
    description: 'Strict shoulder press building overhead strength.',
    pattern: 'vertical_push',
    modality: 'barbell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['arms', 'core'],
    difficulty: 'advanced',
    equipmentIds: ['barbell'],
    tags: ['strength', 'upper'],
    isUnilateral: false,
  },

  {
    id: 'bent_over_row',
    name: 'Bent-Over Row',
    description: 'Horizontal pull targeting lats and upper back.',
    pattern: 'horizontal_pull',
    modality: 'barbell',
    primaryMuscles: ['back'],
    secondaryMuscles: ['back', 'arms'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'upper'],
    isUnilateral: false,
  },

  {
    id: 'barbell_hip_thrust',
    name: 'Barbell Hip Thrust',
    description: 'Glute-dominant strength lift focused on hip extension.',
    pattern: 'hinge',
    modality: 'barbell',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    difficulty: 'intermediate',
    equipmentIds: ['barbell'],
    tags: ['strength', 'posterior_chain', 'hypertrophy'],
    isUnilateral: false,
  },

  //
  // ────────────────────────────────────────────
  // DUMBBELL MOVEMENTS
  // ────────────────────────────────────────────
  //

  {
    id: 'db_bench_press',
    name: 'DB Bench Press',
    description: 'Dumbbell horizontal press emphasizing unilateral balance.',
    pattern: 'horizontal_push',
    modality: 'dumbbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['arms', 'shoulders'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'db_incline_press',
    name: 'DB Incline Press',
    description: 'Incline dumbbell press for upper chest.',
    pattern: 'horizontal_push',
    modality: 'dumbbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['shoulders', 'arms'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'db_shoulder_press',
    name: 'DB Shoulder Press',
    description: 'Seated or standing dumbbell overhead press.',
    pattern: 'vertical_push',
    modality: 'dumbbell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['arms'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper'],
    isUnilateral: false,
  },

  {
    id: 'db_row',
    name: 'DB Row',
    description: 'Single-arm or bilateral dumbbell row for lats.',
    pattern: 'horizontal_pull',
    modality: 'dumbbell',
    primaryMuscles: ['back'],
    secondaryMuscles: ['back', 'arms'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper'],
    isUnilateral: true,
  },

  {
    id: 'db_split_squat',
    name: 'DB Split Squat',
    description: 'Unilateral squat variation for quads and glutes.',
    pattern: 'lunge',
    modality: 'dumbbell',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['core'],
    difficulty: 'intermediate',
    equipmentIds: ['dumbbell'],
    tags: ['unilateral', 'lower', 'hypertrophy'],
    isUnilateral: true,
  },

  {
    id: 'db_walking_lunge',
    name: 'DB Walking Lunge',
    description: 'Dynamic unilateral lower body strengthening.',
    pattern: 'lunge',
    modality: 'dumbbell',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    difficulty: 'intermediate',
    equipmentIds: ['dumbbell'],
    tags: ['unilateral', 'lower'],
    isUnilateral: true,
  },

  {
    id: 'db_rdl',
    name: 'DB Romanian Deadlift',
    description: 'Dumbbell hinge movement targeting hamstrings.',
    pattern: 'hinge',
    modality: 'dumbbell',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: ['glutes'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['posterior_chain'],
    isUnilateral: false,
  },

  {
    id: 'db_goblet_squat',
    name: 'DB Goblet Squat',
    description: 'Front-loaded squat variation for quads and core.',
    pattern: 'squat',
    modality: 'dumbbell',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['lower', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'db_chest_supported_row',
    name: 'DB Chest-Supported Row',
    description: 'Horizontal pull with strict back isolation.',
    pattern: 'horizontal_pull',
    modality: 'dumbbell',
    primaryMuscles: ['back'],
    secondaryMuscles: ['back', 'arms'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'db_single_arm_row',
    name: 'Single-Arm DB Row',
    description: 'Unilateral dumbbell row variation.',
    pattern: 'horizontal_pull',
    modality: 'dumbbell',
    primaryMuscles: ['back'],
    secondaryMuscles: ['back', 'arms'],
    difficulty: 'beginner',
    equipmentIds: ['dumbbell'],
    tags: ['upper', 'unilateral'],
    isUnilateral: true,
  },

  //
  // ────────────────────────────────────────────
  // KETTLEBELL MOVEMENTS
  // ────────────────────────────────────────────
  //

  {
    id: 'kb_swing',
    name: 'Kettlebell Swing',
    description: 'Explosive hinge pattern developing power and conditioning.',
    pattern: 'hinge',
    modality: 'kettlebell',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['core'],
    difficulty: 'intermediate',
    equipmentIds: ['kettlebell'],
    tags: ['power', 'conditioning', 'posterior_chain'],
    isUnilateral: false,
  },

  {
    id: 'kb_goblet_squat',
    name: 'KB Goblet Squat',
    description: 'Goblet-loaded squat building lower body strength.',
    pattern: 'squat',
    modality: 'kettlebell',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'core'],
    difficulty: 'beginner',
    equipmentIds: ['kettlebell'],
    tags: ['lower'],
    isUnilateral: false,
  },

  {
    id: 'kb_deadlift',
    name: 'KB Deadlift',
    description: 'Beginner hinge variation using kettlebells.',
    pattern: 'hinge',
    modality: 'kettlebell',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['back'],
    difficulty: 'beginner',
    equipmentIds: ['kettlebell'],
    tags: ['posterior_chain'],
    isUnilateral: false,
  },

  {
    id: 'kb_clean',
    name: 'KB Clean',
    description: 'Explosive kettlebell clean for power and coordination.',
    pattern: 'hinge',
    modality: 'kettlebell',
    primaryMuscles: ['glutes', 'hamstrings'],
    secondaryMuscles: ['back', 'core'],
    difficulty: 'advanced',
    equipmentIds: ['kettlebell'],
    tags: ['power', 'conditioning'],
    isUnilateral: true,
  },

  {
    id: 'kb_press',
    name: 'KB Strict Press',
    description: 'Overhead press emphasizing shoulder stability.',
    pattern: 'vertical_push',
    modality: 'kettlebell',
    primaryMuscles: ['shoulders'],
    secondaryMuscles: ['arms'],
    difficulty: 'intermediate',
    equipmentIds: ['kettlebell'],
    tags: ['upper'],
    isUnilateral: true,
  },

  {
    id: 'kb_farmers_carry',
    name: 'KB Farmer Carry',
    description: 'Loaded carry developing grip and core stability.',
    pattern: 'carry',
    modality: 'kettlebell',
    primaryMuscles: ['arms', 'core', 'back'],
    secondaryMuscles: ['glutes'],
    difficulty: 'beginner',
    equipmentIds: ['kettlebell'],
    tags: ['carry', 'conditioning'],
    isUnilateral: false,
  },

  //
  // ────────────────────────────────────────────
  // BODYWEIGHT / CORE
  // ────────────────────────────────────────────
  //

  {
    id: 'push_up',
    name: 'Push-Up',
    description: 'Horizontal pressing using bodyweight.',
    pattern: 'horizontal_push',
    modality: 'bodyweight',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['arms', 'shoulders'],
    difficulty: 'beginner',
    equipmentIds: [],
    tags: ['upper', 'hypertrophy'],
    isUnilateral: false,
  },

  {
    id: 'pull_up',
    name: 'Pull-Up',
    description: 'Vertical pull pattern for back and biceps.',
    pattern: 'vertical_pull',
    modality: 'bodyweight',
    primaryMuscles: ['back'],
    secondaryMuscles: ['arms', 'back'],
    difficulty: 'advanced',
    equipmentIds: [],
    tags: ['upper', 'strength'],
    isUnilateral: false,
  },

  {
    id: 'dips',
    name: 'Dips',
    description: 'Bodyweight dip for triceps, chest, and shoulders.',
    pattern: 'vertical_push',
    modality: 'bodyweight',
    primaryMuscles: ['arms'],
    secondaryMuscles: ['chest'],
    difficulty: 'advanced',
    equipmentIds: [],
    tags: ['upper', 'strength'],
    isUnilateral: false,
  },

  {
    id: 'plank',
    name: 'Plank',
    description: 'Isometric core stabilization exercise.',
    pattern: 'core',
    modality: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: [],
    tags: ['core_anti_extension'],
    isUnilateral: false,
  },

  {
    id: 'side_plank',
    name: 'Side Plank',
    description: 'Isometric lateral core stabilization.',
    pattern: 'core',
    modality: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: ['core'],
    difficulty: 'beginner',
    equipmentIds: [],
    tags: ['core_anti_rotation'],
    isUnilateral: true,
  },

  {
    id: 'dead_bug',
    name: 'Dead Bug',
    description: 'Contralateral core stabilization drill.',
    pattern: 'core',
    modality: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: [],
    tags: ['warmup'],
    isUnilateral: false,
  },

  {
    id: 'hollow_hold',
    name: 'Hollow Hold',
    description: 'Advanced core bracing drill.',
    pattern: 'core',
    modality: 'bodyweight',
    primaryMuscles: ['core'],
    secondaryMuscles: [],
    difficulty: 'advanced',
    equipmentIds: [],
    tags: ['core_anti_extension'],
    isUnilateral: false,
  },

  {
    id: 'glute_bridge',
    name: 'Glute Bridge',
    description: 'Bodyweight hip extension for glutes.',
    pattern: 'hinge',
    modality: 'bodyweight',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    difficulty: 'beginner',
    equipmentIds: [],
    tags: ['posterior_chain'],
    isUnilateral: false,
  },

  //
  // ────────────────────────────────────────────
  // CONDITIONING MODALITIES
  // ────────────────────────────────────────────
  //

  {
    id: 'ski_erg_intervals',
    name: 'SkiErg Intervals',
    description: 'Full-body ski erg intervals for conditioning.',
    pattern: 'conditioning',
    modality: 'cardio_machine',
    primaryMuscles: ['full_body'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: ['ski_erg'],
    tags: ['conditioning', 'hyrox'],
    isUnilateral: false,
  },

  {
    id: 'rower_intervals',
    name: 'Rowing Intervals',
    description: 'Cardio intervals on rowing machine.',
    pattern: 'conditioning',
    modality: 'cardio_machine',
    primaryMuscles: ['full_body'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: ['rower'],
    tags: ['conditioning', 'hyrox'],
    isUnilateral: false,
  },

  {
    id: 'assault_bike_intervals',
    name: 'Assault Bike Intervals',
    description: 'Metabolic conditioning using the air bike.',
    pattern: 'conditioning',
    modality: 'cardio_machine',
    primaryMuscles: ['full_body'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: ['assault_bike'],
    tags: ['conditioning', 'hyrox'],
    isUnilateral: false,
  },

  {
    id: 'treadmill_run',
    name: 'Treadmill Run',
    description: 'Steady or interval running on treadmill.',
    pattern: 'conditioning',
    modality: 'cardio_machine',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    difficulty: 'beginner',
    equipmentIds: ['treadmill'],
    tags: ['conditioning'],
    isUnilateral: false,
  },

  {
    id: 'sled_push',
    name: 'Sled Push',
    description: 'Loaded sled push for full-body power and conditioning.',
    pattern: 'conditioning',
    modality: 'sled',
    primaryMuscles: ['quads', 'core'],
    secondaryMuscles: ['shoulders'],
    difficulty: 'intermediate',
    equipmentIds: ['sled'],
    tags: ['conditioning', 'hyrox', 'power'],
    isUnilateral: false,
  },

  {
    id: 'sled_pull',
    name: 'Sled Pull',
    description: 'Backward or forward sled drag for legs and conditioning.',
    pattern: 'conditioning',
    modality: 'sled',
    primaryMuscles: ['quads', 'arms'],
    secondaryMuscles: ['core', 'back'],
    difficulty: 'intermediate',
    equipmentIds: ['sled'],
    tags: ['conditioning', 'hyrox'],
    isUnilateral: false,
  },
];

//
// ────────────────────────────────────────────
// 🔍 HELPER FUNCTIONS
// ────────────────────────────────────────────
//

export function getExercisesByPatternAndEquipment(
  pattern: MovementPattern,
  equipmentIds: string[]
): Exercise[] {
  return EXERCISES.filter((ex) => {
    const patternMatches = ex.pattern === pattern;
    const equipmentMatches =
      ex.equipmentIds.length === 0 ||
      ex.equipmentIds.some((req) => equipmentIds.includes(req));
    return patternMatches && equipmentMatches;
  });
}

export function getExercisesByTag(tag: ExerciseTag): Exercise[] {
  return EXERCISES.filter((ex) => ex.tags.includes(tag));
}

export function getExercisesByDifficulty(
  level: ExerciseDifficulty
): Exercise[] {
  return EXERCISES.filter((ex) => ex.difficulty === level);
}

// Look up a single exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((ex) => ex.id === id);
}
