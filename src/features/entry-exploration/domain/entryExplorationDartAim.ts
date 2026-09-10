import { ENTRY_EXPLORATION_DART_CONFIG } from "../config/entryExplorationDartConfig";

export type EntryExplorationDartScreenPoint = {
  x: number;
  y: number;
};

type EntryExplorationDartFlightFrame = {
  rotation: number;
  scale: number;
  x: number;
  y: number;
};

type EntryExplorationDartFlightInput = {
  arcHeightRatio: number;
  from: EntryExplorationDartScreenPoint;
  progress: number;
  to: EntryExplorationDartScreenPoint;
};

const ARROW_TEXTURE_ROTATION_DEGREES = ENTRY_EXPLORATION_DART_CONFIG.sprite.textureRotationDegrees;

export function getEntryExplorationDartFlightFrame({
  arcHeightRatio,
  from,
  progress,
  to,
}: EntryExplorationDartFlightInput): EntryExplorationDartFlightFrame {
  const ratio = clamp(progress, 0, 1);
  const eased = ratio < 0.5 ? 4 * ratio ** 3 : 1 - (-2 * ratio + 2) ** 3 / 2;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const arc = distance * arcHeightRatio * 4 * eased * (1 - eased);
  const headingDegrees = toDegrees(Math.atan2(to.y - from.y, to.x - from.x));

  return {
    rotation: headingDegrees - ARROW_TEXTURE_ROTATION_DEGREES,
    scale: 1 - 0.45 * eased,
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased - arc,
  };
}

export function getEntryExplorationDartTipPoint({
  anchorPoint,
  offsetFromAnchor,
  rotationDegrees,
}: {
  anchorPoint: EntryExplorationDartScreenPoint;
  offsetFromAnchor: EntryExplorationDartScreenPoint;
  rotationDegrees: number;
}): EntryExplorationDartScreenPoint {
  const radians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: anchorPoint.x + offsetFromAnchor.x * cos - offsetFromAnchor.y * sin,
    y: anchorPoint.y + offsetFromAnchor.x * sin + offsetFromAnchor.y * cos,
  };
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
