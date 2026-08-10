import type { CSSProperties, ReactElement } from "react";

import "./ExplorationPlaceCard.css";

import { getExplorationPlaceCardPalette } from "../config/explorationPlaceCardPalette";
import { AppVStack } from "@shared/ui/layout";
import { AppText } from "@shared/ui/typography";

export type ExplorationPlaceCardPlace = {
  imageUrl: string;
  markerColor: string;
  name: string;
  themeId: string;
};

type ExplorationPlaceCardProps = {
  place: ExplorationPlaceCardPlace;
};

export function ExplorationPlaceCard({ place }: ExplorationPlaceCardProps): ReactElement {
  const cardStyle = {
    "--exploration-place-card-theme-color": place.markerColor,
    ...getExplorationPlaceCardPalette(place.themeId),
  } as CSSProperties;

  return (
    <article className="exploration-place-card" style={cardStyle}>
      <div className="exploration-place-card-body">
        <div className="exploration-place-card-header" aria-hidden="true">
          <span className="exploration-place-card-header-accent">
            <span className="exploration-place-card-header-label">SEOUL'S PLACE</span>
          </span>
        </div>
        <div className="exploration-place-card-panel-frame">
          <div className="exploration-place-card-panel">
            <div className="exploration-place-card-panel-inner">
              <div className="exploration-place-card-panel-surface">
                <div className="exploration-place-card-message">
                  <AppText as="span" align="center" maxLines={2} role="body">
                    {place.name}
                  </AppText>
                </div>
                <AppVStack align="center" gap="sm">
                  <div aria-hidden="true" className="exploration-place-card-character" />
                  <div className="exploration-place-card-image-frame">
                    {place.imageUrl ? (
                      <img
                        alt={`${place.name} 대표 이미지`}
                        className="exploration-place-card-image"
                        src={place.imageUrl}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="exploration-place-card-image-placeholder"
                      />
                    )}
                  </div>
                  <div aria-hidden="true" className="exploration-place-card-sparkles">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </AppVStack>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="exploration-place-card-footer" aria-hidden="true">
        SEOUL GO
      </div>
    </article>
  );
}
