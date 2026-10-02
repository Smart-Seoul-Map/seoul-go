import type { ReactElement } from "react";

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
      {indicators.map(({ angleRadians, id, name, x, y }) => (
        <div
          key={id}
          className="ExplorationOffscreenIndicator"
          role="img"
          aria-label={`${name} 방향`}
          style={{ left: x, top: y }}
        >
          <svg
            className="ExplorationOffscreenIndicatorArrow"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={{ transform: `rotate(${angleRadians}rad)` }}
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      ))}
    </div>
  );
}
