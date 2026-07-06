import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  CHARACTER_MODEL_MANIFEST,
  type CharacterModelKey,
} from "../config/explorationCharacterModels";

interface CharacterModelOverlayProps {
  modelKey: CharacterModelKey;
}

export function CharacterModelOverlay({ modelKey }: CharacterModelOverlayProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D | null = null;
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

    const loader = new GLTFLoader();
    // 1단계: 기본 메쉬 로드
    loader.load(CHARACTER_MODEL_MANIFEST.mesh, (gltf) => {
      if (disposed) return;

      model = gltf.scene;

      // 자동 크기 조절 로직
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(0.86 / maxAxis);
      model.position.set(0, -0.2, 0); // 모델 중심 조정

      scene.add(model);
      mixer = new THREE.AnimationMixer(model);

      // 2단계: 해당 상태의 애니메이션 로드
      const animPath = CHARACTER_MODEL_MANIFEST.animations[modelKey];
      loader.load(animPath, (animGltf) => {
        if (disposed) return;
        animGltf.animations.forEach((clip) => {
          mixer?.clipAction(clip).play();
        });
      });
    });
    const render = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;
      mixer?.update(deltaSeconds);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      model?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelKey]);

  return <div ref={containerRef} aria-hidden="true" className="character-overlay" />;
}
