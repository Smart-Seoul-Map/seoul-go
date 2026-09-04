import seoulGridCells from "./seoulGridCells.json";

export const SEOUL_GRID_NUMBER_LETTERS = [
  "가",
  "나",
  "다",
  "라",
  "마",
  "바",
  "사",
  "아",
  "자",
  "차",
  "카",
  "타",
  "파",
  "하",
] as const;

export const UTMK_PROJECTION = {
  falseEasting: 1_000_000,
  falseNorthing: 2_000_000,
  inverseFlattening: 298.257222101,
  latitudeOrigin: 38,
  longitudeOrigin: 127.5,
  scaleFactor: 0.9996,
  semiMajorAxis: 6_378_137,
} as const;

export const SEOUL_GRID_MAP_CONFIG = {
  columns: seoulGridCells.columns,
  districtCellRows: seoulGridCells.districtCellRows as readonly string[],
  originKm: seoulGridCells.originKm,
  originUtmk: seoulGridCells.originUtmk,
  rows: seoulGridCells.rows,
} as const;
