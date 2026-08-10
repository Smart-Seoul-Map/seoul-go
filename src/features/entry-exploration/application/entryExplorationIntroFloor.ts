import * as THREE from "three";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { getEntryExplorationIntroTheme } from "./entryExplorationIntroTheme";

const INTRO_COPY_CANVAS_SIZE = {
  height: 320,
  width: 1_400,
} as const;
const INTRO_BUTTON_CANVAS_SIZE = {
  height: 240,
  width: 640,
} as const;
const INTRO_DESCRIPTION = [
  "서울 지도를 직접 걸으며 새로운 장소를 발견해 보세요.",
  "가고 싶은 곳을 클릭하면 캐릭터가 이동해요.",
] as const;
const INTRO_FLOOR_CONFIG = {
  button: {
    depth: 1.25,
    width: 3.6,
    yOffset: 0.07,
  },
  copy: {
    depth: 2.2,
    position: { x: -0.9, z: -0.9 },
    width: 9.6,
    yOffset: 0.06,
  },
  logo: {
    depth: 3.4,
    position: { x: -2.8, z: -2.8 },
    width: 6.8,
    yOffset: 0.05,
  },
} as const;
const textureLoader = new THREE.TextureLoader();

export type EntryExplorationIntroFloor = {
  buttonMesh: THREE.Mesh;
  cancelPendingRefresh: () => void;
  object: THREE.Group;
  setButtonPressed: () => void;
};

export function createEntryExplorationIntroFloor(): EntryExplorationIntroFloor {
  const object = new THREE.Group();
  const logoMesh = createLogoMesh();
  const copy = createCopyMesh();
  const button = createButtonMesh();

  object.add(logoMesh);
  object.add(copy.mesh);
  object.add(button.mesh);

  const cancelPendingRefresh = refreshAfterFontsLoad(() => {
    copy.draw();
    button.draw();
  });

  return {
    buttonMesh: button.mesh,
    cancelPendingRefresh,
    object,
    setButtonPressed: button.setPressed,
  };
}

function createLogoMesh(): THREE.Mesh {
  const texture = textureLoader.load(ENTRY_EXPLORATION_TEXTURE_ASSETS.seoulExplorationGo.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  return createFloorPlaneMesh({
    depth: INTRO_FLOOR_CONFIG.logo.depth,
    material: new THREE.MeshBasicMaterial({
      alphaTest: 0.02,
      depthWrite: false,
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    position: INTRO_FLOOR_CONFIG.logo.position,
    width: INTRO_FLOOR_CONFIG.logo.width,
    yOffset: INTRO_FLOOR_CONFIG.logo.yOffset,
  });
}

function createCopyMesh(): { draw: () => void; mesh: THREE.Mesh } {
  const canvas = document.createElement("canvas");
  canvas.width = INTRO_COPY_CANVAS_SIZE.width;
  canvas.height = INTRO_COPY_CANVAS_SIZE.height;

  const context = getCanvasContext(canvas);
  const texture = createCanvasTexture(canvas);
  const mesh = createFloorPlaneMesh({
    depth: INTRO_FLOOR_CONFIG.copy.depth,
    material: new THREE.MeshBasicMaterial({
      depthWrite: false,
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    position: INTRO_FLOOR_CONFIG.copy.position,
    width: INTRO_FLOOR_CONFIG.copy.width,
    yOffset: INTRO_FLOOR_CONFIG.copy.yOffset,
  });

  const draw = () => {
    const theme = getEntryExplorationIntroTheme();

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${theme.copy.titleFontWeight} ${theme.copy.titleFontSize}px ${theme.fontFamily}`;
    context.fillStyle = theme.copy.titleColor;
    context.fillText(INTRO_DESCRIPTION[0], INTRO_COPY_CANVAS_SIZE.width / 2, 112);
    context.font = `${theme.copy.bodyFontWeight} ${theme.copy.bodyFontSize}px ${theme.fontFamily}`;
    context.fillStyle = theme.copy.bodyColor;
    context.fillText(INTRO_DESCRIPTION[1], INTRO_COPY_CANVAS_SIZE.width / 2, 214);
    texture.needsUpdate = true;
  };

  draw();

  return { draw, mesh };
}

function createButtonMesh(): {
  draw: () => void;
  mesh: THREE.Mesh;
  setPressed: () => void;
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

  let isPressed = false;
  const draw = () => {
    drawButton(context, isPressed);
    texture.needsUpdate = true;
  };

  draw();

  return {
    draw,
    mesh,
    setPressed: () => {
      isPressed = true;
      draw();
    },
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
  mesh.rotation.set(-Math.PI / 2, 0, getCameraFacingFloorRotationY());

  return mesh;
}

function createCanvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;

  return texture;
}

function drawButton(context: CanvasRenderingContext2D, isPressed: boolean): void {
  const theme = getEntryExplorationIntroTheme();
  const width = INTRO_BUTTON_CANVAS_SIZE.width;
  const height = INTRO_BUTTON_CANVAS_SIZE.height;
  const horizontalPadding = 34;
  const buttonWidth = width - horizontalPadding * 2;
  const buttonHeight = 150;
  const shadowY = isPressed ? 48 : 60;
  const buttonY = isPressed ? 38 : 24;

  context.clearRect(0, 0, width, height);
  context.fillStyle = isPressed ? theme.button.disabledTextColor : theme.button.activeShadowColor;
  fillRoundedRectangle(
    context,
    horizontalPadding,
    shadowY,
    buttonWidth,
    buttonHeight,
    theme.button.radius
  );
  context.fillStyle = isPressed ? theme.button.disabledColor : theme.button.activeColor;
  fillRoundedRectangle(
    context,
    horizontalPadding,
    buttonY,
    buttonWidth,
    buttonHeight,
    theme.button.radius
  );
  context.fillStyle = isPressed ? theme.button.disabledTextColor : theme.button.textColor;
  context.font = `${theme.button.fontWeight} ${theme.button.fontSize}px ${theme.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("시작하기", width / 2, buttonY + buttonHeight / 2 + 2);
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

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create the entry exploration intro texture.");
  }

  return context;
}

function getCameraFacingFloorRotationY(): number {
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

  return Math.atan2(cameraOffset.x, cameraOffset.z);
}
