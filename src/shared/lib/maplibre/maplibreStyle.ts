import type { StyleSpecification } from "maplibre-gl";

export const DEFAULT_TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function buildRasterMapStyle(tileUrlTemplate: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      "smart-seoul-raster": {
        type: "raster",
        tiles: [tileUrlTemplate],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "smart-seoul-raster",
        source: "smart-seoul-raster",
        type: "raster",
      },
    ],
  };
}
