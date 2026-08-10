import * as THREE from "three";

import type { Line2GeoPoint, Line2RoutePoint, Line2Station } from "../domain/line2Station";
import subwayStationData from "./subwayStationData.json";

type SubwayStationLineData = {
  address: string;
  diagramPosition: Line2RoutePoint;
  location: Line2GeoPoint;
  stationId: string;
};

type SubwayStationData = {
  lines: Record<string, SubwayStationLineData>;
  name: string;
};

const LINE2_KEY = "2";
const subwayStationsByKey: Record<string, SubwayStationData> = subwayStationData.stations;
const line2Data = subwayStationData.lines[LINE2_KEY];

type SubwayLineRouteData = (typeof line2Data.routes)[number];
type SubwayLineBranchRouteData = SubwayLineRouteData & {
  junctionStationKey: string;
};

const line2MainLoopRoute = getLine2MainLoopRoute(line2Data.routes);
const line2BranchRoutes = line2Data.routes.filter(isSubwayLineBranchRoute);

export const LINE2_SELECTION_ANIMATION_DURATION_MS = 4200;
export const LINE2_INITIAL_STATION_ID = "201";
export const LINE2_SELECTION_CHARACTER_DESTINATION_OFFSET = {
  x: -0.85,
  z: 0.85,
} as const;
export const LINE2_SELECTION_CAMERA_PRESET = {
  durationMs: 900,
  toLookAt: new THREE.Vector3(20, 0, 4),
  toPosition: new THREE.Vector3(24, 18, 8),
  toZoom: 1.45,
} as const;

export const LINE2_MAIN_LOOP_STATIONS = line2MainLoopRoute.stationKeys.map(createLine2Station);
export const LINE2_BRANCH_STATIONS = line2BranchRoutes.flatMap((route) =>
  route.stationKeys.map(createLine2Station)
);

const line2MainLoopStationIds = LINE2_MAIN_LOOP_STATIONS.map((station) => station.id);

export const LINE2_MAIN_LOOP_STATION_IDS = [
  line2MainLoopStationIds[0],
  ...line2MainLoopStationIds.slice(1).reverse(),
];
export const LINE2_BRANCH_STATION_IDS = line2BranchRoutes.map((route) => [
  createLine2Station(route.junctionStationKey).id,
  ...route.stationKeys.map((stationKey) => createLine2Station(stationKey).id),
]);
export const LINE2_STATIONS: readonly Line2Station[] =
  line2Data.stationKeys.map(createLine2Station);

export function getLine2StationById(stationId: string): Line2Station | null {
  return LINE2_STATIONS.find((station) => station.id === stationId) ?? null;
}

function createLine2Station(stationKey: string): Line2Station {
  const station = subwayStationsByKey[stationKey];
  const lineData = station?.lines[LINE2_KEY];

  if (!station || !lineData) {
    throw new Error(`Line 2 station data is missing for key: ${stationKey}`);
  }

  return {
    address: lineData.address,
    diagramPosition: lineData.diagramPosition,
    id: lineData.stationId,
    name: station.name,
    stationGeoPosition: lineData.location,
  };
}

function getLine2MainLoopRoute(routes: readonly SubwayLineRouteData[]): SubwayLineRouteData {
  const mainLoopRoute = routes.find((route) => route.type === "loop");

  if (!mainLoopRoute) {
    throw new Error("Line 2 main loop route is missing.");
  }

  return mainLoopRoute;
}

function isSubwayLineBranchRoute(route: SubwayLineRouteData): route is SubwayLineBranchRouteData {
  return route.type === "branch" && "junctionStationKey" in route;
}
