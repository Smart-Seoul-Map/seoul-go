import { SEOUL_GRID_MAP_CONFIG, UTMK_PROJECTION } from "../config/seoulGridNumberConfig";
import type { SeoulGridCell } from "./seoulGridNumber";

export type SeoulGridGeoPoint = {
  lat: number;
  lng: number;
};

const { falseEasting, falseNorthing, latitudeOrigin, longitudeOrigin, scaleFactor } =
  UTMK_PROJECTION;
const semiMajorAxis = UTMK_PROJECTION.semiMajorAxis;
const flattening = 1 / UTMK_PROJECTION.inverseFlattening;
const eccentricitySquared = 2 * flattening - flattening * flattening;
const secondEccentricitySquared = eccentricitySquared / (1 - eccentricitySquared);

export function toSeoulGridCellCenter(cell: SeoulGridCell): SeoulGridGeoPoint {
  const { originKm, originUtmk, rows } = SEOUL_GRID_MAP_CONFIG;
  const eastKm = originKm.x + cell.column;
  const northKm = originKm.y + (rows - 1 - cell.row);

  return toGeoPoint(originUtmk.x + eastKm * 1000 + 500, originUtmk.y + northKm * 1000 + 500);
}

export function toSeoulGridCellFromGeoPoint(point: SeoulGridGeoPoint): SeoulGridCell | null {
  const { columns, originKm, originUtmk, rows } = SEOUL_GRID_MAP_CONFIG;
  const { x, y } = toUtmk(point);
  const column = Math.floor((x - originUtmk.x) / 1000) - originKm.x;
  const row = rows - 1 - (Math.floor((y - originUtmk.y) / 1000) - originKm.y);
  const isOnBoard = column >= 0 && column < columns && row >= 0 && row < rows;

  return isOnBoard ? { column, row } : null;
}

function toUtmk({ lat, lng }: SeoulGridGeoPoint): { x: number; y: number } {
  const phi = toRadians(lat);
  const n = semiMajorAxis / Math.sqrt(1 - eccentricitySquared * Math.sin(phi) ** 2);
  const t = Math.tan(phi) ** 2;
  const c = secondEccentricitySquared * Math.cos(phi) ** 2;
  const a = (toRadians(lng) - toRadians(longitudeOrigin)) * Math.cos(phi);
  const x =
    falseEasting +
    scaleFactor *
      n *
      (a +
        ((1 - t + c) * a ** 3) / 6 +
        ((5 - 18 * t + t ** 2 + 72 * c - 58 * secondEccentricitySquared) * a ** 5) / 120);
  const y =
    falseNorthing +
    scaleFactor *
      (meridionalArc(lat) -
        meridionalArc(latitudeOrigin) +
        n *
          Math.tan(phi) *
          (a ** 2 / 2 +
            ((5 - t + 9 * c + 4 * c ** 2) * a ** 4) / 24 +
            ((61 - 58 * t + t ** 2 + 600 * c - 330 * secondEccentricitySquared) * a ** 6) / 720));

  return { x, y };
}

function toGeoPoint(x: number, y: number): SeoulGridGeoPoint {
  const e1 = (1 - Math.sqrt(1 - eccentricitySquared)) / (1 + Math.sqrt(1 - eccentricitySquared));
  const meridional = (y - falseNorthing) / scaleFactor + meridionalArc(latitudeOrigin);
  const mu =
    meridional /
    (semiMajorAxis *
      (1 -
        eccentricitySquared / 4 -
        (3 * eccentricitySquared ** 2) / 64 -
        (5 * eccentricitySquared ** 3) / 256));
  const footprintLatitude =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const c1 = secondEccentricitySquared * Math.cos(footprintLatitude) ** 2;
  const t1 = Math.tan(footprintLatitude) ** 2;
  const n1 = semiMajorAxis / Math.sqrt(1 - eccentricitySquared * Math.sin(footprintLatitude) ** 2);
  const r1 =
    (semiMajorAxis * (1 - eccentricitySquared)) /
    (1 - eccentricitySquared * Math.sin(footprintLatitude) ** 2) ** 1.5;
  const d = (x - falseEasting) / (n1 * scaleFactor);
  const latitude =
    footprintLatitude -
    ((n1 * Math.tan(footprintLatitude)) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * secondEccentricitySquared) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * secondEccentricitySquared - 3 * c1 ** 2) *
          d ** 6) /
          720);
  const longitude =
    toRadians(longitudeOrigin) +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * secondEccentricitySquared + 24 * t1 ** 2) *
        d ** 5) /
        120) /
      Math.cos(footprintLatitude);

  return { lat: toDegrees(latitude), lng: toDegrees(longitude) };
}

function meridionalArc(latitudeDegrees: number): number {
  const phi = toRadians(latitudeDegrees);

  return (
    semiMajorAxis *
    ((1 -
      eccentricitySquared / 4 -
      (3 * eccentricitySquared ** 2) / 64 -
      (5 * eccentricitySquared ** 3) / 256) *
      phi -
      ((3 * eccentricitySquared) / 8 +
        (3 * eccentricitySquared ** 2) / 32 +
        (45 * eccentricitySquared ** 3) / 1024) *
        Math.sin(2 * phi) +
      ((15 * eccentricitySquared ** 2) / 256 + (45 * eccentricitySquared ** 3) / 1024) *
        Math.sin(4 * phi) -
      ((35 * eccentricitySquared ** 3) / 3072) * Math.sin(6 * phi))
  );
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
