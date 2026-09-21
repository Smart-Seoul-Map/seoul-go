import type { ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";

export type ExplorationThemePlaceCountBadgeProps = {
  name: string;
  totalCount: number;
  visitedCount: number;
};

export function ExplorationThemePlaceCountBadge({
  name,
  totalCount,
  visitedCount,
}: ExplorationThemePlaceCountBadgeProps): ReactElement {
  return (
    <AppBadge ariaLabel={`${name} 장소 ${visitedCount}/${totalCount}`} size="lg" variant="surface">
      <span>{name}</span>{" "}
      <span>
        {visitedCount}/{totalCount}
      </span>
    </AppBadge>
  );
}
