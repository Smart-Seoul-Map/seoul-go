import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";

import seoulDistrictBoundariesJson from "../data/seoulDistrictBoundaries.json";

type Position = [number, number];
type LinearRing = Position[];
type PolygonCoordinates = LinearRing[];
type MultiPolygonCoordinates = PolygonCoordinates[];

type ExplorationDistrictBoundaryGeometry =
  | {
      type: "Polygon";
      coordinates: PolygonCoordinates;
    }
  | {
      type: "MultiPolygon";
      coordinates: MultiPolygonCoordinates;
    };

export type ExplorationDistrictBoundaryFeature = {
  type: "Feature";
  properties: {
    districtId: number;
    name: string;
  };
  geometry: ExplorationDistrictBoundaryGeometry;
};

export type ExplorationDistrictMaskFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: {
    type: "Polygon";
    coordinates: LinearRing[];
  };
};

type ExplorationDistrictBoundaryCollection = {
  type: "FeatureCollection";
  features: ExplorationDistrictBoundaryFeature[];
};

const WORLD_OUTER_RING: LinearRing = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

const districtBoundaryCollection =
  seoulDistrictBoundariesJson as unknown as ExplorationDistrictBoundaryCollection;

export function getExplorationDistrictBoundary(
  districtId: number | undefined
): ExplorationDistrictBoundaryFeature | null {
  if (districtId === undefined) {
    return null;
  }

  const district = getSeoulDistrictById(districtId);

  if (!district) {
    return null;
  }

  const boundary =
    districtBoundaryCollection.features.find(
      (feature) => feature.properties.districtId === district.id
    ) ?? null;

  if (boundary?.properties.name !== district.name) {
    return null;
  }

  return boundary;
}

function getDistrictOuterRings(geometry: ExplorationDistrictBoundaryGeometry): LinearRing[] {
  if (geometry.type === "Polygon") {
    const outerRing = geometry.coordinates[0];

    return outerRing ? [outerRing] : [];
  }

  return geometry.coordinates.flatMap((polygonCoordinates) => {
    const outerRing = polygonCoordinates[0];

    return outerRing ? [outerRing] : [];
  });
}

export function createExplorationDistrictMask(
  boundary: ExplorationDistrictBoundaryFeature
): ExplorationDistrictMaskFeature {
  const districtOuterRings = getDistrictOuterRings(boundary.geometry);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [WORLD_OUTER_RING, ...districtOuterRings],
    },
  };
}
