import * as THREE from "three";

import seoulDistrictBoundariesJson from "@shared/data/seoulDistrictBoundaries.json";
import { easeOutCubic } from "@shared/lib/animation/easing";
import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import {
  createSceneCameraTransition,
  updateSceneCameraTransition,
  type SceneCameraTransition,
} from "@shared/lib/three/sceneCameraTransition";
import { isInsideSceneTriggerRadius } from "@shared/lib/three/sceneTrigger";

import {
  createEntryExplorationDistrictSelectionCameraTarget,
  ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG,
  ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET,
  ENTRY_EXPLORATION_DISTRICT_SELECTION_SCENE_PRESET,
} from "../config/entryExplorationDistrictSelectionEvent";
import {
  calculateEntryExplorationBounceContactRatio,
  calculateEntryExplorationBounceHeight,
  calculateEntryExplorationBounceSquashScale,
  calculateEntryExplorationMapGradientRatio,
  calculateEntryExplorationSelectionLandingPoint,
  calculateEntryExplorationSelectionPowerRatio,
  findEntryExplorationDistrictByPoint,
  getEntryExplorationProjectedDistrictRings,
  normalizeEntryExplorationSelectionDirection,
  projectEntryExplorationDistrictBoundaries,
  type EntryExplorationDistrictBoundaryFeature,
  type EntryExplorationDistrictSelectionPoint,
  type EntryExplorationProjectedDistrict,
} from "../domain/entryExplorationDistrictSelectionEvent";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";
import type { EntryExplorationSceneInteractionController } from "./useEntryExplorationSceneInteractionRegistry";

type EntryExplorationDistrictBoundaryCollection = {
  features: EntryExplorationDistrictBoundaryFeature[];
  type: "FeatureCollection";
};

export type EntryExplorationDistrictSelectionResult = {
  districtId: number | null;
  districtName: string | null;
};

export type EntryExplorationDistrictJumpSelectionInteractionOptions = {
  onSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
};

type ChargeState = {
  aimPoint: EntryExplorationDistrictSelectionPoint;
  startedAt: number;
};

type BounceFlightState = {
  chargeRatio: number;
  from: EntryExplorationDistrictSelectionPoint;
  selectedDistrict: EntryExplorationProjectedDistrict | null;
  startedAt: number;
  to: EntryExplorationDistrictSelectionPoint;
};

type DistrictMapParts = {
  districtMeshes: THREE.Mesh[];
  group: THREE.Group;
  interactionPlane: THREE.Mesh;
};

export type EntryExplorationDistrictJumpSelectionInteractionController =
  EntryExplorationSceneInteractionController & {
    deactivate: () => void;
    isActive: () => boolean;
    retrySelection: () => void;
  };

const DISTRICT_BOUNDARY_COLLECTION =
  seoulDistrictBoundariesJson as unknown as EntryExplorationDistrictBoundaryCollection;
const SCENE_PRESET = ENTRY_EXPLORATION_DISTRICT_SELECTION_SCENE_PRESET;
const characterBaseScale = new WeakMap<THREE.Object3D, THREE.Vector3>();
const characterFootOffset = new WeakMap<THREE.Object3D, number>();

export function createEntryExplorationDistrictJumpSelectionInteractionController(
  options: EntryExplorationDistrictJumpSelectionInteractionOptions = {}
): EntryExplorationDistrictJumpSelectionInteractionController {
  return createDistrictJumpSelectionInteractionController({
    onSelectionResult: options.onSelectionResult,
    position: ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpMapPosition,
  });
}

function createDistrictJumpSelectionInteractionController({
  onSelectionResult,
  position,
}: {
  onSelectionResult?: (result: EntryExplorationDistrictSelectionResult) => void;
  position: { x: number; z: number };
}): EntryExplorationDistrictJumpSelectionInteractionController {
  const config = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;
  const projectedDistricts = projectEntryExplorationDistrictBoundaries({
    boundaries: DISTRICT_BOUNDARY_COLLECTION.features,
    mapSize: config.mapSize,
    padding: config.mapPadding,
  });
  const startPoint = config.jumpStartPoint;
  const triggerPoint = {
    x: position.x + startPoint.x,
    z: position.z + startPoint.y,
  };
  const root = new THREE.Group();
  const mapLiftGroup = new THREE.Group();
  const mapParts = createDistrictReliefMap(projectedDistricts);
  const controlGroup = createChargeControlGroup();
  const jumpShadowMesh = createJumpShadowMesh();
  let characterModel: THREE.Object3D | null = null;
  let active = false;
  let activatedAt = 0;
  let chargeState: ChargeState | null = null;
  let bounceFlightState: BounceFlightState | null = null;
  let selectedDistrict: EntryExplorationProjectedDistrict | null = null;
  let cameraTransition: SceneCameraTransition | null = null;
  let cameraTransitionStartedAt: number | null = null;
  let isCharacterInTrigger = false;
  let waitsForTriggerExit = false;

  root.position.set(position.x, 0, position.z);
  mapLiftGroup.add(mapParts.group);
  root.add(mapLiftGroup);
  root.add(controlGroup);

  root.add(jumpShadowMesh);
  updateJumpShadow(
    jumpShadowMesh,
    config.jumpStartPoint,
    getMapSurfaceWorldHeight(mapLiftGroup),
    0
  );

  const activate = (time: number): void => {
    if (active) {
      return;
    }

    active = true;
    waitsForTriggerExit = false;
    activatedAt = time;
    cameraTransition = null;
    cameraTransitionStartedAt = time;
    updateMainCharacterPosition(characterModel, root, startPoint, 0);
    rotateCharacterTowardMap(characterModel, startPoint);
  };

  const clearSelection = (): void => {
    selectedDistrict = null;
    highlightDistrict(mapParts.districtMeshes, null);
  };

  const startCharging = (point: EntryExplorationDistrictSelectionPoint, time: number): void => {
    chargeState = {
      aimPoint: point,
      startedAt: time,
    };
    bounceFlightState = null;
    clearSelection();
    updateChargeControl(controlGroup, 0, point);
  };

  const finishCharging = (time: number): void => {
    if (!chargeState) {
      return;
    }

    const direction = normalizeEntryExplorationSelectionDirection({
      x: chargeState.aimPoint.x - startPoint.x,
      y: chargeState.aimPoint.y - startPoint.y,
    });
    const chargeRatio = calculateEntryExplorationSelectionPowerRatio(
      time - chargeState.startedAt,
      config.chargeMaxDurationMs
    );
    const landingPoint = calculateEntryExplorationSelectionLandingPoint({
      chargeDurationMs: time - chargeState.startedAt,
      chargeMaxDurationMs: config.chargeMaxDurationMs,
      direction,
      maxDistance: config.maxThrowDistance,
      minDistance: config.minThrowDistance,
      startPoint,
    });
    const clampedLandingPoint = clampMapPoint(landingPoint);
    const nextSelectedDistrict = findEntryExplorationDistrictByPoint(
      clampedLandingPoint,
      projectedDistricts
    );

    chargeState = null;
    selectedDistrict = nextSelectedDistrict;
    updateChargeControl(controlGroup, 0, clampedLandingPoint);

    bounceFlightState = {
      chargeRatio,
      from: startPoint,
      selectedDistrict: nextSelectedDistrict,
      startedAt: time,
      to: clampedLandingPoint,
    };
  };

  const handlePointerDown = (raycaster: THREE.Raycaster, time: number): boolean => {
    if (!active) {
      return false;
    }

    const hitPoint = getMapHitPoint(raycaster, mapParts.interactionPlane);

    if (!hitPoint) {
      return false;
    }

    startCharging(hitPoint, time);

    return true;
  };

  const handlePointerMove = (raycaster: THREE.Raycaster): boolean => {
    if (!active || !chargeState) {
      return false;
    }

    const hitPoint = getMapHitPoint(raycaster, mapParts.interactionPlane);

    if (!hitPoint) {
      return true;
    }

    chargeState.aimPoint = hitPoint;
    updateChargeControl(
      controlGroup,
      calculateEntryExplorationSelectionPowerRatio(
        performance.now() - chargeState.startedAt,
        config.chargeMaxDurationMs
      ),
      hitPoint
    );

    return true;
  };

  const handlePointerUp = (_raycaster: THREE.Raycaster, time: number): boolean => {
    if (!active || !chargeState) {
      return false;
    }

    finishCharging(time);

    return true;
  };

  const emitSelectionResult = (district: EntryExplorationProjectedDistrict | null): void => {
    onSelectionResult?.({
      districtId: district?.districtId ?? null,
      districtName: district?.name ?? null,
    });
  };

  const resetSelectionInteraction = (): void => {
    chargeState = null;
    bounceFlightState = null;
    clearSelection();
    updateChargeControl(controlGroup, 0, startPoint);
    updateCharacterBouncePose(characterModel, { xz: 1, y: 1 });
    updateMainCharacterPosition(characterModel, root, startPoint, 0);
    rotateCharacterTowardMap(characterModel, startPoint);
    updateJumpShadow(jumpShadowMesh, startPoint, getMapSurfaceWorldHeight(mapLiftGroup), 0);
  };

  const deactivate = (): void => {
    active = false;
    waitsForTriggerExit = true;
    cameraTransition = null;
    cameraTransitionStartedAt = null;
    mapLiftGroup.position.y = 0;
    resetSelectionInteraction();
  };

  const isCharacterInsideTrigger = (characterPosition: EntryExplorationScenePoint): boolean =>
    isInsideSceneTriggerRadius({
      position: characterPosition,
      radius: config.triggerRadius,
      triggerPoint,
    });

  const updateTriggerState = (characterPosition: EntryExplorationScenePoint): void => {
    isCharacterInTrigger = isCharacterInsideTrigger(characterPosition);

    if (!isCharacterInTrigger) {
      waitsForTriggerExit = false;
    }
  };

  return {
    activate,
    canActivate: () => !active && isCharacterInTrigger && !waitsForTriggerExit,
    deactivate,
    dispose: () => {
      disposeDistrictJumpSelectionInteractionObject(root);
    },
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isActive: () => active,
    object: root,
    priority: 100,
    retrySelection: resetSelectionInteraction,
    setCharacter: (character) => {
      characterModel = character;
    },
    update: (time) => {
      if (active) {
        const activationProgress = easeOutCubic(
          Math.min((time - activatedAt) / config.activationDurationMs, 1)
        );

        mapLiftGroup.position.y = activationProgress * config.mapRiseHeight;
      }

      if (chargeState) {
        const chargeRatio = calculateEntryExplorationSelectionPowerRatio(
          time - chargeState.startedAt,
          config.chargeMaxDurationMs
        );

        updateChargeControl(controlGroup, chargeRatio, chargeState.aimPoint);
      }

      if (bounceFlightState) {
        const progress = Math.min(
          (time - bounceFlightState.startedAt) / config.bounceDurationMs,
          1
        );
        const nextPoint = interpolatePoint(
          bounceFlightState.from,
          bounceFlightState.to,
          easeOutCubic(progress)
        );
        const jumpHeight =
          calculateEntryExplorationBounceHeight({
            bounceCount: config.bounceCount,
            maxHeight: config.bounceMaxHeight,
            progress,
          }) *
          (SCENE_PRESET.jump.heightChargeScale.base +
            bounceFlightState.chargeRatio * SCENE_PRESET.jump.heightChargeScale.multiplier);
        const squashScale = calculateEntryExplorationBounceSquashScale({
          bounceCount: config.bounceCount,
          intensity: SCENE_PRESET.jump.squashIntensity,
          progress,
        });
        const contactRatio = calculateEntryExplorationBounceContactRatio({
          bounceCount: config.bounceCount,
          progress,
        });
        const mapSurfaceHeight = getMapSurfaceWorldHeight(mapLiftGroup);

        updateMainCharacterPosition(
          characterModel,
          root,
          nextPoint,
          mapSurfaceHeight + jumpHeight + SCENE_PRESET.jump.characterSurfaceClearance,
          true
        );
        updateCharacterBouncePose(characterModel, squashScale);
        if (jumpShadowMesh) {
          updateJumpShadow(jumpShadowMesh, nextPoint, mapSurfaceHeight, jumpHeight, contactRatio);
        }

        if (progress >= 1) {
          const completedDistrict = bounceFlightState.selectedDistrict;

          highlightDistrict(mapParts.districtMeshes, completedDistrict);
          emitSelectionResult(completedDistrict);
          updateCharacterBouncePose(characterModel, { xz: 1, y: 1 });
          bounceFlightState = null;
        }
      }

      if (!selectedDistrict && !bounceFlightState) {
        highlightDistrict(mapParts.districtMeshes, null);
      }
    },
    updateCamera: (camera, time) => {
      if (!active || cameraTransitionStartedAt === null) {
        return;
      }

      const cameraTarget = createEntryExplorationDistrictSelectionCameraTarget(
        root.position,
        ENTRY_EXPLORATION_DISTRICT_SELECTION_CAMERA_PRESET
      );

      cameraTransition ??= createSceneCameraTransition({
        camera,
        durationMs: cameraTarget.durationMs,
        now: cameraTransitionStartedAt,
        toLookAt: cameraTarget.toLookAt,
        toPosition: cameraTarget.toPosition,
        toZoom: cameraTarget.toZoom,
      });

      const result = updateSceneCameraTransition(cameraTransition, time);

      if (result.done) {
        cameraTransitionStartedAt = null;
      }
    },
    updateTriggerState,
  };
}

function createDistrictReliefMap(
  districts: readonly EntryExplorationProjectedDistrict[]
): DistrictMapParts {
  const config = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;
  const group = new THREE.Group();
  const districtMeshes: THREE.Mesh[] = [];
  const interactionPlane = createMapInteractionPlane();

  group.add(interactionPlane);

  districts.forEach((district) => {
    const districtGroup = createDistrictMeshGroup(district);

    districtGroup.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData["districtId"] === district.districtId) {
        districtMeshes.push(object);
      }
    });
    group.add(districtGroup);
  });

  group.position.y = SCENE_PRESET.map.surfaceOffset;
  interactionPlane.position.y = config.mapThickness + SCENE_PRESET.map.interactionPlaneOffset;

  return {
    districtMeshes,
    group,
    interactionPlane,
  };
}

function createMapInteractionPlane(): THREE.Mesh {
  const { mapSize } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;
  const geometry = new THREE.PlaneGeometry(mapSize.width, mapSize.depth);
  const material = new THREE.MeshBasicMaterial({
    depthWrite: false,
    opacity: 0,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

function createDistrictMeshGroup(district: EntryExplorationProjectedDistrict): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: SCENE_PRESET.map.topMaterial.color,
    emissive: SCENE_PRESET.map.topMaterial.emissive,
    metalness: SCENE_PRESET.map.topMaterial.metalness,
    roughness: SCENE_PRESET.map.topMaterial.roughness,
    vertexColors: true,
  });
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: SCENE_PRESET.map.sideColor,
    metalness: SCENE_PRESET.map.sideMaterial.metalness,
    roughness: SCENE_PRESET.map.sideMaterial.roughness,
  });

  district.polygons.forEach((polygon) => {
    const shape = createShapeFromPolygon(polygon);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      bevelEnabled: true,
      bevelSegments: SCENE_PRESET.map.extrude.bevelSegments,
      bevelSize: SCENE_PRESET.map.extrude.bevelSize,
      bevelThickness: SCENE_PRESET.map.extrude.bevelThickness,
      depth: ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.mapThickness,
    });
    const mesh = new THREE.Mesh(geometry, [material.clone(), sideMaterial.clone()]);

    geometry.rotateX(-Math.PI / 2);
    applyDistrictGradientVertexColors(geometry);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData["districtId"] = district.districtId;
    mesh.userData["districtName"] = district.name;
    group.add(mesh);
  });

  getEntryExplorationProjectedDistrictRings(district).forEach((ring) => {
    const line = createDistrictBoundaryLine(ring);

    group.add(line);
  });

  return group;
}

function createShapeFromPolygon({
  rings,
}: {
  rings: readonly (readonly EntryExplorationDistrictSelectionPoint[])[];
}): THREE.Shape {
  const [outerRing, ...holeRings] = rings;
  const shape = createShapePath(outerRing ?? []);

  shape.holes = holeRings.map(createShapePath);

  return shape;
}

function createShapePath(ring: readonly EntryExplorationDistrictSelectionPoint[]): THREE.Shape {
  const shape = new THREE.Shape();
  const [firstPoint, ...points] = ring;

  if (!firstPoint) {
    return shape;
  }

  shape.moveTo(firstPoint.x, -firstPoint.y);
  points.forEach((point) => {
    shape.lineTo(point.x, -point.y);
  });
  shape.closePath();

  return shape;
}

function createDistrictBoundaryLine(
  ring: readonly EntryExplorationDistrictSelectionPoint[]
): THREE.LineLoop {
  const { mapThickness } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;
  const geometry = new THREE.BufferGeometry().setFromPoints(
    ring.map(
      (point) =>
        new THREE.Vector3(
          point.x,
          mapThickness + SCENE_PRESET.map.boundaryLineHeightOffset,
          point.y
        )
    )
  );
  const material = new THREE.LineBasicMaterial({
    color: SCENE_PRESET.map.lineColor,
    transparent: true,
    opacity: SCENE_PRESET.map.lineOpacity,
  });

  return new THREE.LineLoop(geometry, material);
}

function applyDistrictGradientVertexColors(geometry: THREE.BufferGeometry): void {
  const { mapSize } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;
  const positionAttribute = geometry.getAttribute("position");
  const colors: number[] = [];
  const color = new THREE.Color();

  for (let index = 0; index < positionAttribute.count; index += 1) {
    const ratio = calculateEntryExplorationMapGradientRatio({
      mapSize,
      point: {
        x: positionAttribute.getX(index),
        y: positionAttribute.getZ(index),
      },
    });

    if (ratio < SCENE_PRESET.map.gradientMidpoint) {
      color.lerpColors(
        SCENE_PRESET.map.gradientColors.start,
        SCENE_PRESET.map.gradientColors.middle,
        ratio / SCENE_PRESET.map.gradientMidpoint
      );
    } else {
      color.lerpColors(
        SCENE_PRESET.map.gradientColors.middle,
        SCENE_PRESET.map.gradientColors.end,
        (ratio - SCENE_PRESET.map.gradientMidpoint) / SCENE_PRESET.map.gradientMidpoint
      );
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

function createChargeControlGroup(): THREE.Group {
  const group = new THREE.Group();
  const startPoint = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpStartPoint;
  const baseRing = createFlatRingMesh(
    SCENE_PRESET.control.baseRing.innerRadius,
    SCENE_PRESET.control.baseRing.outerRadius,
    SCENE_PRESET.control.baseRing.color,
    SCENE_PRESET.control.baseRing.opacity
  );
  const chargeRing = createFlatRingMesh(
    SCENE_PRESET.control.chargeRing.innerRadius,
    SCENE_PRESET.control.chargeRing.outerRadius,
    SCENE_PRESET.control.accentColor,
    SCENE_PRESET.control.chargeRing.opacity
  );
  const aimLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      pointToSceneVector(startPoint, SCENE_PRESET.control.aimLineInitialHeight),
      pointToSceneVector(startPoint, SCENE_PRESET.control.aimLineInitialHeight),
    ]),
    new THREE.LineBasicMaterial({
      color: SCENE_PRESET.control.secondaryColor,
      linewidth: SCENE_PRESET.control.aimLineWidth,
      transparent: true,
      opacity: SCENE_PRESET.control.aimLineOpacity,
    })
  );

  baseRing.name = "control-base-ring";
  chargeRing.name = "control-charge-ring";
  aimLine.name = "control-aim-line";
  baseRing.position.set(startPoint.x, SCENE_PRESET.control.baseRing.y, startPoint.y);
  chargeRing.position.set(startPoint.x, SCENE_PRESET.control.chargeRing.y, startPoint.y);
  group.add(baseRing);
  group.add(chargeRing);
  group.add(aimLine);
  updateChargeRingGeometry(chargeRing, SCENE_PRESET.control.chargeRing.minimumRatio);

  return group;
}

function createFlatRingMesh(
  innerRadius: number,
  outerRadius: number,
  color: number,
  opacity: number
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    SCENE_PRESET.control.ringSegments
  );
  const material = new THREE.MeshBasicMaterial({
    color,
    depthWrite: false,
    opacity,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

function updateChargeControl(
  controlGroup: THREE.Group,
  ratio: number,
  aimPoint: EntryExplorationDistrictSelectionPoint
): void {
  const startPoint = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG.jumpStartPoint;
  const chargeRing = controlGroup.getObjectByName("control-charge-ring");
  const aimLine = controlGroup.getObjectByName("control-aim-line");

  if (chargeRing instanceof THREE.Mesh) {
    updateChargeRingGeometry(
      chargeRing,
      Math.max(ratio, SCENE_PRESET.control.chargeRing.minimumRatio)
    );
  }

  if (aimLine instanceof THREE.Line) {
    aimLine.geometry.dispose();
    aimLine.geometry = new THREE.BufferGeometry().setFromPoints([
      pointToSceneVector(startPoint, SCENE_PRESET.control.aimLineHeight),
      pointToSceneVector(aimPoint, SCENE_PRESET.control.aimLineHeight),
    ]);
  }
}

function updateChargeRingGeometry(ringMesh: THREE.Mesh, ratio: number): void {
  ringMesh.geometry.dispose();
  ringMesh.geometry = new THREE.RingGeometry(
    SCENE_PRESET.control.chargeRing.innerRadius,
    SCENE_PRESET.control.chargeRing.outerRadius,
    SCENE_PRESET.control.ringSegments,
    1,
    Math.PI / 2,
    Math.PI * 2 * ratio
  );
}

function createJumpShadowMesh(): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(
    SCENE_PRESET.jump.shadow.radius,
    SCENE_PRESET.jump.shadow.segments
  );
  const material = new THREE.MeshBasicMaterial({
    color: SCENE_PRESET.jump.shadow.baseColor,
    depthWrite: false,
    opacity: SCENE_PRESET.jump.shadow.defaultOpacity,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

function updateJumpShadow(
  shadowMesh: THREE.Mesh,
  point: EntryExplorationDistrictSelectionPoint,
  mapSurfaceHeight: number,
  jumpHeight: number,
  contactRatio = 0
): void {
  const shadowScale =
    Math.max(
      SCENE_PRESET.jump.shadow.minScale,
      1 - jumpHeight * SCENE_PRESET.jump.shadow.heightScaleFactor
    ) +
    contactRatio * SCENE_PRESET.jump.shadow.contactScaleBonus;
  const shadowMaterial = shadowMesh.material;

  shadowMesh.position.copy(
    pointToSceneVector(point, mapSurfaceHeight + SCENE_PRESET.jump.shadow.surfaceOffset)
  );
  shadowMesh.scale.set(shadowScale, shadowScale, 1);

  if (shadowMaterial instanceof THREE.MeshBasicMaterial) {
    shadowMaterial.opacity =
      SCENE_PRESET.jump.shadow.baseOpacity +
      contactRatio * SCENE_PRESET.jump.shadow.contactOpacityBonus;
    shadowMaterial.color.setHex(
      contactRatio > 0 ? SCENE_PRESET.jump.shadow.contactColor : SCENE_PRESET.jump.shadow.baseColor
    );
  }
}

function updateMainCharacterPosition(
  characterModel: THREE.Object3D | null,
  root: THREE.Group,
  point: EntryExplorationDistrictSelectionPoint,
  height: number,
  alignFeetToSurface = false
): void {
  if (!characterModel) {
    return;
  }

  const footOffset = alignFeetToSurface ? getCharacterFootOffset(characterModel) : 0;

  characterModel.position.set(
    root.position.x + point.x,
    height + footOffset,
    root.position.z + point.y
  );
}

function getCharacterFootOffset(characterModel: THREE.Object3D): number {
  const cachedOffset = characterFootOffset.get(characterModel);

  if (cachedOffset !== undefined) {
    return cachedOffset;
  }

  const box = new THREE.Box3().setFromObject(characterModel);
  const origin = characterModel.getWorldPosition(new THREE.Vector3());
  const offset = Number.isFinite(box.min.y) ? Math.max(0, origin.y - box.min.y) : 0;

  characterFootOffset.set(characterModel, offset);

  return offset;
}

function updateCharacterBouncePose(
  characterModel: THREE.Object3D | null,
  squashScale: { xz: number; y: number }
): void {
  if (!characterModel) {
    return;
  }

  const baseScale = characterBaseScale.get(characterModel) ?? characterModel.scale.clone();

  if (!characterBaseScale.has(characterModel)) {
    characterBaseScale.set(characterModel, baseScale);
  }

  characterModel.scale.set(
    baseScale.x * squashScale.xz,
    baseScale.y * squashScale.y,
    baseScale.z * squashScale.xz
  );
}

function getMapSurfaceWorldHeight(mapLiftGroup: THREE.Group): number {
  const { mapThickness } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;

  return (
    mapLiftGroup.position.y +
    SCENE_PRESET.map.surfaceOffset +
    mapThickness +
    SCENE_PRESET.map.surfaceHeightOffset
  );
}

function rotateCharacterTowardMap(
  characterModel: THREE.Object3D | null,
  from: EntryExplorationDistrictSelectionPoint
): void {
  if (!characterModel) {
    return;
  }

  const headingRadians = Math.atan2(0 - from.x, 0 - from.y);

  characterModel.rotation.y = toCharacterModelRotationRadians(headingRadians);
}

function getMapHitPoint(
  raycaster: THREE.Raycaster,
  interactionPlane: THREE.Mesh
): EntryExplorationDistrictSelectionPoint | null {
  const hit = raycaster.intersectObject(interactionPlane, false)[0];

  if (!hit) {
    return null;
  }

  const localPoint = interactionPlane.worldToLocal(hit.point.clone());

  return clampMapPoint({
    x: localPoint.x,
    y: -localPoint.y,
  });
}

function pointToSceneVector(
  point: EntryExplorationDistrictSelectionPoint,
  y: number
): THREE.Vector3 {
  return new THREE.Vector3(point.x, y, point.y);
}

function clampMapPoint(
  point: EntryExplorationDistrictSelectionPoint
): EntryExplorationDistrictSelectionPoint {
  const { mapSize } = ENTRY_EXPLORATION_DISTRICT_SELECTION_EVENT_CONFIG;

  return {
    x: Math.min(Math.max(point.x, -mapSize.width / 2), mapSize.width / 2),
    y: Math.min(Math.max(point.y, -mapSize.depth / 2), mapSize.depth / 2),
  };
}

function interpolatePoint(
  from: EntryExplorationDistrictSelectionPoint,
  to: EntryExplorationDistrictSelectionPoint,
  progress: number
): EntryExplorationDistrictSelectionPoint {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function highlightDistrict(
  districtMeshes: readonly THREE.Mesh[],
  selectedDistrict: EntryExplorationProjectedDistrict | null
): void {
  districtMeshes.forEach((mesh) => {
    const material = mesh.material;
    const isSelected = mesh.userData["districtId"] === selectedDistrict?.districtId;

    if (!Array.isArray(material)) {
      return;
    }

    const topMaterial = material[0];
    if (!(topMaterial instanceof THREE.MeshStandardMaterial)) {
      return;
    }

    topMaterial.color.setHex(
      isSelected ? SCENE_PRESET.map.selectedColor : SCENE_PRESET.map.topMaterial.color
    );
    topMaterial.emissive.setHex(
      isSelected ? SCENE_PRESET.map.selectedEmissiveColor : SCENE_PRESET.map.topMaterial.emissive
    );
    topMaterial.vertexColors = !isSelected;
    topMaterial.needsUpdate = true;
  });
}

function disposeDistrictJumpSelectionInteractionObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.Line)) {
      return;
    }

    child.geometry.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        material.dispose();
      });
      return;
    }

    child.material.dispose();
  });
}
