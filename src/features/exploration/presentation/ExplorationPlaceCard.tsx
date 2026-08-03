import type { CSSProperties, ReactElement } from "react";

import "./ExplorationPlaceCard.css";

import { getExplorationPlaceCardPalette } from "../config/explorationPlaceCardPalette";
import { AppVStack } from "@shared/ui/layout";
import { AppText } from "@shared/ui/typography";

export type ExplorationPlaceCardPlace = {
  imageUrl: string;
  markerColor: string;
  name: string;
};

type ExplorationPlaceCardProps = {
  place: ExplorationPlaceCardPlace;
};

export function ExplorationPlaceCard({ place }: ExplorationPlaceCardProps): ReactElement {
  const cardStyle = {
    "--exploration-place-card-theme-color": place.markerColor,
    ...getExplorationPlaceCardPalette(place.markerColor),
  } as CSSProperties;

  return (
    <article className="exploration-place-card" style={cardStyle}>
      <div className="exploration-place-card-header" aria-hidden="true">
        SEOUL'S PLACE
      </div>
      <div className="exploration-place-card-panel">
        <div aria-hidden="true" className="exploration-place-card-panel-line" />
        <div className="exploration-place-card-message">
          <AppText as="span" align="center" maxLines={2} role="body">
            {place.name}
          </AppText>
        </div>
        <AppVStack align="center" gap="sm">
          <div className="exploration-place-card-image-frame">
            {place.imageUrl ? (
              <img
                alt={`${place.name} 대표 이미지`}
                className="exploration-place-card-image"
                src={place.imageUrl}
              />
            ) : (
              <div aria-hidden="true" className="exploration-place-card-image-placeholder" />
            )}
          </div>
          <div aria-hidden="true" className="exploration-place-card-sparkles">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </AppVStack>
      </div>
      <div className="exploration-place-card-footer" aria-hidden="true">
        SEOUL GO
      </div>
    </article>
  );
}
