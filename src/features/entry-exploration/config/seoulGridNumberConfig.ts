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

export const SEOUL_GRID_MAP_CONFIG = {
  columns: seoulGridCells.columns,
  districtCellRows: seoulGridCells.districtCellRows as readonly string[],
  districtNames: seoulGridCells.districtNames as readonly string[],
  originKm: seoulGridCells.originKm,
  rows: seoulGridCells.rows,
} as const;
