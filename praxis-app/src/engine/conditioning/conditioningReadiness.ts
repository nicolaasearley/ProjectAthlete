import type { ReadinessEntry } from '@core/types';

/**
 * Readiness Adaptive Scaling for Conditioning
 * ------------------------------------------
 * Input: ReadinessEntry from store (or null)
 * Output: readinessFactor (0.6 → 1.2)
 *
 * 1.0 = normal
 * >1.0 = increase volume/intensity
 * <1.0 = reduce volume/intensity
 */

/**
 * Calculate readiness factor for conditioning adaptation
 */
export function getReadinessFactor(
  readiness: ReadinessEntry | null | undefined
): number {
  if (!readiness) return 1.0; // no data → neutral

  const sleep = readiness.sleepQuality ?? 3;
  const soreness = readiness.soreness ?? 3;
  // Use energy as inverse of fatigue (higher energy = lower fatigue)
  const fatigue = 6 - (readiness.energy ?? 3); // Invert: energy 5 = fatigue 1, energy 1 = fatigue 5
  const hrv = readiness.readinessScore ?? 50; // Using readinessScore as HRV proxy

  // Normalize each factor to ±20%
  let factor = 1.0;

  // Sleep quality (1–5)
  factor += (sleep - 3) * 0.05;

  // Soreness (1–5)
  factor -= (soreness - 3) * 0.05;

  // Fatigue (1–5)
  factor -= (fatigue - 3) * 0.05;

  // HRV out of 100 (normalize)
  factor += ((hrv - 50) / 50) * 0.1;

  // Clamp final output
  return Math.max(0.6, Math.min(1.2, Number(factor.toFixed(2))));
}

