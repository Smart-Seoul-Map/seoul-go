import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const gltfLoader = new GLTFLoader();
const gltfCache = new Map<string, Promise<GLTF>>();

export function loadCharacterGltf(path: string): Promise<GLTF> {
  const cachedGltf = gltfCache.get(path);

  if (cachedGltf) {
    return cachedGltf;
  }

  const gltf = new Promise<GLTF>((resolve, reject) => {
    gltfLoader.load(path, resolve, undefined, reject);
  }).catch((error: unknown) => {
    if (gltfCache.get(path) === gltf) gltfCache.delete(path);
    throw error;
  });

  gltfCache.set(path, gltf);

  return gltf;
}

export function clearCharacterGltfCache(): void {
  gltfCache.clear();
}
