import type { ReactElement } from "react";

import { AppBox } from "@shared/ui/box";

import type { OffscreenMarkerIndicator } from "../application/explorationOffscreenMarkers";
import "./ExplorationOffscreenIndicators.css";

type ExplorationOffscreenIndicatorsProps = {
  indicators: readonly OffscreenMarkerIndicator[];
};

export function ExplorationOffscreenIndicators({
  indicators,
}: ExplorationOffscreenIndicatorsProps): ReactElement {
  return (
    <div className="ExplorationOffscreenIndicators">
      {indicators.map(({ id, name, x, y }) => (
        <AppBox
          key={id}
          className="ExplorationOffscreenIndicator"
          role="img"
          aria-label={`${name} 방향`}
          style={{ left: x, top: y }}
          bg="bg.surfacePaper"
          borderColor="stroke.weak"
          borderWidth="strokeWidth.surface"
          borderRadius="radius.4_5"
          boxShadow="shadow.raised"
        >
          <span className="ExplorationOffscreenIndicatorBadge" aria-hidden="true">
            <span className="ExplorationOffscreenIndicatorStar" />
          </span>
        </AppBox>
      ))}
    </div>
  );
}
