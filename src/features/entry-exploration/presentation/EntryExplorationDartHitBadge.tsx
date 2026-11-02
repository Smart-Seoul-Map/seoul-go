import type { ReactElement } from "react";

import { AppText } from "@shared/ui/typography";

import type { EntryExplorationDartThrowResult } from "../application/entryExplorationSeoulTileMapViewInteraction";

import "./EntryExplorationDartHitBadge.css";

export type EntryExplorationDartHitBadgeProps = {
  result: EntryExplorationDartThrowResult | null;
};

export function EntryExplorationDartHitBadge({
  result,
}: EntryExplorationDartHitBadgeProps): ReactElement | null {
  if (!result) {
    return null;
  }

  return (
    <span
      className="entry-exploration-dart-hit-badge"
      style={{
        left: `${result.viewportPoint.x * 100}%`,
        top: `${result.viewportPoint.y * 100}%`,
      }}
    >
      <AppText as="span" role="supporting" tone="inverted">
        {result.gridNumber}
      </AppText>
    </span>
  );
}
