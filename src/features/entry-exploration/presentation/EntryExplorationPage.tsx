import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import {
  createDistrictExplorationPath,
  createSubwayStationExplorationPath,
} from "@shared/constants/path";

import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionStatus } from "../application/entryExplorationSubwaySelectionInteraction";
import { useEntryExplorationDistrictSelection } from "../application/useEntryExplorationDistrictSelection";
import { useEntryExplorationSubwaySelection } from "../application/useEntryExplorationSubwaySelection";
import {
  type EntryExplorationThreeSceneControls,
  useEntryExplorationThreeScene,
} from "../application/useEntryExplorationThreeScene";
import type { Line2Station } from "../domain/line2Station";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";
import { EntryExplorationIntroOverlay } from "./EntryExplorationIntroOverlay";

export type EntryExplorationPageProps = {
  onSubwayStationSelectionChange?: (
    station: Line2Station | null,
    status: EntryExplorationSubwaySelectionStatus
  ) => void;
  subwayStationAvailabilityStatus: SubwayStationAvailabilityStatus;
};

export function EntryExplorationPage({
  onSubwayStationSelectionChange,
  subwayStationAvailabilityStatus,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [startIntro, setStartIntro] = useState<(() => boolean) | null>(null);
  const [isIntroReady, setIsIntroReady] = useState(false);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const districtSelection = useEntryExplorationDistrictSelection({
    createExtraSceneInteractionControllers: createSubwayInteractionControllers,
  });

  const handleSceneControlsReady = useCallback(
    (controls: EntryExplorationThreeSceneControls | null) => {
      districtSelection.handleSceneControlsReady(controls);
      setStartIntro(() => controls?.startIntro ?? null);
      setIsIntroReady(controls?.isIntroReady ?? false);
    },
    [districtSelection]
  );

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: handleSceneControlsReady,
  });

  const handleStartIntro = (): void => {
    if (startIntro?.()) {
      setIsIntroVisible(false);
    }
  };

  useEffect(() => {
    onSubwayStationSelectionChange?.(subwaySelection.selectedStation, subwaySelection.status);
  }, [onSubwayStationSelectionChange, subwaySelection.selectedStation, subwaySelection.status]);

  const handleExploreDistrict = (districtId: number): void => {
    navigate(createDistrictExplorationPath(districtId));
  };

  const handleExploreSubwayStation = (stationId: string): void => {
    navigate(createSubwayStationExplorationPath(stationId));
  };

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      {isIntroVisible ? (
        <EntryExplorationIntroOverlay disabled={!isIntroReady} onStart={handleStartIntro} />
      ) : null}
      <SubwaySelectionDialog
        availabilityStatus={subwayStationAvailabilityStatus}
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
