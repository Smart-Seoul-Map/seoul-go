import * as THREE from "three";

import { easeOutCubic } from "../animation/easing";

type SceneTransitionCamera = THREE.OrthographicCamera | THREE.PerspectiveCamera;

export type SceneCameraTransition = {
  camera: SceneTransitionCamera;
  durationMs: number;
  easing: (progress: number) => number;
  fromLookAt: THREE.Vector3;
  fromPosition: THREE.Vector3;
  fromZoom: number;
  startedAt: number;
  toLookAt: THREE.Vector3;
  toPosition: THREE.Vector3;
  toZoom: number;
};

export type CreateSceneCameraTransitionInput = {
  camera: SceneTransitionCamera;
  durationMs: number;
  easing?: (progress: number) => number;
  fromLookAt?: THREE.Vector3;
  now: number;
  toLookAt: THREE.Vector3;
  toPosition: THREE.Vector3;
  toZoom: number;
};

export type UpdateSceneCameraTransitionResult = {
  done: boolean;
};

export function createSceneCameraTransition({
  camera,
  durationMs,
  easing = easeOutCubic,
  fromLookAt,
  now,
  toLookAt,
  toPosition,
  toZoom,
}: CreateSceneCameraTransitionInput): SceneCameraTransition {
  return {
    camera,
    durationMs,
    easing,
    fromLookAt: fromLookAt?.clone() ?? inferCurrentLookAt(camera, toLookAt),
    fromPosition: camera.position.clone(),
    fromZoom: camera.zoom,
    startedAt: now,
    toLookAt: toLookAt.clone(),
    toPosition: toPosition.clone(),
    toZoom,
  };
}

export function updateSceneCameraTransition(
  transition: SceneCameraTransition,
  now: number
): UpdateSceneCameraTransitionResult {
  const rawProgress =
    transition.durationMs <= 0 ? 1 : (now - transition.startedAt) / transition.durationMs;
  const progress = Math.min(Math.max(rawProgress, 0), 1);
  const easedProgress = transition.easing(progress);
  const lookAt = transition.fromLookAt.clone().lerp(transition.toLookAt, easedProgress);

  transition.camera.position.copy(
    transition.fromPosition.clone().lerp(transition.toPosition, easedProgress)
  );
  transition.camera.zoom =
    transition.fromZoom + (transition.toZoom - transition.fromZoom) * easedProgress;
  transition.camera.lookAt(lookAt);
  transition.camera.updateProjectionMatrix();
  transition.camera.updateMatrixWorld();

  return {
    done: progress >= 1,
  };
}

function inferCurrentLookAt(
  camera: SceneTransitionCamera,
  fallbackLookAt: THREE.Vector3
): THREE.Vector3 {
  const direction = camera.getWorldDirection(new THREE.Vector3());
  const distanceToFallback = camera.position.distanceTo(fallbackLookAt);
  const lookAtDistance = distanceToFallback > 0 ? distanceToFallback : 1;

  return camera.position.clone().add(direction.multiplyScalar(lookAtDistance));
}
