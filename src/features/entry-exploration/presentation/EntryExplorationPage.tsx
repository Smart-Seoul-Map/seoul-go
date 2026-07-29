import { useRef } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { createDistrictExplorationPath } from "@shared/constants/path";

import { useEntryExplorationDistrictSelection } from "../application/useEntryExplorationDistrictSelection";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";

export function EntryExplorationPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const districtSelection = useEntryExplorationDistrictSelection();

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: districtSelection.handleSceneControlsReady,
  });

  const handleExploreDistrict = (districtId: number): void => {
    navigate(createDistrictExplorationPath(districtId));
  };

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      <EntryExplorationDistrictSelectionDialog
        onBack={districtSelection.deactivateSelection}
        onExplore={handleExploreDistrict}
        onRetry={districtSelection.retrySelection}
        selectionResult={districtSelection.selectionResult}
      />
    </main>
  );
}
