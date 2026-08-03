import type { CSSProperties } from "react";

type ExplorationPlaceCardPalette = CSSProperties;

export function getExplorationPlaceCardPalette(markerColor: string): ExplorationPlaceCardPalette {
  const normalizedMarkerColor = markerColor.toLowerCase();

  if (normalizedMarkerColor === "#212529") {
    return {
      "--exploration-place-card-accent": "#d79d27",
      "--exploration-place-card-header-bg": "#1d1712",
      "--exploration-place-card-header-ink": "#ffd66a",
      "--exploration-place-card-title-ink": "#fff1b8",
      "--exploration-place-card-panel-bg": "#0c0a08",
      "--exploration-place-card-panel-bg-weak": "#15110d",
      "--exploration-place-card-panel-line": "#d79d27",
      "--exploration-place-card-ink": "#ffe6a3",
      "--exploration-place-card-footer-bg": "#d79d27",
      "--exploration-place-card-footer-ink": "#111111",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#c92a2a") {
    return {
      "--exploration-place-card-accent": "#c33f2e",
      "--exploration-place-card-header-bg": "#ffb68f",
      "--exploration-place-card-header-ink": "#2a1812",
      "--exploration-place-card-title-ink": "#2a1812",
      "--exploration-place-card-panel-bg": "#ffd8ad",
      "--exploration-place-card-panel-bg-weak": "#ffe6c6",
      "--exploration-place-card-panel-line": "#c33f2e",
      "--exploration-place-card-ink": "#2a1812",
      "--exploration-place-card-footer-bg": "#ff8a68",
      "--exploration-place-card-footer-ink": "#1f1510",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#7b2cbf") {
    return {
      "--exploration-place-card-accent": "#f4c743",
      "--exploration-place-card-header-bg": "#f5cf66",
      "--exploration-place-card-header-ink": "#1d1427",
      "--exploration-place-card-title-ink": "#1d1427",
      "--exploration-place-card-panel-bg": "#f7d3a5",
      "--exploration-place-card-panel-bg-weak": "#ffe5bf",
      "--exploration-place-card-panel-line": "#f4c743",
      "--exploration-place-card-ink": "#ffdf7d",
      "--exploration-place-card-footer-bg": "#7b2cbf",
      "--exploration-place-card-footer-ink": "#f7d761",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#1971c2") {
    return {
      "--exploration-place-card-accent": "#195c9e",
      "--exploration-place-card-header-bg": "#bfe1ff",
      "--exploration-place-card-header-ink": "#13283c",
      "--exploration-place-card-title-ink": "#13283c",
      "--exploration-place-card-panel-bg": "#e2f2ff",
      "--exploration-place-card-panel-bg-weak": "#fff1c7",
      "--exploration-place-card-panel-line": "#195c9e",
      "--exploration-place-card-ink": "#13283c",
      "--exploration-place-card-footer-bg": "#8ac7ff",
      "--exploration-place-card-footer-ink": "#13283c",
    } as ExplorationPlaceCardPalette;
  }

  return {
    "--exploration-place-card-accent": "#d09418",
    "--exploration-place-card-header-bg": "#ffe1a6",
    "--exploration-place-card-header-ink": "#2b1c0d",
    "--exploration-place-card-title-ink": "#2b1c0d",
    "--exploration-place-card-panel-bg": "#ffe7c0",
    "--exploration-place-card-panel-bg-weak": "#fff2d4",
    "--exploration-place-card-panel-line": "#d09418",
    "--exploration-place-card-ink": "#2b1c0d",
    "--exploration-place-card-footer-bg": "#f4a66f",
    "--exploration-place-card-footer-ink": "#2b1c0d",
  } as ExplorationPlaceCardPalette;
}
