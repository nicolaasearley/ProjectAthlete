import type { WorkoutBlock } from '@core/types';

/**
 * Generate a unique ID for workout blocks
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface GenerateCooldownBlockOptions {
  // No options needed for cooldown
}

/**
 * Generate cooldown block
 */
export function generateCooldownBlock(
  _options: GenerateCooldownBlockOptions = {}
): WorkoutBlock {
  return {
    id: generateId('cooldown'),
    type: 'cooldown',
    title: 'Cooldown',
    cooldownItems: [
      '3–5 minutes easy movement',
      'Light stretch: quads, hamstrings, glutes',
    ],
    estimatedDurationMinutes: 5,
  };
}

