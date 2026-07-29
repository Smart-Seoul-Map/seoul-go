import * as THREE from "three";

import type { EntryExplorationFloorOverlayObject } from "../config/entryExplorationSceneObjects";
import type { Line2RoutePoint } from "../domain/line2Station";

const ENTRY_EXPLORATION_SUBWAY_TRAIN_TEXTURE_SIZE = {
  width: 128,
  height: 96,
} as const;

let subwayTrainTexture: THREE.CanvasTexture | null = null;

export function createEntryExplorationSubwayTrainMarker(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(0.88, 0.62);
  const material = new THREE.MeshBasicMaterial({
    depthWrite: false,
    map: getSubwayTrainTexture(),
    transparent: true,
  });
  const marker = new THREE.Mesh(geometry, material);

  marker.position.z = 0.08;
  marker.renderOrder = 4;
  marker.visible = false;

  return marker;
}

export function updateEntryExplorationSubwayTrainMarker(
  marker: THREE.Mesh,
  mapObject: EntryExplorationFloorOverlayObject,
  point: Line2RoutePoint
): void {
  const localX = (point.x / 100 - 0.5) * mapObject.size.width;
  const localY = (0.5 - point.y / 100) * mapObject.size.depth;

  marker.position.set(localX, localY, 0.08);
  marker.visible = true;
}

function getSubwayTrainTexture(): THREE.CanvasTexture {
  if (subwayTrainTexture) {
    return subwayTrainTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = ENTRY_EXPLORATION_SUBWAY_TRAIN_TEXTURE_SIZE.width;
  canvas.height = ENTRY_EXPLORATION_SUBWAY_TRAIN_TEXTURE_SIZE.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create subway train texture.");
  }

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#17201a";
  context.lineWidth = 8;
  context.fillRect(12, 10, 104, 64);
  context.strokeRect(12, 10, 104, 64);
  context.fillStyle = "#bfe1ed";
  context.fillRect(27, 25, 28, 24);
  context.fillRect(73, 25, 28, 24);
  context.fillStyle = "#2e8b57";
  context.fillRect(16, 57, 96, 10);
  context.fillStyle = "#17201a";
  context.beginPath();
  context.arc(34, 80, 9, 0, Math.PI * 2);
  context.arc(94, 80, 9, 0, Math.PI * 2);
  context.fill();

  subwayTrainTexture = new THREE.CanvasTexture(canvas);
  subwayTrainTexture.colorSpace = THREE.SRGBColorSpace;

  return subwayTrainTexture;
}
