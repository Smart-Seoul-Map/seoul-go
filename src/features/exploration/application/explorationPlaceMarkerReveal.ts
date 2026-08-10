import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";

type CreateRevealedPlaceMarkersParams = {
  placeMarkers: MapMarkerFeatureCollection;
  revealedPlaceIds: ReadonlySet<string>;
};

export function createRevealedPlaceMarkers({
  placeMarkers,
  revealedPlaceIds,
}: CreateRevealedPlaceMarkersParams): MapMarkerFeatureCollection {
  return {
    ...placeMarkers,
    features: placeMarkers.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        markerImage: revealedPlaceIds.has(feature.properties.id)
          ? feature.properties.openMarkerImage
          : feature.properties.closedMarkerImage,
      },
    })),
  };
}
