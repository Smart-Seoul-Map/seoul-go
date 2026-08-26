const ZOOM_SCALE_STEP_RATIO = 0.25;

export function calculateZoomScaleRatio(zoomLevel: number, referenceZoomLevel: number): number {
  return 1 + ZOOM_SCALE_STEP_RATIO * (zoomLevel - referenceZoomLevel);
}
