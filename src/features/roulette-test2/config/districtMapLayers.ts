import type { CSSProperties } from "react";

import { SEOUL_DISTRICTS } from "@shared/constants/district";

type DistrictLayerLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DistrictLayer = {
  id: number;
  name: string;
  image: string;
  layerStyle: CSSProperties;
};

const mapSize = {
  width: 898,
  height: 801,
};

const districtLayerLayoutById: Record<number, DistrictLayerLayout> = {
  1: { left: 526, top: 497, width: 246, height: 225 },
  2: { left: 442, top: 520, width: 267, height: 281 },
  3: { left: 406, top: 195, width: 151, height: 194 },
  4: { left: 417, top: 381, width: 139, height: 70 },
  5: { left: 650, top: 462, width: 197, height: 237 },
  6: { left: 240, top: 440, width: 143, height: 195 },
  7: { left: 191, top: 311, width: 232, height: 184 },
  8: { left: 383, top: 436, width: 151, height: 114 },
  9: { left: 0, top: 273, width: 241, height: 222 },
  10: { left: 303, top: 276, width: 129, height: 139 },
  11: { left: 529, top: 383, width: 130, height: 120 },
  12: { left: 633, top: 376, width: 108, height: 139 },
  13: { left: 295, top: 608, width: 185, height: 165 },
  14: { left: 99, top: 547, width: 171, height: 124 },
  15: { left: 293, top: 533, width: 173, height: 129 },
  16: { left: 456, top: 183, width: 207, height: 177 },
  17: { left: 609, top: 2, width: 148, height: 253 },
  18: { left: 560, top: 283, width: 113, height: 132 },
  19: { left: 753, top: 371, width: 145, height: 166 },
  20: { left: 113, top: 443, width: 143, height: 121 },
  21: { left: 256, top: 117, width: 180, height: 233 },
  22: { left: 666, top: 236, width: 102, height: 147 },
  23: { left: 530, top: 0, width: 102, height: 198 },
  24: { left: 473, top: 44, width: 144, height: 215 },
  25: { left: 223, top: 628, width: 107, height: 149 },
};

function toPercent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

function toLayerStyle(id: number, layout: DistrictLayerLayout): CSSProperties {
  return {
    left: toPercent(layout.left, mapSize.width),
    top: toPercent(layout.top, mapSize.height),
    width: toPercent(layout.width, mapSize.width),
    height: toPercent(layout.height, mapSize.height),
    zIndex: id,
  };
}

function toDistrictImagePath(id: number): string {
  return `/roulette-map/map${String(id).padStart(2, "0")}.png`;
}

export const districtLayers: DistrictLayer[] = SEOUL_DISTRICTS.flatMap(({ id, name }) => {
  const layout = districtLayerLayoutById[id];

  if (!layout) {
    return [];
  }

  return [
    {
      id,
      name,
      image: toDistrictImagePath(id),
      layerStyle: toLayerStyle(id, layout),
    },
  ];
}).sort((a, b) => a.id - b.id);
