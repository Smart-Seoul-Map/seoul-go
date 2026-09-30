import * as THREE from "three";

import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { getSeoulGridCells } from "../domain/seoulGridNumber";
import { isSeoulGridCellOnNumberLine } from "../domain/seoulGridNumberLines";
import { readEntryExplorationTokenColor } from "./entryExplorationTokenColor";

export type EntryExplorationDartSelectableLayerOptions = {
  mapSize: { depth: number; width: number };
  mapTexture: THREE.Texture | null;
};

export type EntryExplorationDartSelectableLayer = {
  dispose: () => void;
  object: THREE.Object3D;
  setNumbers: (numbers: readonly number[]) => void;
};

const LAYER_RENDER_ORDER = 998;
const CHANNEL_COUNT = 4;
const BYTE_MAX = 255;
const MAP_ALPHA_THRESHOLD = 0.02;

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uCells;
uniform sampler2D uMap;

varying vec2 vUv;

void main() {
  vec4 cell = texture2D(uCells, vUv);
  float mapAlpha = texture2D(uMap, vUv).a;

  gl_FragColor = vec4(cell.rgb, cell.a * step(${MAP_ALPHA_THRESHOLD.toFixed(2)}, mapAlpha));
}
`;

const { selectableLayer } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;
const { columns, rows } = SEOUL_GRID_MAP_CONFIG;

export function createEntryExplorationDartSelectableLayer({
  mapSize,
  mapTexture,
}: EntryExplorationDartSelectableLayerOptions): EntryExplorationDartSelectableLayer {
  const cellData = new Uint8Array(columns * rows * CHANNEL_COUNT);
  const cellTexture = new THREE.DataTexture(cellData, columns, rows, THREE.RGBAFormat);

  cellTexture.magFilter = THREE.NearestFilter;
  cellTexture.minFilter = THREE.NearestFilter;
  cellTexture.needsUpdate = true;

  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    uniforms: {
      uCells: { value: cellTexture },
      uMap: { value: mapTexture },
    },
    vertexShader: VERTEX_SHADER,
  });
  const object = new THREE.Mesh(new THREE.PlaneGeometry(mapSize.width, mapSize.depth), material);

  object.name = "entry-dart-selectable-layer";
  object.renderOrder = LAYER_RENDER_ORDER;
  object.position.z = selectableLayer.yOffset;
  object.visible = false;

  const dimColor = readEntryExplorationTokenColor(selectableLayer.dimColor);
  const dimRed = (dimColor >> 16) & BYTE_MAX;
  const dimGreen = (dimColor >> 8) & BYTE_MAX;
  const dimBlue = dimColor & BYTE_MAX;
  const dimAlpha = Math.round(selectableLayer.dimOpacity * BYTE_MAX);
  const cells = getSeoulGridCells();

  const setNumbers = (numbers: readonly number[]): void => {
    cells.forEach((cell) => {
      const textureRow = rows - 1 - cell.row;
      const offset = (textureRow * columns + cell.column) * CHANNEL_COUNT;

      cellData[offset] = dimRed;
      cellData[offset + 1] = dimGreen;
      cellData[offset + 2] = dimBlue;
      cellData[offset + 3] = isSeoulGridCellOnNumberLine(cell, numbers) ? 0 : dimAlpha;
    });
    cellTexture.needsUpdate = true;
  };

  return { dispose: () => cellTexture.dispose(), object, setNumbers };
}
