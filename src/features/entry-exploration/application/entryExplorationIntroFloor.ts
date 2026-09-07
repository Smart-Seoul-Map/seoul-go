import * as THREE from "three";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";

const INTRO_BUTTON_CANVAS_SIZE = {
  height: 240,
  width: 640,
} as const;

const INTRO_FLOOR_CONFIG = {
  button: {
    depth: 1.1,
    width: 5.2,
    yOffset: 0.07,
  },
  introBackground: {
    depth: 12.375,
    position: {
      x: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition.x - 7.2 / Math.SQRT2,
      z: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition.z - 7.2 / Math.SQRT2,
    },
    width: 22,
    yOffset: 0.05,
  },
} as const;

const textureLoader = new THREE.TextureLoader();

export type EntryExplorationIntroFloor = {
  cancelPendingRefresh: () => void;
  object: THREE.Group;
};

export function createEntryExplorationIntroFloor(): EntryExplorationIntroFloor {
  const object = new THREE.Group();
  const introBackgroundMesh = createIntroBackgroundMesh();
  const button = createButtonMesh();

  object.add(introBackgroundMesh);
  object.add(button.mesh);

  const cancelPendingRefresh = refreshAfterFontsLoad(() => {
    button.draw();
  });

  return {
    cancelPendingRefresh,
    object,
  };
}

function createIntroBackgroundMesh(): THREE.Mesh {
  const texture = textureLoader.load(ENTRY_EXPLORATION_TEXTURE_ASSETS.introBackground.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  return createFloorPlaneMesh({
    depth: INTRO_FLOOR_CONFIG.introBackground.depth,
    material: new THREE.MeshBasicMaterial({
      alphaTest: 0.02,
      depthWrite: false,
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    position: INTRO_FLOOR_CONFIG.introBackground.position,
    width: INTRO_FLOOR_CONFIG.introBackground.width,
    yOffset: INTRO_FLOOR_CONFIG.introBackground.yOffset,
  });
}

function createButtonMesh(): {
  draw: () => void;
  mesh: THREE.Mesh;
} {
  const canvas = document.createElement("canvas");
  canvas.width = INTRO_BUTTON_CANVAS_SIZE.width;
  canvas.height = INTRO_BUTTON_CANVAS_SIZE.height;

  const context = getCanvasContext(canvas);
  const texture = createCanvasTexture(canvas);
  const mesh = createFloorPlaneMesh({
    depth: INTRO_FLOOR_CONFIG.button.depth,
    material: new THREE.MeshBasicMaterial({
      depthWrite: false,
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    position: ENTRY_EXPLORATION_SCENE_CONFIG.intro.targetPosition,
    width: INTRO_FLOOR_CONFIG.button.width,
    yOffset: INTRO_FLOOR_CONFIG.button.yOffset,
  });

  const draw = () => {
    drawButton(context);
    texture.needsUpdate = true;
  };

  draw();

  return {
    draw,
    mesh,
  };
}

function createFloorPlaneMesh({
  depth,
  material,
  position,
  width,
  yOffset,
}: {
  depth: number;
  material: THREE.Material;
  position: { x: number; z: number };
  width: number;
  yOffset: number;
}): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(position.x, yOffset, position.z);
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;
  mesh.rotation.set(-Math.PI / 2, 0, Math.atan2(cameraOffset.x, cameraOffset.z));

  return mesh;
}

function createCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;

  return texture;
}

function drawButton(context: CanvasRenderingContext2D): void {
  const theme = getEntryExplorationIntroTheme();
  const width = INTRO_BUTTON_CANVAS_SIZE.width;
  const height = INTRO_BUTTON_CANVAS_SIZE.height;
  const horizontalPadding = 34;
  const buttonWidth = width - horizontalPadding * 2;
  const buttonHeight = 150;
  const buttonY = 24;

  context.clearRect(0, 0, width, height);
  context.fillStyle = theme.button.activeColor;
  fillRoundedRectangle(
    context,
    horizontalPadding,
    buttonY,
    buttonWidth,
    buttonHeight,
    theme.button.radius
  );
  context.lineWidth = 8;
  context.strokeStyle = theme.button.activeShadowColor;
  strokeRoundedRectangle(
    context,
    horizontalPadding,
    buttonY,
    buttonWidth,
    buttonHeight,
    theme.button.radius
  );
  context.fillStyle = theme.button.textColor;
  context.font = `${theme.button.fontWeight} ${theme.button.fontSize}px ${theme.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("탐방 시작", width / 2, buttonY + buttonHeight / 2 + 2);
}

function refreshAfterFontsLoad(refresh: () => void): () => void {
  let isCancelled = false;

  void document.fonts?.ready.then(() => {
    if (!isCancelled) {
      refresh();
    }
  });

  return () => {
    isCancelled = true;
  };
}

function fillRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const boundedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + boundedRadius, y);
  context.arcTo(x + width, y, x + width, y + height, boundedRadius);
  context.arcTo(x + width, y + height, x, y + height, boundedRadius);
  context.arcTo(x, y + height, x, y, boundedRadius);
  context.arcTo(x, y, x + width, y, boundedRadius);
  context.closePath();
  context.fill();
}

function strokeRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const boundedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.roundRect(x, y, width, height, boundedRadius);
  context.stroke();
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create the entry exploration intro texture.");
  }

  return context;
}
