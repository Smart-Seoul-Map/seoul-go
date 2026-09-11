import seoulGridCells from "./seoulGridCells.json";
import seoulGridProjection from "./seoulGridProjection.json";

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

export const UTMK_PROJECTION = seoulGridProjection.utmk;

export const SEOUL_GRID_MAP_CONFIG = {
  columns: seoulGridCells.columns,
  districtCellRows: seoulGridCells.districtCellRows as readonly string[],
  originKm: seoulGridCells.originKm,
  originUtmk: seoulGridCells.originUtmk,
  rows: seoulGridCells.rows,
} as const;
