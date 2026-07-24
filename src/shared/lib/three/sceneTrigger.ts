export type SceneTriggerPoint = {
  x: number;
  z: number;
};

export type IsInsideSceneTriggerRadiusInput = {
  position: SceneTriggerPoint;
  radius: number;
  triggerPoint: SceneTriggerPoint;
};

export function isInsideSceneTriggerRadius({
  position,
  radius,
  triggerPoint,
}: IsInsideSceneTriggerRadiusInput): boolean {
  if (radius < 0) {
    return false;
  }

  return Math.hypot(position.x - triggerPoint.x, position.z - triggerPoint.z) <= radius;
}
