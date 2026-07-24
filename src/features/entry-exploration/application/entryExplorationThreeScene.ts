import * as THREE from "three";

import { ENTRY_EXPLORATION_TEXTURE_ASSETS } from "../config/entryExplorationAssets";
import {
  ENTRY_EXPLORATION_FLOOR_TEXTURE_URL,
  ENTRY_EXPLORATION_SCENE_CONFIG,
} from "../config/entryExplorationSceneConfig";
import type {
  EntryExplorationFloorOverlayObject,
  EntryExplorationSceneObject,
  EntryExplorationStandingPropObject,
} from "../config/entryExplorationSceneObjects";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import type { Line2RoutePoint } from "../domain/line2Station";

const ENTRY_EXPLORATION_SCENE_CLEAR_COLOR = 0xf7f4ed;
const ENTRY_EXPLORATION_AMBIENT_SKY_COLOR = 0xffffff;
const ENTRY_EXPLORATION_AMBIENT_GROUND_COLOR = 0xa7b39f;
const ENTRY_EXPLORATION_KEY_LIGHT_COLOR = 0xffffff;
const ENTRY_EXPLORATION_KEY_LIGHT_POSITION = {
  x: -6,
  y: 16,
  z: 8,
} as const;
const ENTRY_EXPLORATION_STANDING_PROP_SHADOW_OFFSET = {
  x: 0.28,
  z: -0.22,
} as const;
const ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE = 128;
const ENTRY_EXPLORATION_SUBWAY_TRAIN_TEXTURE_SIZE = {
  width: 128,
  height: 96,
} as const;

const textureLoader = new THREE.TextureLoader();
let standingPropShadowTexture: THREE.CanvasTexture | null = null;
let subwayTrainTexture: THREE.CanvasTexture | null = null;

export function createEntryExplorationCamera(
  width: number,
  height: number
): THREE.OrthographicCamera {
  const aspect = width / height;
  const halfHeight = ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize / 2;
  const halfWidth = halfHeight * aspect;
  const camera = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfHeight,
    -halfHeight,
    0.1,
    1000
  );

  return camera;
}

export function resizeEntryExplorationCamera(
  camera: THREE.OrthographicCamera,
  width: number,
  height: number
): void {
  const aspect = width / height;
  const halfHeight = ENTRY_EXPLORATION_SCENE_CONFIG.cameraViewSize / 2;
  const halfWidth = halfHeight * aspect;

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
}

export function updateEntryExplorationCameraFocus(
  camera: THREE.OrthographicCamera,
  point: EntryExplorationScenePoint
): void {
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

  updateEntryExplorationCameraView(camera, point, cameraOffset, 1);
}

export function updateEntryExplorationCameraView(
  camera: THREE.OrthographicCamera,
  focus: EntryExplorationScenePoint,
  offset: EntryExplorationScenePoint & { y: number },
  zoom: number
): void {
  camera.position.set(focus.x + offset.x, offset.y, focus.z + offset.z);
  camera.lookAt(focus.x, 0, focus.z);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

export function createEntryExplorationRenderer(width: number, height: number): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(ENTRY_EXPLORATION_SCENE_CLEAR_COLOR, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;

  return renderer;
}

export function createEntryExplorationFloorMesh(): THREE.Mesh {
  const texture = textureLoader.load(ENTRY_EXPLORATION_FLOOR_TEXTURE_URL);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    ENTRY_EXPLORATION_SCENE_CONFIG.floorTextureRepeat,
    ENTRY_EXPLORATION_SCENE_CONFIG.floorTextureRepeat
  );

  const geometry = new THREE.PlaneGeometry(
    ENTRY_EXPLORATION_SCENE_CONFIG.floorSize,
    ENTRY_EXPLORATION_SCENE_CONFIG.floorSize
  );
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.82,
  });
  const floor = new THREE.Mesh(geometry, material);

  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  return floor;
}

export function createEntryExplorationFloorOverlayMesh(
  object: EntryExplorationFloorOverlayObject
): THREE.Mesh {
  const asset = ENTRY_EXPLORATION_TEXTURE_ASSETS[object.assetKey];
  const texture = textureLoader.load(asset.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(object.size.width, object.size.depth);
  const material = new THREE.MeshBasicMaterial({
    alphaTest: 0.02,
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(object.position.x, object.yOffset, object.position.z);
  mesh.rotation.set(-Math.PI / 2, 0, object.rotationY + getCameraFacingFloorOverlayRotationY());

  return mesh;
}

export function createEntryExplorationStandingPropGroup(
  object: EntryExplorationStandingPropObject
): THREE.Group {
  const group = new THREE.Group();
  const propMesh = createStandingPropMesh(object);
  const shadowMesh = createStandingPropShadowMesh(object);

  group.add(shadowMesh);
  group.add(propMesh);

  return group;
}

export function createEntryExplorationSceneObject(
  object: EntryExplorationSceneObject
): THREE.Object3D {
  if (object.type === "floorOverlay") {
    return createEntryExplorationFloorOverlayMesh(object);
  }

  return createEntryExplorationStandingPropGroup(object);
}

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

export function addEntryExplorationLights(scene: THREE.Scene): void {
  scene.add(
    new THREE.HemisphereLight(
      ENTRY_EXPLORATION_AMBIENT_SKY_COLOR,
      ENTRY_EXPLORATION_AMBIENT_GROUND_COLOR,
      2.4
    )
  );

  const keyLight = new THREE.DirectionalLight(ENTRY_EXPLORATION_KEY_LIGHT_COLOR, 2.8);
  keyLight.position.set(
    ENTRY_EXPLORATION_KEY_LIGHT_POSITION.x,
    ENTRY_EXPLORATION_KEY_LIGHT_POSITION.y,
    ENTRY_EXPLORATION_KEY_LIGHT_POSITION.z
  );
  keyLight.castShadow = true;
  configureEntryExplorationDirectionalLightShadow(keyLight);
  scene.add(keyLight);
}

export function fitEntryExplorationCharacterModel(model: THREE.Object3D): void {
  model.scale.setScalar(1);
  model.position.set(0, 0, 0);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const modelHeight = size.y || 1;

  model.scale.setScalar(ENTRY_EXPLORATION_SCENE_CONFIG.characterHeight / modelHeight);
  model.position.set(0, 0, 0);
}

export function disposeEntryExplorationObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.Line)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeEntryExplorationMaterial);
      return;
    }

    disposeEntryExplorationMaterial(child.material);
  });
}

function configureEntryExplorationDirectionalLightShadow(light: THREE.DirectionalLight): void {
  const shadowHalfSize = ENTRY_EXPLORATION_SCENE_CONFIG.shadowCameraSize / 2;

  light.shadow.camera.left = -shadowHalfSize;
  light.shadow.camera.right = shadowHalfSize;
  light.shadow.camera.top = shadowHalfSize;
  light.shadow.camera.bottom = -shadowHalfSize;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 80;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.updateProjectionMatrix();
}

function disposeEntryExplorationMaterial(material: THREE.Material): void {
  const materialWithMap = material as THREE.Material & { map?: THREE.Texture | null };

  materialWithMap.map?.dispose();
  material.dispose();
}

function getCameraFacingFloorOverlayRotationY(): number {
  const { cameraOffset } = ENTRY_EXPLORATION_SCENE_CONFIG;

  return Math.atan2(cameraOffset.x, cameraOffset.z);
}

function createStandingPropMesh(object: EntryExplorationStandingPropObject): THREE.Mesh {
  const asset = ENTRY_EXPLORATION_TEXTURE_ASSETS[object.assetKey];
  const texture = textureLoader.load(asset.src);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(object.size.width, object.size.height);
  const material = new THREE.MeshBasicMaterial({
    alphaTest: 0.02,
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(object.position.x, object.yOffset, object.position.z);
  mesh.rotation.set(0, object.rotationY + getCameraFacingFloorOverlayRotationY(), 0);

  return mesh;
}

function createStandingPropShadowMesh(object: EntryExplorationStandingPropObject): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    depthWrite: false,
    map: getStandingPropShadowTexture(),
    opacity: object.shadow.opacity,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(
    object.position.x + ENTRY_EXPLORATION_STANDING_PROP_SHADOW_OFFSET.x,
    0.025,
    object.position.z + ENTRY_EXPLORATION_STANDING_PROP_SHADOW_OFFSET.z
  );
  mesh.rotation.set(-Math.PI / 2, 0, object.rotationY + getCameraFacingFloorOverlayRotationY());
  mesh.scale.set(object.shadow.width, object.shadow.depth, 1);

  return mesh;
}

function getStandingPropShadowTexture(): THREE.CanvasTexture {
  if (standingPropShadowTexture) {
    return standingPropShadowTexture;
  }

  const canvas = document.createElement("canvas");
  canvas.width = ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE;
  canvas.height = ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create standing prop shadow texture.");
  }

  const center = ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 6, center, center, center);

  gradient.addColorStop(0, "rgba(23, 32, 26, 0.52)");
  gradient.addColorStop(0.45, "rgba(23, 32, 26, 0.24)");
  gradient.addColorStop(1, "rgba(23, 32, 26, 0)");

  context.fillStyle = gradient;
  context.fillRect(
    0,
    0,
    ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE,
    ENTRY_EXPLORATION_STANDING_PROP_SHADOW_TEXTURE_SIZE
  );

  standingPropShadowTexture = new THREE.CanvasTexture(canvas);
  standingPropShadowTexture.colorSpace = THREE.SRGBColorSpace;

  return standingPropShadowTexture;
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
