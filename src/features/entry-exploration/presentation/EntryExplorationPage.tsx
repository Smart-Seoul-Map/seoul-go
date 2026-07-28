import { useRef } from "react";
import type { ReactElement } from "react";

import { useEntryExplorationSceneInteractionControllers } from "../application/useEntryExplorationSceneInteractionControllers";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import { SubwaySelectionControls } from "./SubwaySelectionControls";

export function EntryExplorationPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { createSceneInteractionControllers, subwaySelection } =
    useEntryExplorationSceneInteractionControllers();

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers,
  });

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      {subwaySelection.isActive ? (
        <SubwaySelectionControls
          isInteractionLocked={!subwaySelection.isCameraReady}
          onClose={subwaySelection.handleClose}
          onStationSelection={subwaySelection.handleStationSelection}
          selectedStation={subwaySelection.selectedStation}
          status={subwaySelection.status}
        />
      ) : null}
    </main>
  );
}
