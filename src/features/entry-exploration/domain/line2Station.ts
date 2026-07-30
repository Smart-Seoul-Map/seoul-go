export type Line2RoutePoint = {
  x: number;
  y: number;
};

export type Line2GeoPoint = {
  lat: number;
  lng: number;
};

export type Line2Station = {
  address: string;
  diagramPosition: Line2RoutePoint;
  id: string;
  name: string;
  stationGeoPosition: Line2GeoPoint;
};

type CreateLine2SelectionRouteOptions = {
  branchStationIds: readonly (readonly string[])[];
  mainLoopStationIds: readonly string[];
  startStationId: string;
  stations: readonly Line2Station[];
  targetStationId: string;
};

export function selectRandomLine2Station(
  stations: readonly Line2Station[],
  random: () => number = Math.random
): Line2Station {
  if (stations.length === 0) {
    throw new Error("At least one Line 2 station is required.");
  }

  const stationIndex = Math.min(Math.floor(random() * stations.length), stations.length - 1);

  return stations[stationIndex];
}

export function createLine2SelectionRoute({
  branchStationIds,
  mainLoopStationIds,
  startStationId,
  stations,
  targetStationId,
}: CreateLine2SelectionRouteOptions): readonly Line2Station[] {
  if (stations.length === 0) {
    return [];
  }

  const stationById = new Map(stations.map((station) => [station.id, station]));
  const startBranch = findLine2Branch(branchStationIds, startStationId);
  const targetBranch = findLine2Branch(branchStationIds, targetStationId);
  const startMainStationId = startBranch?.[0] ?? startStationId;
  const targetMainStationId = targetBranch?.[0] ?? targetStationId;
  const departureStationIds = startBranch
    ? createBranchReturnPath(startBranch, startStationId)
    : [startStationId];
  const routeStationIds = [
    ...departureStationIds,
    ...createMainLoopPath(mainLoopStationIds, startMainStationId, startMainStationId, true),
    ...createMainLoopPath(mainLoopStationIds, startMainStationId, targetMainStationId, false),
    ...(targetBranch ? createBranchOutboundPath(targetBranch, targetStationId) : []),
  ];

  return routeStationIds.map((stationId) => {
    const station = stationById.get(stationId);

    if (!station) {
      throw new Error(`Unknown Line 2 station: ${stationId}`);
    }

    return station;
  });
}

export function getLine2RoutePointAtProgress(
  route: readonly Line2Station[],
  progress: number
): Line2RoutePoint {
  const firstStation = route[0];

  if (!firstStation) {
    return { x: 0, y: 0 };
  }

  if (route.length === 1) {
    return firstStation.diagramPosition;
  }

  const segmentLengths = route.slice(1).map((station, index) => {
    const previousStation = route[index];

    return getPointDistance(previousStation.diagramPosition, station.diagramPosition);
  });
  const totalLength = segmentLengths.reduce((total, length) => total + length, 0);
  const targetDistance = clampProgress(progress) * totalLength;
  let traversedDistance = 0;

  for (let segmentIndex = 0; segmentIndex < segmentLengths.length; segmentIndex += 1) {
    const segmentLength = segmentLengths[segmentIndex];
    const nextTraversedDistance = traversedDistance + segmentLength;

    if (targetDistance <= nextTraversedDistance || segmentIndex === segmentLengths.length - 1) {
      const from = route[segmentIndex].diagramPosition;
      const to = route[segmentIndex + 1].diagramPosition;
      const segmentProgress =
        segmentLength === 0 ? 0 : (targetDistance - traversedDistance) / segmentLength;

      return {
        x: from.x + (to.x - from.x) * segmentProgress,
        y: from.y + (to.y - from.y) * segmentProgress,
      };
    }

    traversedDistance = nextTraversedDistance;
  }

  return route[route.length - 1].diagramPosition;
}

function clampProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 1);
}

function getPointDistance(from: Line2RoutePoint, to: Line2RoutePoint): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function findLine2Branch(
  branchStationIds: readonly (readonly string[])[],
  stationId: string
): readonly string[] | null {
  return branchStationIds.find((branch) => branch.slice(1).includes(stationId)) ?? null;
}

function createBranchReturnPath(
  branchStationIds: readonly string[],
  startStationId: string
): readonly string[] {
  const startIndex = branchStationIds.indexOf(startStationId);

  return startIndex < 0 ? [startStationId] : branchStationIds.slice(0, startIndex + 1).reverse();
}

function createBranchOutboundPath(
  branchStationIds: readonly string[],
  targetStationId: string
): readonly string[] {
  const targetIndex = branchStationIds.indexOf(targetStationId);

  return targetIndex < 1 ? [] : branchStationIds.slice(1, targetIndex + 1);
}

function createMainLoopPath(
  mainLoopStationIds: readonly string[],
  startStationId: string,
  targetStationId: string,
  isFullLoop: boolean
): readonly string[] {
  const startIndex = mainLoopStationIds.indexOf(startStationId);
  const targetIndex = mainLoopStationIds.indexOf(targetStationId);

  if (startIndex < 0 || targetIndex < 0) {
    throw new Error("Line 2 main loop station is missing.");
  }

  const targetOffset =
    (targetIndex - startIndex + mainLoopStationIds.length) % mainLoopStationIds.length;
  const travelStationCount = isFullLoop ? mainLoopStationIds.length : targetOffset;

  return Array.from(
    { length: travelStationCount },
    (_, routeIndex) => mainLoopStationIds[(startIndex + routeIndex + 1) % mainLoopStationIds.length]
  );
}
