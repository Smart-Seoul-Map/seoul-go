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
      "--exploration-place-card-body-frame-bg": "#050403",
      "--exploration-place-card-panel-bg": "#0c0a08",
      "--exploration-place-card-panel-bg-weak": "#15110d",
      "--exploration-place-card-panel-frame-bg": "#d79d27",
      "--exploration-place-card-panel-line": "#d79d27",
      "--exploration-place-card-ink": "#0c0a08",
      "--exploration-place-card-footer-bg": "#d79d27",
      "--exploration-place-card-footer-ink": "#111111",
      "--exploration-place-card-card-bg-weak": "#d79d27",
      "--exploration-place-card-character-image": "url('/images/seoul-characters/moo.png')",
      "--exploration-place-card-character-width": "82px",
      "--exploration-place-card-character-bottom": "-24px",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#c92a2a") {
    return {
      "--exploration-place-card-accent": "#c33f2e",
      "--exploration-place-card-header-bg": "#F36851",
      "--exploration-place-card-header-ink": "#2a1812",
      "--exploration-place-card-title-ink": "#2a1812",
      "--exploration-place-card-body-frame-bg": "#F6D8BE",
      "--exploration-place-card-panel-bg": "#F36851",
      "--exploration-place-card-panel-bg-weak": "#FFB095",
      "--exploration-place-card-panel-frame-bg": "#b34c3c",
      "--exploration-place-card-panel-line": "#c33f2e",
      "--exploration-place-card-ink": "#2a1812",
      "--exploration-place-card-footer-bg": "#FD6737",
      "--exploration-place-card-footer-ink": "#1f1510",
      "--exploration-place-card-card-bg-weak": "#FD6737",
      "--exploration-place-card-character-image": "url('/images/seoul-characters/hachi.png')",
      "--exploration-place-card-character-width": "84px",
      "--exploration-place-card-character-bottom": "-26px",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#7b2cbf") {
    return {
      "--exploration-place-card-accent": "#8c38d8",
      "--exploration-place-card-header-bg": "#ae56e4",
      "--exploration-place-card-header-ink": "#1d1427",
      "--exploration-place-card-title-ink": "#1d1427",
      "--exploration-place-card-body-frame-bg": "#ead6ff",
      "--exploration-place-card-panel-bg": "#a52cf0",
      "--exploration-place-card-panel-bg-weak": "#d9b2ff",
      "--exploration-place-card-panel-frame-bg": "#7b2cbf",
      "--exploration-place-card-panel-line": "#8c38d8",
      "--exploration-place-card-ink": "#1d1427",
      "--exploration-place-card-footer-bg": "#9b38d8",
      "--exploration-place-card-footer-ink": "#fff0c8",
      "--exploration-place-card-card-bg-weak": "#9b38d8",
      "--exploration-place-card-character-image": "url('/images/seoul-characters/hou.png')",
      "--exploration-place-card-character-width": "82px",
      "--exploration-place-card-character-bottom": "-25px",
    } as ExplorationPlaceCardPalette;
  }

  if (normalizedMarkerColor === "#1971c2") {
    return {
      "--exploration-place-card-accent": "#147ddc",
      "--exploration-place-card-header-bg": "#147ddc",
      "--exploration-place-card-header-ink": "#eaf6ff",
      "--exploration-place-card-title-ink": "#eaf6ff",
      "--exploration-place-card-body-frame-bg": "#c0d2e4",
      "--exploration-place-card-panel-bg": "#258bf1",
      "--exploration-place-card-panel-bg-weak": "#b0d5fa",
      "--exploration-place-card-panel-frame-bg": "#147ddc",
      "--exploration-place-card-panel-line": "#147ddc",
      "--exploration-place-card-ink": "#2a1812",
      "--exploration-place-card-footer-bg": "#147ddc",
      "--exploration-place-card-footer-ink": "#eaf6ff",
      "--exploration-place-card-card-bg-weak": "#147ddc",
      "--exploration-place-card-character-image": "url('/images/seoul-characters/young.png')",
      "--exploration-place-card-character-width": "92px",
      "--exploration-place-card-character-bottom": "-20px",
    } as ExplorationPlaceCardPalette;
  }

  return {
    "--exploration-place-card-accent": "#d58a42",
    "--exploration-place-card-header-bg": "#EEA47E",
    "--exploration-place-card-header-ink": "#2b1c0d",
    "--exploration-place-card-title-ink": "#2b1c0d",
    "--exploration-place-card-body-frame-bg": "#FAF1DA",
    "--exploration-place-card-panel-bg": "#F7D0A0",
    "--exploration-place-card-panel-bg-weak": "#FFE6C3",
    "--exploration-place-card-panel-frame-bg": "#746344",
    "--exploration-place-card-panel-line": "#746344",
    "--exploration-place-card-ink": "#2b1c0d",
    "--exploration-place-card-footer-bg": "#F7D580",
    "--exploration-place-card-footer-ink": "#2b1c0d",
    "--exploration-place-card-card-bg-weak": "#F7D580",
    "--exploration-place-card-character-image": "url('/images/seoul-characters/joo.png')",
    "--exploration-place-card-character-width": "80px",
    "--exploration-place-card-character-bottom": "-24px",
  } as ExplorationPlaceCardPalette;
}
