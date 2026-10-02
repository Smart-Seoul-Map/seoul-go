import { loadGltf } from "@shared/lib/three/gltfLoader";
import { createModelInstance, type ModelInstance } from "@shared/lib/three/modelInstance";

import { PLACE_MODEL_ASSETS } from "../config/placeModelAssets";
import type { SmartSeoulThemePlace } from "../domain/place";
import type { PlaceModelAssets } from "../domain/placeModelAsset";

export type PlaceModelResult =
  | { type: "model"; placeId: string; instance: ModelInstance }
  | { type: "image"; placeId: string; imageUrl: string; reason: "unmapped" }
  | { type: "image"; placeId: string; imageUrl: string; reason: "load-failed"; error: unknown }
  | { type: "cancelled"; placeId: string };

export type LoadPlaceModelOptions = {
  assets?: PlaceModelAssets;
  signal?: AbortSignal;
};

export async function loadPlaceModel(
  place: Pick<SmartSeoulThemePlace, "id" | "imageUrl">,
  { assets = PLACE_MODEL_ASSETS, signal }: LoadPlaceModelOptions = {}
): Promise<PlaceModelResult> {
  const cancelled = { type: "cancelled", placeId: place.id } as const;
  if (signal?.aborted) return cancelled;
  const asset = Object.hasOwn(assets, place.id) ? assets[place.id] : undefined;
  const image = { type: "image", placeId: place.id, imageUrl: place.imageUrl } as const;
  if (!asset) return { ...image, reason: "unmapped" };

  try {
    const gltf = await loadGltf(asset.url);
    // A departing consumer must not cancel a shared download used by another scene.
    if (signal?.aborted) return cancelled;
    const instance = createModelInstance(gltf.scene, asset);

    return { type: "model", placeId: place.id, instance };
  } catch (error) {
    if (signal?.aborted) return cancelled;

    return { ...image, reason: "load-failed", error };
  }
}
