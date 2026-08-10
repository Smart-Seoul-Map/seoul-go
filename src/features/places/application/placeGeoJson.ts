import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { getSmartSeoulPlaceTheme } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "../domain/place";

export function createPlacesFeatureCollection(
  places: readonly SmartSeoulThemePlace[]
): MapMarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map<MapMarkerFeature>((place) => {
      const theme = getSmartSeoulPlaceTheme(place.themeId);
      const closedMarkerImage = theme?.closedBoxImage ?? "black_closed_box";
      const openMarkerImage = theme?.openBoxImage ?? "black_open_box";

      return {
        type: "Feature",
        id: place.id,
        geometry: {
          type: "Point",
          coordinates: [place.position.lng, place.position.lat],
        },
        properties: {
          id: place.id,
          imageUrl: place.imageUrl,
          name: place.name,
          themeId: place.themeId,
          themeName: place.themeName,
          markerColor: theme?.markerColor ?? "#17201a",
          closedMarkerImage,
          markerImage: closedMarkerImage,
          openMarkerImage,
        },
      };
    }),
  };
}
