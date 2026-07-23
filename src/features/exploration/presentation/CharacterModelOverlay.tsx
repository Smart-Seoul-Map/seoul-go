import { useCallback, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import * as THREE from "three";

import {
  playCharacterAnimationClips,
  stopCharacterAnimationActions,
} from "@shared/lib/character/characterAnimationPlayer";
import { toCharacterModelRotationRadians } from "@shared/lib/character/characterModelRotation";
import { loadCharacterGltf } from "@shared/lib/character/gltfLoader";

import {
  CHARACTER_ANIMATION_TIME_SCALE,
  CHARACTER_MODEL_MANIFEST,
  type CharacterModelKey,
} from "../config/explorationCharacterModels";

interface CharacterModelOverlayProps {
  headingRadians: number;
  modelKey: CharacterModelKey;
}

export function CharacterModelOverlay({
  headingRadians,
  modelKey,
}: CharacterModelOverlayProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const activeActionsRef = useRef<THREE.AnimationAction[]>([]);
  const headingRadiansRef = useRef(headingRadians);
  const currentModelKeyRef = useRef(modelKey);

  const playAnimation = useCallback(async (nextModelKey: CharacterModelKey) => {
    const mixer = mixerRef.current;

    if (!mixer) {
      return;
    }

    const animationPath = CHARACTER_MODEL_MANIFEST.animations[nextModelKey];
    const animationGltf = await loadCharacterGltf(animationPath);

    if (mixerRef.current !== mixer || currentModelKeyRef.current !== nextModelKey) {
      return;
    }

    stopCharacterAnimationActions(activeActionsRef.current);
    activeActionsRef.current = playCharacterAnimationClips(
      mixer,
      animationGltf.animations,
      CHARACTER_ANIMATION_TIME_SCALE[nextModelKey]
    );
  }, []);

  useEffect(() => {
    currentModelKeyRef.current = modelKey;
    void playAnimation(modelKey);
  }, [modelKey, playAnimation]);

  useEffect(() => {
    headingRadiansRef.current = headingRadians;

    if (modelRef.current) {
      modelRef.current.rotation.y = toCharacterModelRotationRadians(headingRadians);
    }
  }, [headingRadians]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof WebGLRenderingContext === "undefined") {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.2, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.append(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    let frameId = 0;
    let lastTime = performance.now();
    let disposed = false;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    void loadCharacterGltf(CHARACTER_MODEL_MANIFEST.mesh).then((gltf) => {
      if (disposed) return;

      const model = gltf.scene;

      model.scale.setScalar(1);
      model.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(0.86 / maxAxis);
      model.position.set(0, -0.2, 0);
      model.rotation.y = toCharacterModelRotationRadians(headingRadiansRef.current);

      modelRef.current = model;
      scene.add(model);
      mixerRef.current = new THREE.AnimationMixer(model);
      void playAnimation(currentModelKeyRef.current);
    });

    const render = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;
      mixerRef.current?.update(deltaSeconds);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      mixerRef.current = null;
      modelRef.current = null;
      activeActionsRef.current = [];
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [playAnimation]);

  return <div ref={containerRef} aria-hidden="true" className="character-overlay" />;
}
