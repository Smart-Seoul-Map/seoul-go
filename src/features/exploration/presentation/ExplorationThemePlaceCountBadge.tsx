import type { ReactElement } from "react";

import { AppBadge, type AppBadgeSize } from "@shared/ui/badge";

export type ExplorationThemePlaceCountBadgeProps = {
  name: string;
  size?: AppBadgeSize;
  totalCount: number;
  visitedCount: number;
};

export function ExplorationThemePlaceCountBadge({
  name,
  size = "md",
  totalCount,
  visitedCount,
}: ExplorationThemePlaceCountBadgeProps): ReactElement {
  return (
    <AppBadge
      ariaLabel={`${name} 장소 ${visitedCount}/${totalCount}`}
      size={size}
      variant="surface"
      textPolicy="singleLine"
    >
      <span>{name}</span>{" "}
      <span>
        {visitedCount}/{totalCount}
      </span>
    </AppBadge>
  );
}
