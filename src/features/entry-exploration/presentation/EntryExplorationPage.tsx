import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
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
import { createEntryExplorationPlaceVisit } from "../domain/entryExplorationPlaceVisit";
import {
  ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS,
  type EntryExplorationPlaceId,
} from "../config/entryExplorationPlace";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";
import { EntryExplorationIntroOverlay } from "./EntryExplorationIntroOverlay";

export type EntryExplorationPageProps = {
  renderPlacePanel?: (props: {
    open: boolean;
    onClose: () => void;
    placeId: EntryExplorationPlaceId;
  }) => ReactNode;
  onSubwayStationSelectionChange?: (
    station: Line2Station | null,
    status: EntryExplorationSubwaySelectionStatus
  ) => void;
  subwayStationAvailabilityStatus: SubwayStationAvailabilityStatus;
};

export function EntryExplorationPage({
  renderPlacePanel,
  onSubwayStationSelectionChange,
  subwayStationAvailabilityStatus,
}: EntryExplorationPageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [startIntro, setStartIntro] = useState<(() => boolean) | null>(null);
  const [isIntroReady, setIsIntroReady] = useState(false);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [placePanel, setPlacePanel] = useState<{ placeId: EntryExplorationPlaceId; open: boolean }>(
    { placeId: "hanok", open: false }
  );
  const [placeVisits] = useState(() => {
    const createVisit = (placeId: EntryExplorationPlaceId) =>
      createEntryExplorationPlaceVisit({
        radius: ENTRY_EXPLORATION_PLACE_ARRIVAL_RADIUS,
        onOpenChange: (open) =>
          setPlacePanel((current) => {
            // Leaving another landmark must not close the newly opened place.
            if (!open && current.placeId !== placeId) return current;
            return { placeId, open };
          }),
      });
    return { hanok: createVisit("hanok"), tower: createVisit("tower") };
  });
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
    placeVisits,
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
      {!isIntroVisible &&
        renderPlacePanel?.({ ...placePanel, onClose: placeVisits[placePanel.placeId].dismiss })}
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
