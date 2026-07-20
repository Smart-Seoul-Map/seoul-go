import { PLACE_THEME_MARKERS } from "@shared/constants/placeThemeMarker";

export const EXPLORATION_PLACE_MARKERS_SOURCE_ID = "smart-seoul-theme-places";
export const EXPLORATION_PLACE_MARKERS_LAYER_ID = "smart-seoul-theme-place-markers";
export const EXPLORATION_PLACE_MARKER_ICON_SIZE = 0.5;

export const EXPLORATION_PLACE_MARKER_IMAGES = Object.values(PLACE_THEME_MARKERS).map(
  ({ markerImage }) => ({
    id: markerImage,
    url: `/images/place-markers/${markerImage}.png`,
  })
);
