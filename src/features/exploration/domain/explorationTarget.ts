import type { SeoulDistrict } from "@shared/constants/seoulDistrict";

import type { Coordinates } from "./explorationGeo";

export type DistrictExplorationTarget = {
  center: Coordinates;
  districtId: number;
  districtName: string;
  type: "district";
};

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
