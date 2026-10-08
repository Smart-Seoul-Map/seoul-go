import type {
  MapMarkerFeature,
  MapMarkerFeatureCollection,
} from "@shared/lib/maplibre/mapMarkerFeature";

import { getSmartSeoulPlaceTheme, type SmartSeoulPlaceTheme } from "../config/placeThemeConfig";
import type { SmartSeoulThemePlace } from "../domain/place";

function getPlaceMarkerModelUrl(theme: SmartSeoulPlaceTheme | undefined): string | undefined {
  return theme && "markerModelUrl" in theme ? theme.markerModelUrl : undefined;
}

function getPlaceMarkerModelYawDegrees(
  theme: SmartSeoulPlaceTheme | undefined
): number | undefined {
  return theme && "markerModelYawDegrees" in theme ? theme.markerModelYawDegrees : undefined;
}

export function createPlacesFeatureCollection(
  places: readonly SmartSeoulThemePlace[]
): MapMarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map<MapMarkerFeature>((place) => {
      const theme = getSmartSeoulPlaceTheme(place.themeId);
      const closedMarkerImage = theme?.closedBoxImage ?? "black_closed_box";
      const openMarkerImage = theme?.openBoxImage ?? "black_open_box";
      const markerModelUrl = getPlaceMarkerModelUrl(theme);
      const markerModelYawDegrees = getPlaceMarkerModelYawDegrees(theme);

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
          description: place.description,
          selectionYear: place.selectionYear,
          name: place.name,
          themeId: place.themeId,
          themeName: place.themeName,
          markerColor: theme?.markerColor ?? "#17201a",
          closedMarkerImage,
          markerImage: closedMarkerImage,
          openMarkerImage,
          ...(markerModelUrl ? { markerModelUrl } : {}),
          ...(markerModelYawDegrees === undefined ? {} : { markerModelYawDegrees }),
        },
      };
    }),
  };
}
