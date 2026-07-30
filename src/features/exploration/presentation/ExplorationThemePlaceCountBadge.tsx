import type { ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";

export type ExplorationThemePlaceCountBadgeProps = {
  markerColor: string | null;
  markerColorToken: string | null;
  name: string;
  totalCount: number;
  visitedCount: number;
};

export function ExplorationThemePlaceCountBadge({
  markerColor,
  markerColorToken,
  name,
  totalCount,
  visitedCount,
}: ExplorationThemePlaceCountBadgeProps): ReactElement {
  const markerColorValue = markerColorToken ? `var(${markerColorToken})` : markerColor;

  return (
    <AppBadge
      ariaLabel={`${name} 장소 ${visitedCount}/${totalCount}`}
      leading={
        markerColorValue ? (
          <span
            aria-hidden="true"
            className="exploration-theme-place-count-badge-dot"
            style={{ backgroundColor: markerColorValue }}
          />
        ) : undefined
      }
      size="lg"
      variant="solid"
    >
      <span>{name}</span>
      <span>
        {visitedCount}/{totalCount}
      </span>
    </AppBadge>
  );
}
