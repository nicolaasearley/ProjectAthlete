/**
 * HYROX-SPECIFIC CONDITIONING PRESETS
 */

export type HyroxConditioningType =
  | 'hyrox_sled'
  | 'hyrox_wallballs'
  | 'hyrox_machine'
  | 'hyrox_burpee_broad_jump';

export type ConditioningDayType =
  | 'strength_day'
  | 'mixed_day'
  | 'engine_day'
  | 'rest';

export type IntensityWave = 'base' | 'load' | 'peak' | 'deload';

export type TimeAvailability = 'short' | 'standard' | 'full';

export interface HyroxSledTemplate {
  type: 'hyrox_sled';
  station: string;
  durationMinutes: number;
  work: {
    pushMeters: number;
    pullMeters: number;
    rounds: number;
  };
}

export interface HyroxWallballsTemplate {
  type: 'hyrox_wallballs';
  station: string;
  durationMinutes: number;
  reps: number;
  scheme: string;
}

export interface HyroxMachineTemplate {
  type: 'hyrox_machine';
  station: string;
  durationMinutes: number;
  intervals: {
    workSeconds: number;
    restSeconds: number;
    rounds: number;
  };
}

export interface HyroxBurpeeBroadJumpTemplate {
  type: 'hyrox_burpee_broad_jump';
  station: string;
  durationMinutes: number;
  work: {
    metersPerRep: number;
    rounds: number;
  };
}

export type HyroxConditioningTemplate =
  | HyroxSledTemplate
  | HyroxWallballsTemplate
  | HyroxMachineTemplate
  | HyroxBurpeeBroadJumpTemplate;

export function getHyroxConditioningTemplate(
  equipmentIds: string[],
  dayType: string,
  wave: string,
  timeAvailability: string
): HyroxConditioningTemplate {
  const hasSled =
    equipmentIds.includes('sled_push') || equipmentIds.includes('sled');
  const hasMachines =
    equipmentIds.includes('rower') ||
    equipmentIds.includes('ski_erg') ||
    equipmentIds.includes('bike') ||
    equipmentIds.includes('assault_bike');

  // Map time availability → real-world HYROX block durations
  const baseBlockMinutes =
    timeAvailability === 'short'
      ? 8
      : timeAvailability === 'standard'
        ? 12
        : 20;

  // Adjust for intensity wave
  const intensityMultiplier =
    wave === 'load'
      ? 1.15
      : wave === 'peak'
        ? 1.25
        : wave === 'deload'
          ? 0.7
          : 1;

  const totalMinutes = Math.round(baseBlockMinutes * intensityMultiplier);

  /**
   * 1. SLED-PUSH / SLED-PULL BLOCK
   */
  if (hasSled) {
    return {
      type: 'hyrox_sled',
      station: 'Sled Push / Pull',
      durationMinutes: totalMinutes,
      work: {
        pushMeters: 10,
        pullMeters: 10,
        rounds: Math.max(2, Math.floor(totalMinutes / 3)),
      },
    };
  }

  /**
   * 2. WALL BALL BLOCK
   */
  if (equipmentIds.includes('medicine_ball')) {
    return {
      type: 'hyrox_wallballs',
      station: 'Wall Balls',
      durationMinutes: totalMinutes,
      reps: Math.floor(totalMinutes * 12), // ~12 reps/min avg
      scheme: 'density',
    };
  }

  /**
   * 3. MACHINE-BASED HYROX BLOCK
   */
  if (hasMachines) {
    return {
      type: 'hyrox_machine',
      station: 'Row/Bike/Ski HYROX Intervals',
      durationMinutes: totalMinutes,
      intervals: {
        workSeconds: 60,
        restSeconds: 30,
        rounds: Math.floor((totalMinutes * 60) / 90),
      },
    };
  }

  /**
   * 4. BURPEE BROAD JUMP BLOCK
   */
  return {
    type: 'hyrox_burpee_broad_jump',
    station: 'Burpee Broad Jumps',
    durationMinutes: totalMinutes,
    work: {
      metersPerRep: 2,
      rounds: Math.max(3, Math.floor(totalMinutes / 2)),
    },
  };
}

