import * as THREE from "three";

import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { SEOUL_GRID_MAP_CONFIG } from "../config/seoulGridNumberConfig";
import { getSeoulGridCells, type SeoulGridCell } from "../domain/seoulGridNumber";
import { isSeoulGridCellSelectable } from "../domain/seoulGridNumberLines";
import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";

export type EntryExplorationDartSelectableLayerOptions = {
  mapSize: { depth: number; width: number };
  mapTexture: THREE.Texture | null;
};

export type EntryExplorationDartSelectableLayer = {
  dispose: () => void;
  object: THREE.Object3D;
  setHoveredCell: (cell: SeoulGridCell | null) => void;
  setNumbers: (numbers: readonly number[]) => void;
};

const LAYER_RENDER_ORDER = 998;
const CHANNEL_COUNT = 4;
const BYTE_MAX = 255;
const SELECTABLE_CELL_OPACITY = 0.5;
const MAP_ALPHA_THRESHOLD = 0.02;
const CELL_GAP_RATIO = 0.06;

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
uniform vec2 uGrid;
uniform vec2 uHoveredCell;
uniform vec3 uHoverColor;

varying vec2 vUv;

void main() {
  vec4 cell = texture2D(uCells, vUv);
  bool isHovered = floor(vUv * uGrid) == uHoveredCell;
  vec3 color = isHovered ? uHoverColor : cell.rgb;
  float cellAlpha = isHovered ? cell.a : cell.a * ${SELECTABLE_CELL_OPACITY.toFixed(2)};
  float mapAlpha = texture2D(uMap, vUv).a;
  vec2 cellUv = fract(vUv * uGrid);
  vec2 edgeDistance = min(cellUv, 1.0 - cellUv);
  float insideCell = step(${CELL_GAP_RATIO.toFixed(2)}, min(edgeDistance.x, edgeDistance.y));

  gl_FragColor = vec4(color, cellAlpha * insideCell * step(${MAP_ALPHA_THRESHOLD.toFixed(2)}, mapAlpha));
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

  const uniforms = {
    uCells: { value: cellTexture },
    uGrid: { value: new THREE.Vector2(columns, rows) },
    uHoveredCell: { value: new THREE.Vector2(-1, -1) },
    uHoverColor: { value: new THREE.Vector3() },
    uMap: { value: mapTexture },
  };
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    uniforms,
    vertexShader: VERTEX_SHADER,
  });
  const object = new THREE.Mesh(new THREE.PlaneGeometry(mapSize.width, mapSize.depth), material);

  object.name = "entry-dart-selectable-layer";
  object.renderOrder = LAYER_RENDER_ORDER;
  object.position.z = selectableLayer.yOffset;
  object.visible = false;

  const { hoverColor, selectableColor } = getEntryExplorationIntroTheme().dart;
  const [selectableRed, selectableGreen, selectableBlue] = toColorBytes(selectableColor);
  const cells = getSeoulGridCells();

  uniforms.uHoverColor.value.set(...toColorBytes(hoverColor)).divideScalar(BYTE_MAX);

  const setNumbers = (numbers: readonly number[]): void => {
    cells.forEach((cell) => {
      const textureRow = rows - 1 - cell.row;
      const offset = (textureRow * columns + cell.column) * CHANNEL_COUNT;

      if (!isSeoulGridCellSelectable(cell, numbers)) {
        cellData[offset + 3] = 0;

        return;
      }

      cellData.set([selectableRed, selectableGreen, selectableBlue, BYTE_MAX], offset);
    });
    cellTexture.needsUpdate = true;
  };

  const setHoveredCell = (cell: SeoulGridCell | null): void => {
    uniforms.uHoveredCell.value.set(cell?.column ?? -1, cell ? rows - 1 - cell.row : -1);
  };

  return { dispose: () => cellTexture.dispose(), object, setHoveredCell, setNumbers };
}

function toColorBytes(color: string): [number, number, number] {
  const hex = new THREE.Color(color).getHex();

  return [(hex >> 16) & BYTE_MAX, (hex >> 8) & BYTE_MAX, hex & BYTE_MAX];
}
