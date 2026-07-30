import { useRef } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import {
  createDistrictExplorationPath,
  createSubwayStationExplorationPath,
} from "@shared/constants/path";

import { useEntryExplorationDistrictSelection } from "../application/useEntryExplorationDistrictSelection";
import { useEntryExplorationSubwaySelection } from "../application/useEntryExplorationSubwaySelection";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import type { Line2Station } from "../domain/line2Station";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";

export function EntryExplorationPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const districtSelection = useEntryExplorationDistrictSelection({
    createExtraSceneInteractionControllers: createSubwayInteractionControllers,
  });

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: districtSelection.handleSceneControlsReady,
  });

  const handleExploreDistrict = (districtId: number): void => {
    navigate(createDistrictExplorationPath(districtId));
  };

  const handleExploreSubwayStation = (station: Line2Station): void => {
    navigate(createSubwayStationExplorationPath(station.id));
  };

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      <SubwaySelectionDialog
        onExplore={handleExploreSubwayStation}
        subwaySelection={subwaySelection}
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
