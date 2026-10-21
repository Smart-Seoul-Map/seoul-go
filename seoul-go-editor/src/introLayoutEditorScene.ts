import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

import type { EntryEditionPlace } from "@features/entry-exploration";

import { createEntryEditionModel } from "../../src/features/entry-exploration/application/entryEditionModel";
import { createEntryEditionScenery } from "../../src/features/entry-exploration/application/entryEditionScenery";
import { loadEntryExplorationGltf } from "../../src/features/entry-exploration/application/entryExplorationGltfLoader";
import { createEntryExplorationArcheryRange } from "../../src/features/entry-exploration/application/entryExplorationArcheryRange";
import { createEntryExplorationGuideArrow } from "../../src/features/entry-exploration/application/entryExplorationGuideArrow";
import { createEntryExplorationIntroFloor } from "../../src/features/entry-exploration/application/entryExplorationIntroFloor";
import { getEntryExplorationIntroTheme } from "../../src/features/entry-exploration/application/entryExplorationIntroTheme";
import { createEntryExplorationScenery } from "../../src/features/entry-exploration/application/entryExplorationScenery";
import {
  createEntryExplorationStickers,
  getEntryExplorationStickerId,
} from "../../src/features/entry-exploration/application/entryExplorationStickers";
import { createEntrySlotInteraction } from "../../src/features/entry-exploration/application/entrySlotInteraction";
import {
  addEntryExplorationLights,
  createEntryExplorationCamera,
  createEntryExplorationFloorMesh,
  createEntryExplorationRenderer,
  createEntryExplorationSceneObject,
  disposeEntryExplorationObject3D,
  resizeEntryExplorationCamera,
  updateEntryExplorationCameraView,
} from "../../src/features/entry-exploration/application/entryExplorationThreeScene";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../../src/features/entry-exploration/config/entryExplorationSceneConfig";
import { ENTRY_EXPLORATION_SCENE_OBJECTS } from "../../src/features/entry-exploration/config/entryExplorationSceneObjects";
import { ENTRY_EXPLORATION_SCENERY_OBJECTS } from "../../src/features/entry-exploration/config/entryExplorationSceneryObjects";
import {
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayout,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import {
  getEntryIntroLayoutModelPlaceId,
  isEntryIntroLayoutModelId,
  resolveEntryIntroLayoutView,
  toEntryIntroLayoutModelId,
} from "../../src/features/entry-exploration/domain/entryIntroLayout";
import type { EntryExplorationScenePoint } from "../../src/features/entry-exploration/domain/entryExplorationSceneMath";
import { type IntroLayoutCameraPreset, type IntroLayoutItemId } from "./introLayoutEditorMessages";
import { INTRO_LAYOUT_DRAFT_MODEL, type IntroLayoutDraftModelUrls } from "./introLayoutDraftModels";
import { getIntroLayoutEditionModels, type IntroLayoutModelUrls } from "./introLayoutModels";
import { getIntroLayoutStickerUrls, type IntroLayoutStickerUrls } from "./introLayoutStickers";
import type { IntroLayoutItemKind } from "./introLayoutTree";

type IntroLayoutEditorSceneOptions = {
  container: HTMLElement;
  isEditable: boolean;
  onMove: (id: IntroLayoutItemId, point: EntryExplorationScenePoint) => void;
  onSelect: (id: IntroLayoutItemId) => void;
};

type DraftModelHolder = {
  url: string;
  holder: THREE.Group;
  dispose: () => void;
};

export type IntroLayoutHandle = {
  point: EntryExplorationScenePoint;
  kind: IntroLayoutItemKind;
};

type CameraView = {
  focus: EntryExplorationScenePoint;
  offset: EntryExplorationScenePoint & { y: number };
  zoom: number;
};

type PointerGesture =
  | {
      kind: "drag";
      id: IntroLayoutItemId;
      grabOffset: EntryExplorationScenePoint;
    }
  | { kind: "pan"; anchor: EntryExplorationScenePoint };

export type IntroLayoutEditorScene = ReturnType<typeof createIntroLayoutEditorScene>;

const EDITOR_PIXEL_RATIO = 1;
const HANDLE_COLORS: Record<IntroLayoutItemKind, number> = {
  model: 0x1f6feb,
  fixed: 0x1f6feb,
  group: 0x8250df,
  sticker: 0x1a7f37,
  draftModel: 0xbf8700,
};
const SELECTED_HANDLE_COLOR = 0xff5a1f;
const RELATED_HANDLE_COLOR = 0xffb38a;
const HANDLE_INNER_RADIUS = 0.5;
const HANDLE_OUTER_RADIUS = 0.85;
const GROUP_HANDLE_SCALE = 1.4;
const HANDLE_SEGMENTS = 32;
const HANDLE_SURFACE_HEIGHT = 0.12;
const HANDLE_RENDER_ORDER = 10;
const POINT_PRECISION = 100;
const CAMERA_ZOOM_RANGE = { min: 0.3, max: 4 } as const;
const WHEEL_ZOOM_FACTOR = 1.1;

const { cameraOffset, floorTextureRepeat, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;

export function createIntroLayoutEditorScene({
  container,
  isEditable,
  onMove,
  onSelect,
}: IntroLayoutEditorSceneOptions) {
  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const scene = new THREE.Scene();
  const camera = createEntryExplorationCamera(width, height);
  const renderer = createEntryExplorationRenderer(width, height);
  const labels = new CSS2DRenderer();
  const floor = createEntryExplorationFloorMesh();
  const floorMaterial = floor.material as THREE.MeshStandardMaterial;
  const originalFloorMap = floorMaterial.map;
  const introFloor = createEntryExplorationIntroFloor();
  const scenery = createEntryExplorationScenery();
  let stickers = createEntryExplorationStickers();
  const archeryRange = createEntryExplorationArcheryRange();
  const slotMachine = createEntrySlotInteraction();
  const draftModels = new THREE.Group();
  const draftHolders = new Map<string, DraftModelHolder>();
  const overlays = ENTRY_EXPLORATION_SCENE_OBJECTS.map((object) => ({
    id: object.id,
    mesh: createEntryExplorationSceneObject(object),
  }));
  const handleGeometry = new THREE.RingGeometry(
    HANDLE_INNER_RADIUS,
    HANDLE_OUTER_RADIUS,
    HANDLE_SEGMENTS
  ).rotateX(-Math.PI / 2);
  const handleMaterials = new Map<number, THREE.MeshBasicMaterial>();
  const handleGroup = new THREE.Group();
  const handles = new Map<IntroLayoutItemId, THREE.Mesh>();
  const handleKinds = new Map<IntroLayoutItemId, IntroLayoutItemKind>();
  const handlePoints = new Map<IntroLayoutItemId, EntryExplorationScenePoint>();
  const itemIds = new WeakMap<THREE.Object3D, IntroLayoutItemId>();
  const guideColor = getEntryExplorationIntroTheme().guideColor;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let places: readonly EntryEditionPlace[] = [];
  let modelUrls: IntroLayoutModelUrls = {};
  let draftModelUrls: IntroLayoutDraftModelUrls = {};
  let editionScenery = createEntryEditionScenery(places, ignoreApproach);
  let guideArrow: ReturnType<typeof createEntryExplorationGuideArrow> | null = null;
  let layout = resolveEntryIntroLayoutView(ENTRY_INTRO_LAYOUTS, "pc");
  let selectedId: IntroLayoutItemId | null = null;
  let relatedIds = new Set<IntroLayoutItemId>();
  let cameraView: CameraView = { focus: intro.targetPosition, offset: cameraOffset, zoom: 1 };
  let gesture: PointerGesture | null = null;
  let floorOverride: THREE.Texture | null = null;
  let floorRequest = 0;
  let frameId = 0;

  ENTRY_EXPLORATION_SCENERY_OBJECTS.forEach(({ key }) => {
    const sprite = scenery.object.getObjectByName(`entry-scenery-${key}`);

    if (sprite) itemIds.set(sprite, key);
  });
  itemIds.set(archeryRange.object, "archery-range");
  itemIds.set(slotMachine.object, "slot-machine");
  itemIds.set(introFloor.object, "intro-background");
  overlays.forEach(({ id, mesh }) => itemIds.set(mesh, id));

  const getHandleMaterial = (color: number): THREE.MeshBasicMaterial => {
    const known = handleMaterials.get(color);

    if (known) return known;

    const material = createHandleMaterial(color);
    handleMaterials.set(color, material);

    return material;
  };

  const paintHandles = (): void => {
    handles.forEach((mesh, id) => {
      const isSelected = id === selectedId;
      const color = isSelected
        ? SELECTED_HANDLE_COLOR
        : relatedIds.has(id)
          ? RELATED_HANDLE_COLOR
          : HANDLE_COLORS[handleKinds.get(id) ?? "fixed"];

      mesh.material = getHandleMaterial(color);
      mesh.renderOrder = isSelected ? HANDLE_RENDER_ORDER + 1 : HANDLE_RENDER_ORDER;
    });
  };

  const syncHandles = (nextHandles: ReadonlyMap<IntroLayoutItemId, IntroLayoutHandle>): void => {
    handles.forEach((mesh, id) => {
      if (nextHandles.has(id)) return;

      mesh.removeFromParent();
      handles.delete(id);
      handleKinds.delete(id);
      handlePoints.delete(id);
    });
    nextHandles.forEach(({ point, kind }, id) => {
      let mesh = handles.get(id);

      if (!mesh) {
        mesh = new THREE.Mesh(handleGeometry, getHandleMaterial(HANDLE_COLORS[kind]));
        itemIds.set(mesh, id);
        handles.set(id, mesh);
        handleGroup.add(mesh);
      }

      mesh.scale.setScalar(kind === "group" ? GROUP_HANDLE_SCALE : 1);
      mesh.position.set(point.x, HANDLE_SURFACE_HEIGHT, point.z);
      handleKinds.set(id, kind);
      handlePoints.set(id, point);
    });
    paintHandles();
  };

  const placeGuideArrow = (destination: EntryExplorationScenePoint | null): void => {
    guideArrow?.object.removeFromParent();
    guideArrow?.dispose();
    guideArrow = null;

    if (!destination) {
      return;
    }

    guideArrow = createEntryExplorationGuideArrow({
      origin: intro.targetPosition,
      destination,
      color: guideColor,
    });
    guideArrow.start(performance.now(), true);
    scene.add(guideArrow.object);
  };

  const applyLayout = (
    nextLayout: EntryIntroLayout,
    nextHandles: ReadonlyMap<IntroLayoutItemId, IntroLayoutHandle>
  ): void => {
    layout = nextLayout;
    const bounds = container.getBoundingClientRect();
    introFloor.applyLayout(layout, Math.max(bounds.width, 1) / Math.max(bounds.height, 1));
    scenery.applyLayout(layout);
    stickers.applyLayout(layout);
    archeryRange.applyLayout(layout);
    slotMachine.setLayout?.(layout);
    syncDraftModels();
    overlays.forEach(({ id, mesh }) => {
      const placement = layout.objects[id];

      mesh.position.setX(placement.x).setZ(placement.z);
    });
    syncHandles(isEditable ? nextHandles : new Map());
    placeGuideArrow(editionScenery.applyLayout(layout));
  };

  const renderPlaces = (): void => {
    editionScenery.dispose();
    editionScenery = createEntryEditionScenery(
      places,
      ignoreApproach,
      getIntroLayoutEditionModels(modelUrls)
    );
    places.forEach((place) => {
      const landmark = editionScenery.landmarks.get(place.id);

      if (landmark) itemIds.set(landmark, toEntryIntroLayoutModelId(place.id));
    });
    scene.add(editionScenery.object);
    placeGuideArrow(editionScenery.applyLayout(layout));
  };

  const setPlaces = (nextPlaces: readonly EntryEditionPlace[]): void => {
    places = nextPlaces;
    renderPlaces();
  };

  const setModelUrls = (urls: IntroLayoutModelUrls): void => {
    modelUrls = urls;
    renderPlaces();
  };

  const syncDraftModels = (): void => {
    const shownIds = new Set<string>();

    layout.draftModels.forEach(({ id, asset, placement }) => {
      const url = draftModelUrls[asset];

      if (!url) return;

      let entry = draftHolders.get(id);

      if (entry?.url !== url) {
        entry?.dispose();
        entry = createDraftModelHolder(url);
        itemIds.set(entry.holder, id);
        draftModels.add(entry.holder);
        draftHolders.set(id, entry);
      }

      entry.holder.position.set(placement.x, 0.06, placement.z);
      entry.holder.scale.setScalar(placement.scale);
      entry.holder.rotation.set(0, THREE.MathUtils.degToRad(placement.rotation), 0);
      shownIds.add(id);
    });
    draftHolders.forEach((entry, id) => {
      if (shownIds.has(id)) return;

      entry.dispose();
      draftHolders.delete(id);
    });
  };

  const setDraftModelUrls = (urls: IntroLayoutDraftModelUrls): void => {
    draftModelUrls = urls;
    syncDraftModels();
  };

  const setStickerUrls = (urls: IntroLayoutStickerUrls): void => {
    stickers.dispose();
    stickers = createEntryExplorationStickers(getIntroLayoutStickerUrls(urls));
    scene.add(stickers.object);
    stickers.applyLayout(layout);
  };

  const setFloorTexture = (url: string | null): void => {
    floorRequest += 1;
    const request = floorRequest;

    if (!url) {
      floorOverride?.dispose();
      floorOverride = null;
      floorMaterial.map = originalFloorMap;
      floorMaterial.needsUpdate = true;
      return;
    }

    new THREE.TextureLoader().load(url, (texture) => {
      if (request !== floorRequest) {
        texture.dispose();
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(floorTextureRepeat, floorTextureRepeat);
      floorOverride?.dispose();
      floorOverride = texture;
      floorMaterial.map = texture;
      floorMaterial.needsUpdate = true;
    });
  };

  const setSelection = (id: IntroLayoutItemId | null, related: readonly IntroLayoutItemId[]) => {
    selectedId = id;
    relatedIds = new Set(related);
    paintHandles();
  };

  const applyCameraView = (view: CameraView): void => {
    cameraView = view;
    updateEntryExplorationCameraView(camera, view.focus, view.offset, view.zoom);
    camera.updateMatrixWorld();
  };

  const getCameraPreset = (preset: IntroLayoutCameraPreset): CameraView =>
    preset === "intro"
      ? { focus: introFloor.getCenter(), offset: intro.camera.offset, zoom: intro.camera.zoom }
      : { focus: intro.targetPosition, offset: cameraOffset, zoom: 1 };

  const findTaggedItemId = (object: THREE.Object3D): IntroLayoutItemId | null => {
    let current: THREE.Object3D | null = object;

    while (current) {
      const id = itemIds.get(current) ?? getEntryExplorationStickerId(current);

      if (id) return id;

      current = current.parent;
    }

    return null;
  };

  const pickItemId = (): IntroLayoutItemId | null => {
    const targetGroups = [
      [handleGroup],
      [
        scenery.object,
        stickers.object,
        editionScenery.object,
        archeryRange.object,
        slotMachine.object,
        draftModels,
      ],
      [introFloor.object, ...overlays.map(({ mesh }) => mesh)],
    ];

    for (const targets of targetGroups) {
      for (const hit of raycaster.intersectObjects(targets, true)) {
        const id = findTaggedItemId(hit.object);

        if (id && handles.has(id)) return id;
      }
    }

    return null;
  };

  const aimAt = (event: PointerEvent): void => {
    const bounds = renderer.domElement.getBoundingClientRect();

    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
  };

  const getFloorPoint = (): EntryExplorationScenePoint | null => {
    const hit = raycaster.ray.intersectPlane(floorPlane, new THREE.Vector3());

    return hit ? { x: hit.x, z: hit.z } : null;
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    aimAt(event);
    const floorPoint = getFloorPoint();

    if (!floorPoint) {
      return;
    }

    const id = isEditable ? pickItemId() : null;

    if (id && id !== selectedId) {
      onSelect(id);
      return;
    }

    renderer.domElement.setPointerCapture(event.pointerId);
    const point = id ? handlePoints.get(id) : undefined;
    gesture =
      id && point
        ? { kind: "drag", id, grabOffset: { x: point.x - floorPoint.x, z: point.z - floorPoint.z } }
        : { kind: "pan", anchor: floorPoint };
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!gesture) {
      return;
    }

    aimAt(event);
    const floorPoint = getFloorPoint();

    if (!floorPoint) {
      return;
    }

    if (gesture.kind === "pan") {
      applyCameraView({
        ...cameraView,
        focus: {
          x: cameraView.focus.x + gesture.anchor.x - floorPoint.x,
          z: cameraView.focus.z + gesture.anchor.z - floorPoint.z,
        },
      });
      return;
    }

    onMove(
      gesture.id,
      roundScenePoint({
        x: floorPoint.x + gesture.grabOffset.x,
        z: floorPoint.z + gesture.grabOffset.z,
      })
    );
  };

  const handlePointerUp = (event: PointerEvent): void => {
    gesture = null;

    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    const zoom = THREE.MathUtils.clamp(
      cameraView.zoom * factor,
      CAMERA_ZOOM_RANGE.min,
      CAMERA_ZOOM_RANGE.max
    );

    applyCameraView({ ...cameraView, zoom });
  };

  const resize = (): void => {
    const bounds = container.getBoundingClientRect();
    const nextWidth = Math.max(bounds.width, 1);
    const nextHeight = Math.max(bounds.height, 1);

    resizeEntryExplorationCamera(camera, nextWidth, nextHeight);
    renderer.setSize(nextWidth, nextHeight, false);
    labels.setSize(nextWidth, nextHeight);
  };

  const render = (): void => {
    renderer.render(scene, camera);
    labels.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };

  renderer.setPixelRatio(EDITOR_PIXEL_RATIO);
  labels.setSize(width, height);
  labels.domElement.className = "EntryEditionLabels";
  container.append(renderer.domElement, labels.domElement);
  addEntryExplorationLights(scene);
  scene.add(
    floor,
    introFloor.object,
    scenery.object,
    stickers.object,
    editionScenery.object,
    archeryRange.object,
    slotMachine.object,
    draftModels,
    ...overlays.map(({ mesh }) => mesh),
    handleGroup
  );
  slotMachine.prepare(renderer);
  applyLayout(layout, new Map());
  applyCameraView(cameraView);
  window.addEventListener("resize", resize);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);
  renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
  frameId = requestAnimationFrame(render);

  return {
    setLayout: applyLayout,
    setPlaces,
    setModelUrls,
    setStickerUrls,
    setDraftModelUrls,
    setSelection,
    setFloorTexture,
    showCameraPreset(preset: IntroLayoutCameraPreset): void {
      applyCameraView(getCameraPreset(preset));
    },
    focusOnItem(id: IntroLayoutItemId): void {
      const objects: Readonly<Record<string, EntryExplorationScenePoint>> = layout.objects;
      const point = isEntryIntroLayoutModelId(id)
        ? layout.models[getEntryIntroLayoutModelPlaceId(id)]
        : objects[id];

      if (point) applyCameraView({ focus: point, offset: cameraOffset, zoom: 1 });
    },
    dispose(): void {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      placeGuideArrow(null);
      scenery.dispose();
      stickers.dispose();
      editionScenery.dispose();
      archeryRange.dispose();
      slotMachine.dispose();
      draftHolders.forEach((entry) => entry.dispose());
      draftHolders.clear();
      floorOverride?.dispose();
      [floor, introFloor.object, ...overlays.map(({ mesh }) => mesh)].forEach(
        disposeEntryExplorationObject3D
      );
      handleGeometry.dispose();
      handleMaterials.forEach((material) => material.dispose());
      labels.domElement.remove();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

function ignoreApproach(): void {}

function createHandleMaterial(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    depthWrite: false,
    opacity: 0.9,
    side: THREE.DoubleSide,
    toneMapped: false,
    transparent: true,
  });
}

function roundScenePoint(point: EntryExplorationScenePoint): EntryExplorationScenePoint {
  return {
    x: Math.round(point.x * POINT_PRECISION) / POINT_PRECISION,
    z: Math.round(point.z * POINT_PRECISION) / POINT_PRECISION,
  };
}

function createDraftModelHolder(url: string): DraftModelHolder {
  const holder = new THREE.Group();
  let disposeModel: (() => void) | null = null;
  let disposed = false;

  void loadEntryExplorationGltf(url)
    .then((gltf) => {
      if (disposed) return;

      const model = createEntryEditionModel(gltf.scene, { ...INTRO_LAYOUT_DRAFT_MODEL, url });

      holder.add(model.object);
      disposeModel = model.dispose;
    })
    .catch(() => undefined);

  return {
    url,
    holder,
    dispose(): void {
      disposed = true;
      disposeModel?.();
      holder.removeFromParent();
    },
  };
}
