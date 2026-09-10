import * as THREE from "three";

import { ENTRY_EXPLORATION_GUIDE_CONFIG as CONFIG } from "../config/entryExplorationGuideConfig";
import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import { createEntryExplorationGuideRoute } from "../domain/entryExplorationGuideRoute";
import type { EntryExplorationScenePoint } from "../domain/entryExplorationSceneMath";

type GuideArrowOptions = {
  origin: EntryExplorationScenePoint;
  destination: EntryExplorationScenePoint;
  color: string;
};

export function createEntryExplorationGuideArrow({
  origin,
  destination,
  color,
}: GuideArrowOptions) {
  const route = createEntryExplorationGuideRoute({
    origin,
    destination,
    cameraOffset: ENTRY_EXPLORATION_SCENE_CONFIG.cameraOffset,
  });
  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(new THREE.LineCurve3(toFloorPoint(route.start), toFloorPoint(route.bendStart)));
  path.add(
    new THREE.QuadraticBezierCurve3(
      toFloorPoint(route.bendStart),
      toFloorPoint(route.bendControl),
      toFloorPoint(route.bendEnd)
    )
  );
  path.add(new THREE.LineCurve3(toFloorPoint(route.bendEnd), toFloorPoint(route.destination)));
  const pathLength = path.getLength();
  const pitch = CONFIG.dashLength + CONFIG.dashGap;
  const dashCount = Math.max(
    0,
    Math.floor((pathLength - CONFIG.headLength - CONFIG.headGap + CONFIG.dashGap) / pitch)
  );
  const material = new THREE.MeshBasicMaterial({
    color,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const dashGeometry = createDashGeometry();
  const dashes = new THREE.InstancedMesh(dashGeometry, material, dashCount);
  dashes.name = "entry-guide-dashes";
  for (let index = 0; index < dashCount; index += 1) {
    const progress = (index * pitch + CONFIG.dashLength / 2) / pathLength;
    const tangent = path.getTangentAt(progress);
    const matrix = new THREE.Matrix4().makeRotationY(-Math.atan2(tangent.z, tangent.x));
    matrix.setPosition(path.getPointAt(progress));
    dashes.setMatrixAt(index, matrix);
  }
  dashes.instanceMatrix.needsUpdate = true;
  dashes.computeBoundingSphere();
  dashes.count = 0;

  const headGeometry = createHeadGeometry();
  const head = new THREE.Mesh(headGeometry, material);
  head.name = "entry-guide-head";
  head.position.copy(toFloorPoint(route.destination));
  const endTangent = path.getTangentAt(1);
  head.rotation.y = -Math.atan2(endTangent.z, endTangent.x);
  head.visible = false;
  const object = new THREE.Group();
  object.name = "entry-guide-arrow";
  object.add(dashes, head);
  object.visible = false;
  let startedAt: number | null = null;
  let reducedMotion = false;

  const update = (time: number): void => {
    if (startedAt === null) return;
    const progress = reducedMotion
      ? 1
      : THREE.MathUtils.clamp((time - startedAt) / CONFIG.drawDurationMs, 0, 1);
    dashes.count = Math.min(dashCount, Math.floor(progress * (dashCount + 1)));
    head.visible = progress === 1;
  };

  return {
    object,
    destination: route.destination,
    start(time: number, prefersReducedMotion = false) {
      if (startedAt !== null) return;
      startedAt = time;
      reducedMotion = prefersReducedMotion;
      object.visible = true;
      update(time);
    },
    update,
    dispose() {
      object.visible = false;
      dashes.dispose();
      dashGeometry.dispose();
      headGeometry.dispose();
      material.dispose();
    },
  };
}

function toFloorPoint(point: EntryExplorationScenePoint): THREE.Vector3 {
  return new THREE.Vector3(point.x, CONFIG.surfaceHeight, point.z);
}

function createDashGeometry(): THREE.ShapeGeometry {
  const radius = CONFIG.dashWidth / 2;
  const center = CONFIG.dashLength / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-center, radius);
  shape.lineTo(center, radius);
  shape.absarc(center, 0, radius, Math.PI / 2, -Math.PI / 2, true);
  shape.lineTo(-center, -radius);
  shape.absarc(-center, 0, radius, -Math.PI / 2, Math.PI / 2, true);
  shape.closePath();

  return new THREE.ShapeGeometry(shape, 8).rotateX(-Math.PI / 2);
}

function createHeadGeometry(): THREE.ShapeGeometry {
  const length = CONFIG.headLength;
  const halfWidth = CONFIG.headWidth / 2;
  const radius = halfWidth * 0.25;
  const shape = new THREE.Shape();
  shape.moveTo(-length, -halfWidth + radius);
  shape.quadraticCurveTo(-length, -halfWidth, -length + radius, -halfWidth + radius / 2);
  shape.lineTo(-radius, -radius / 2);
  shape.quadraticCurveTo(0, 0, -radius, radius / 2);
  shape.lineTo(-length + radius, halfWidth - radius / 2);
  shape.quadraticCurveTo(-length, halfWidth, -length, halfWidth - radius);
  shape.closePath();

  return new THREE.ShapeGeometry(shape, 8).rotateX(-Math.PI / 2);
}
