import * as THREE from "three";

import { ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG } from "../config/entryExplorationSeoulTileMapViewConfig";
import { isSeoulGridCellValid, type SeoulGridCell } from "../domain/seoulGridNumber";

export type EntryExplorationDartHitMarkerLayout = {
  cellDepth: number;
  cellWidth: number;
  getCellLocalPosition: (cell: SeoulGridCell, zOffset: number) => THREE.Vector3;
};

export type EntryExplorationDartHitMarker = {
  object: THREE.Object3D;
  setCell: (cell: SeoulGridCell | null, layout: EntryExplorationDartHitMarkerLayout) => void;
};

const MARKER_RENDER_ORDER = 999;
const RING_SEGMENTS = 64;
const CELL_OFFSETS = [
  { column: 0, row: 0 },
  { column: 0, row: -1 },
  { column: 0, row: 1 },
  { column: -1, row: 0 },
  { column: 1, row: 0 },
] as const;

const { hitMarker } = ENTRY_EXPLORATION_SEOUL_TILE_MAP_VIEW_CONFIG;

export function createEntryExplorationDartHitMarker(): EntryExplorationDartHitMarker {
  const object = new THREE.Group();
  object.name = "entry-dart-hit-marker";
  object.visible = false;

  const cellMaterial = createMarkerMaterial(hitMarker.cellColor, hitMarker.cellOpacity);
  const ringMaterial = createMarkerMaterial(hitMarker.ring.color, 1);
  const cellMeshes = CELL_OFFSETS.map(() => createMarkerMesh(createCellGeometry(), cellMaterial));
  const borderMesh = createMarkerMesh(
    createCellGeometry(),
    createMarkerMaterial(hitMarker.borderColor, 1)
  );
  const centerMesh = createMarkerMesh(
    createCellGeometry(),
    createMarkerMaterial(hitMarker.centerColor, 1)
  );
  const outerRingMesh = createMarkerMesh(createRingGeometry(hitMarker.ring.outer), ringMaterial);
  const innerRingMesh = createMarkerMesh(createRingGeometry(hitMarker.ring.inner), ringMaterial);

  object.add(...cellMeshes, borderMesh, centerMesh, outerRingMesh, innerRingMesh);

  const setCell = (
    cell: SeoulGridCell | null,
    { cellDepth, cellWidth, getCellLocalPosition }: EntryExplorationDartHitMarkerLayout
  ): void => {
    if (!cell) {
      object.visible = false;

      return;
    }

    object.position.copy(getCellLocalPosition(cell, hitMarker.yOffset));
    cellMeshes.forEach((mesh, index) => {
      const offset = CELL_OFFSETS[index];

      mesh.visible = isSeoulGridCellValid({
        column: cell.column + offset.column,
        row: cell.row + offset.row,
      });
      mesh.scale.set(cellWidth, cellDepth, 1);
      mesh.position.set(offset.column * cellWidth, -offset.row * cellDepth, 0);
    });
    borderMesh.scale.set(cellWidth, cellDepth, 1);
    borderMesh.position.setZ(hitMarker.layerGap);
    centerMesh.scale.set(cellWidth * hitMarker.centerScale, cellDepth * hitMarker.centerScale, 1);
    centerMesh.position.setZ(hitMarker.layerGap * 2);
    outerRingMesh.scale.setScalar(cellWidth);
    outerRingMesh.position.setZ(hitMarker.layerGap * 3);
    innerRingMesh.scale.setScalar(cellWidth);
    innerRingMesh.position.setZ(hitMarker.layerGap * 3);
    object.visible = true;
  };

  return { object, setCell };
}

function createMarkerMaterial(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity,
    transparent: true,
  });
}

function createMarkerMesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);

  mesh.renderOrder = MARKER_RENDER_ORDER;

  return mesh;
}

function createCellGeometry(): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(1, 1);
}

function createRingGeometry({
  radiusCells,
  widthCells,
}: {
  radiusCells: number;
  widthCells: number;
}): THREE.RingGeometry {
  return new THREE.RingGeometry(
    radiusCells - widthCells / 2,
    radiusCells + widthCells / 2,
    RING_SEGMENTS
  );
}
