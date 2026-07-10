import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { getSmartSeoulPlaceTheme } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "../domain/place";

export function createPlacesFeatureCollection(
  places: SmartSeoulThemePlace[]
): MapMarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map<MapMarkerFeature>((place) => ({
      type: "Feature",
      id: place.id,
      geometry: {
        type: "Point",
        coordinates: [place.position.lng, place.position.lat],
      },
      properties: {
        id: place.id,
        name: place.name,
        themeId: place.themeId,
        themeName: place.themeName,
        markerColor: getSmartSeoulPlaceTheme(place.themeId)?.markerColor ?? "#17201a",
      },
    })),
  };
}
