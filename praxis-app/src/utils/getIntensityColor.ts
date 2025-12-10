/**
 * Get color based on workout duration (intensity indicator)
 */
export function getIntensityColor(duration: number | null | undefined): string {
  if (!duration || duration === 0) return '#444B53'; // dark grey

  if (duration < 30) return '#00CFE6'; // light cyan
  if (duration < 50) return '#00E5FF'; // primary cyan
  if (duration < 70) return '#0094A3'; // darker cyan
  return '#FF4F4F'; // red = very long session
}

