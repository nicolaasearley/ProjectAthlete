import { getReadinessFactor } from './conditioningReadiness';
import type { ReadinessEntry } from '@core/types';

export type HyroxStationType =
  | 'run'
  | 'machine'
  | 'fallback'
  | 'sled_push'
  | 'sled_pull'
  | 'burpee_broad_jump'
  | 'carry'
  | 'lunges'
  | 'wall_balls';

export interface RunStation {
  type: 'run';
  title: string;
  distance_m: number;
}

export interface MachineStation {
  type: 'machine';
  title: string;
  machine: string;
  distance_m: number;
}

export interface FallbackStation {
  type: 'fallback';
  title: string;
  exercise: string;
  distance_m: number;
}

export interface SledPushStation {
  type: 'sled_push';
  title: string;
  load_kg: number | null;
  meters: number;
  fallback: string | null;
}

export interface SledPullStation {
  type: 'sled_pull';
  title: string;
  load_kg: number | null;
  meters: number;
  fallback: string | null;
}

export interface BurpeeBroadJumpStation {
  type: 'burpee_broad_jump';
  title: string;
  meters: number;
}

export interface CarryStation {
  type: 'carry';
  title: string;
  meters: number;
  load_kg: number;
}

export interface LungesStation {
  type: 'lunges';
  title: string;
  meters: number;
  load_kg: number;
}

export interface WallBallsStation {
  type: 'wall_balls';
  title: string;
  reps: number;
  ball_kg: number;
}

export type HyroxStation =
  | RunStation
  | MachineStation
  | FallbackStation
  | SledPushStation
  | SledPullStation
  | BurpeeBroadJumpStation
  | CarryStation
  | LungesStation
  | WallBallsStation;

export interface HyroxRaceSimulation {
  title: string;
  readinessFactor: number;
  estimatedDurationMinutes: number;
  stations: HyroxStation[];
}

/**
 * Generate a full HYROX race simulation.
 * Output is a structured list of stations with readiness-scaled values.
 */
export function getHyroxRaceSimulation(
  equipmentIds: string[],
  readiness: ReadinessEntry | null | undefined
): HyroxRaceSimulation {
  const factor = getReadinessFactor(readiness);

  // Distance scaling (90% to 110% of normal)
  const runDistance = Math.round(1000 * factor);

  const hasSki = equipmentIds.includes('ski_erg');
  const hasRow = equipmentIds.includes('rower');
  const hasBike = equipmentIds.includes('assault_bike');
  const hasSled = equipmentIds.includes('sled') || equipmentIds.includes('sled_push');

  const stations: HyroxStation[] = [];

  function addRun(): void {
    stations.push({
      type: 'run',
      title: 'Run',
      distance_m: runDistance,
    });
  }

  function machineOrFallback(
    name: string,
    fallback: string
  ): { type: 'machine'; machine: string } | { type: 'fallback'; exercise: string } {
    return equipmentIds.includes(name)
      ? { type: 'machine', machine: name }
      : { type: 'fallback', exercise: fallback };
  }

  // HYROX order
  addRun();
  stations.push({
    title: 'SkiErg',
    ...machineOrFallback('ski_erg', 'Kettlebell Swing'),
    distance_m: Math.round(1000 * factor),
  } as MachineStation | FallbackStation);

  addRun();
  stations.push({
    title: 'Sled Push',
    type: 'sled_push',
    load_kg: hasSled ? Math.round(150 * factor) : null,
    meters: Math.round(50 * factor),
    fallback: hasSled ? null : 'Heavy KB March',
  });

  addRun();
  stations.push({
    title: 'Sled Pull',
    type: 'sled_pull',
    load_kg: hasSled ? Math.round(103 * factor) : null,
    meters: Math.round(50 * factor),
    fallback: hasSled ? null : 'Band-Resisted Row Steps',
  });

  addRun();
  stations.push({
    title: 'Burpee Broad Jumps',
    type: 'burpee_broad_jump',
    meters: Math.round(80 * factor),
  });

  addRun();
  stations.push({
    title: 'Row',
    ...machineOrFallback('rower', 'Burpees'),
    distance_m: Math.round(1000 * factor),
  } as MachineStation | FallbackStation);

  addRun();
  stations.push({
    title: 'Farmers Carry',
    type: 'carry',
    meters: Math.round(200 * factor),
    load_kg: 2 * Math.round(24 * factor),
  });

  addRun();
  stations.push({
    title: 'Sandbag Lunges',
    type: 'lunges',
    meters: Math.round(100 * factor),
    load_kg: Math.round(20 * factor),
  });

  addRun();
  stations.push({
    title: 'Wall Balls',
    type: 'wall_balls',
    reps: Math.round(90 * factor),
    ball_kg: 6,
  });

  return {
    title: 'HYROX Race Simulation',
    readinessFactor: factor,
    estimatedDurationMinutes: Math.round(60 * factor),
    stations,
  };
}

