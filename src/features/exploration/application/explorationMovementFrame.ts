import type { CharacterModelKey } from "../config/explorationCharacterModels";
import type { Coordinates } from "../domain/explorationGeo";
import {
  advanceMovement,
  type CharacterMovement,
  type MovementStatus,
} from "../domain/explorationMovement";

export interface TrackedMovementFrame {
  movement: CharacterMovement;
  cameraCenter: Coordinates;
  modelKey: CharacterModelKey;
}

export function selectCharacterModelKey(status: MovementStatus): CharacterModelKey {
  return status === "moving" ? "run" : "idlePrimary";
}

export function advanceTrackedMovement(
  movement: CharacterMovement,
  deltaSeconds: number,
  speedMetersPerSecond: number
): TrackedMovementFrame {
  const nextMovement = advanceMovement(movement, deltaSeconds, speedMetersPerSecond);

  return {
    movement: nextMovement,
    cameraCenter: nextMovement.position,
    modelKey: selectCharacterModelKey(nextMovement.status),
  };
}
