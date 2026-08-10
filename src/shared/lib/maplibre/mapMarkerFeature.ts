export type MapMarkerFeatureProperties = {
  id: string;
  imageUrl: string;
  name: string;
  themeId: string;
  themeName: string;
  markerColor: string;
  markerImage: string;
};

export type MapMarkerPointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

export type MapMarkerFeature = {
  type: "Feature";
  id: string;
  geometry: MapMarkerPointGeometry;
  properties: MapMarkerFeatureProperties;
};

export type MapMarkerFeatureCollection = {
  type: "FeatureCollection";
  features: MapMarkerFeature[];
};

export function createEmptyMapMarkerFeatureCollection(): MapMarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
  };
}
