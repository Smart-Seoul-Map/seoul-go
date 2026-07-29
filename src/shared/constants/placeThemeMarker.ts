// MapLibre marker data needs concrete color strings; DOM UI can use the paired CSS tokens.
export const PLACE_THEME_MARKERS = {
  RED: {
    markerColor: "#c92a2a",
    markerColorToken: "--sg-place-theme-red",
    closedBoxImage: "red_closed_box",
    openBoxImage: "red_open_box",
  },
  PURPLE: {
    markerColor: "#7b2cbf",
    markerColorToken: "--sg-place-theme-purple",
    closedBoxImage: "purple_closed_box",
    openBoxImage: "purple_open_box",
  },
  BLUE: {
    markerColor: "#1971c2",
    markerColorToken: "--sg-place-theme-blue",
    closedBoxImage: "blue_closed_box",
    openBoxImage: "blue_open_box",
  },
  BLACK: {
    markerColor: "#212529",
    markerColorToken: "--sg-place-theme-black",
    closedBoxImage: "black_closed_box",
    openBoxImage: "black_open_box",
  },
  YELLOW: {
    markerColor: "#e6a100",
    markerColorToken: "--sg-place-theme-yellow",
    closedBoxImage: "yellow_closed_box",
    openBoxImage: "yellow_open_box",
  },
} as const;
