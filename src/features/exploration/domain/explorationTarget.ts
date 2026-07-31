import type { SeoulDistrict } from "@shared/constants/seoulDistrict";

import type { Coordinates } from "./explorationGeo";

export type DistrictExplorationTarget = {
  center: Coordinates;
  districtId: number;
  districtName: string;
  type: "district";
};

export type StationExplorationTarget = {
  center: Coordinates;
  radiusMeters: number;
  stationId: string;
  stationName: string;
  type: "station";
};

export type ExplorationTarget = DistrictExplorationTarget | StationExplorationTarget;

export function createDistrictExplorationTarget(
  district: SeoulDistrict
): DistrictExplorationTarget {
  return {
    center: district.officePosition,
    districtId: district.id,
    districtName: district.name,
    type: "district",
  };
}

export function createStationExplorationTarget({
  center,
  radiusMeters,
  stationId,
  stationName,
}: Omit<StationExplorationTarget, "type">): StationExplorationTarget {
  return {
    center,
    radiusMeters,
    stationId,
    stationName,
    type: "station",
  };
}

export function isDistrictExplorationTarget(
  target: ExplorationTarget | null
): target is DistrictExplorationTarget {
  return target?.type === "district";
}

export function parseDistrictExplorationTargetIdParam(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}
