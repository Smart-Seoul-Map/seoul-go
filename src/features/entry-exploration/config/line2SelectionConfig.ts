import * as THREE from "three";

import type { Line2RoutePoint, Line2Station } from "../domain/line2Station";
import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "./entryExplorationAssets";
import subwayStationData from "./subwayStationData.json";

type SubwayStationLineData = {
  position: Line2RoutePoint;
  stationId: string;
};

type SubwayStationData = {
  lines: Record<string, SubwayStationLineData>;
  name: string;
};

type SubwayLineBranchData = {
  junctionStationKey: string;
  stationKeys: readonly string[];
};

type SubwayLineData = {
  branches: readonly SubwayLineBranchData[];
  mainLoopStationKeys: readonly string[];
};

const LINE2_KEY = "2";
const subwayStationsByKey: Record<string, SubwayStationData> = subwayStationData.stations;
const line2Data: SubwayLineData = subwayStationData.lines[LINE2_KEY];

export const LINE2_ROUTE_MAP_URL = ENTRY_EXPLORATION_TEXTURE_ASSETS.line2RouteMap.src;
export const LINE2_SELECTION_ANIMATION_DURATION_MS = 4200;
export const LINE2_INITIAL_STATION_ID = "201";
export const LINE2_SELECTION_CAMERA_PRESET = {
  durationMs: 900,
  toLookAt: new THREE.Vector3(10, 0, 4),
  toPosition: new THREE.Vector3(14, 18, 8),
  toZoom: 1.45,
} as const;

export const LINE2_MAIN_LOOP_STATIONS = line2Data.mainLoopStationKeys.map(createLine2Station);
export const LINE2_BRANCH_STATIONS = line2Data.branches.flatMap((branch) =>
  branch.stationKeys.map(createLine2Station)
);

const line2MainLoopStationIds = LINE2_MAIN_LOOP_STATIONS.map((station) => station.id);

export const LINE2_MAIN_LOOP_STATION_IDS = [
  line2MainLoopStationIds[0],
  ...line2MainLoopStationIds.slice(1).reverse(),
];
export const LINE2_BRANCH_STATION_IDS = line2Data.branches.map((branch) => [
  createLine2Station(branch.junctionStationKey).id,
  ...branch.stationKeys.map((stationKey) => createLine2Station(stationKey).id),
]);
export const LINE2_STATIONS: readonly Line2Station[] = [
  ...LINE2_MAIN_LOOP_STATIONS,
  ...LINE2_BRANCH_STATIONS,
];

function createLine2Station(stationKey: string): Line2Station {
  const station = subwayStationsByKey[stationKey];
  const lineData = station?.lines[LINE2_KEY];

  if (!station || !lineData) {
    throw new Error(`Line 2 station data is missing for key: ${stationKey}`);
  }

  return {
    id: lineData.stationId,
    name: station.name,
    position: lineData.position,
  };
}
