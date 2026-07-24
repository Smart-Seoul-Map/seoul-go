function clampProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 1);
}

export function easeOutCubic(progress: number): number {
  const clampedProgress = clampProgress(progress);

  return 1 - (1 - clampedProgress) ** 3;
}

export function easeInOutCubic(progress: number): number {
  const clampedProgress = clampProgress(progress);

  if (clampedProgress < 0.5) {
    return 4 * clampedProgress ** 3;
  }

  return 1 - (-2 * clampedProgress + 2) ** 3 / 2;
}
