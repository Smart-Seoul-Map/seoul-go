import type { LoadPlaceModelOptions, PlaceModelResult } from "./application/loadPlaceModel";
import type { SmartSeoulThemePlace } from "./domain/place";

// Keep Three.js out of consumers that only use the places API or detail UI.
export async function loadPlaceModel(
  place: Pick<SmartSeoulThemePlace, "id" | "imageUrl">,
  options?: LoadPlaceModelOptions
): Promise<PlaceModelResult> {
  const models = await import("./application/loadPlaceModel");

  return models.loadPlaceModel(place, options);
}

export type { PlaceModelResult } from "./application/loadPlaceModel";
export type { PlaceModelAsset, PlaceModelAssets } from "./domain/placeModelAsset";
