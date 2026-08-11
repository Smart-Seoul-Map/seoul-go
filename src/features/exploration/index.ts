export { ExplorationPage } from "./presentation/ExplorationPage";
export { ExplorationMap } from "./presentation/ExplorationMap";
export { CharacterModelOverlay } from "./presentation/CharacterModelOverlay";
export {
  advanceTrackedMovement,
  selectCharacterModelKey,
  type TrackedMovementFrame,
} from "./application/explorationMovementFrame";
export {
  canMoveWithinRadius,
  distanceMeters,
  hasArrived,
  nextRadius,
  RADIUS_STEPS_METERS,
  type Coordinates,
} from "./domain/explorationGeo";
export {
  createDistrictExplorationTarget,
  createStationExplorationTarget,
  isDistrictExplorationTarget,
  parseDistrictExplorationTargetIdParam,
  type DistrictExplorationTarget,
  type ExplorationTarget,
  type StationExplorationTarget,
} from "./domain/explorationTarget";
export {
  getUnlockedStationExplorationRadius,
  STATION_EXPLORATION_RADIUS_STEPS,
  type StationExplorationRadiusStep,
} from "./domain/explorationStationRadius";
export {
  VISITED_PLACE_STORAGE_KEY,
  VISITED_PLACE_STORAGE_VERSION,
  clearVisitedPlaceIds,
  loadVisitedPlaceIds,
  saveVisitedPlaceIds,
  type VisitedPlaceStorage,
} from "./data/visitedPlaceStorage";
export {
  createVisitedPlaceStore,
  type CreateVisitedPlaceStoreOptions,
  type VisitedPlaceStoreState,
  type VisitPlaceResult,
} from "./application/visitedPlaceStore";
export { useVisitedPlaceStore, visitedPlaceStore } from "./application/useVisitedPlaceStore";
export {
  createStampCoursePlaceInputFromSelection,
  type AddExplorationPlaceToCourseResultStatus,
  type ExplorationStampCoursePlaceInput,
} from "./application/explorationStampCourse";
export type { ExplorationPlaceMarkerSelection } from "./application/explorationPlaceMarkers";
export {
  advanceMovement,
  createMovement,
  type CharacterMovement,
  type MovementStatus,
} from "./domain/explorationMovement";
export { CHARACTER_MODEL_MANIFEST } from "./config/explorationCharacterModels";
export { STATION_EXPLORATION_RADIUS_METERS } from "./config/stationExplorationConfig";
