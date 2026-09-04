import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import {
  createDistrictExplorationPath,
  createSubwayStationExplorationPath,
} from "@shared/constants/path";
import { getSeoulDistrictById } from "@shared/constants/seoulDistrict";

import type {
  EntryExplorationDartThrowResult,
  EntryExplorationDartViewControls,
} from "../application/entryExplorationSeoulTileMapViewInteraction";
import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionStatus } from "../application/entryExplorationSubwaySelectionInteraction";
import { useEntryExplorationDistrictSelection } from "../application/useEntryExplorationDistrictSelection";
import { useEntryExplorationSubwaySelection } from "../application/useEntryExplorationSubwaySelection";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import type { Line2Station } from "../domain/line2Station";
import { toSeoulGridCellCenter } from "../domain/seoulGridCoordinates";
import { EntryExplorationDartArrow } from "./EntryExplorationDartArrow";
import { EntryExplorationDartGuide } from "./EntryExplorationDartGuide";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";

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
  const { createSubwayInteractionControllers, subwaySelection } =
    useEntryExplorationSubwaySelection();
  const [isDartGuideVisible, setIsDartGuideVisible] = useState(false);
  const [isDartTargetHovered, setIsDartTargetHovered] = useState(false);
  const [dartShotId, setDartShotId] = useState<number | null>(null);
  const [dartShotResult, setDartShotResult] = useState<EntryExplorationDartThrowResult | null>(
    null
  );
  const [dartLandedResult, setDartLandedResult] = useState<EntryExplorationDartThrowResult | null>(
    null
  );
  const dartShotResultRef = useRef<EntryExplorationDartThrowResult | null>(null);
  const dartViewControlsRef = useRef<EntryExplorationDartViewControls | null>(null);
  const handleDartViewControlsReady = useCallback((controls: EntryExplorationDartViewControls) => {
    dartViewControlsRef.current = controls;
  }, []);
  const handleDartViewActiveChange = useCallback((isActive: boolean) => {
    setIsDartGuideVisible(isActive);

    if (!isActive) {
      setIsDartTargetHovered(false);
      setDartShotId(null);
      setDartShotResult(null);
      setDartLandedResult(null);
      dartViewControlsRef.current?.setHitCell(null);
    }
  }, []);
  const handleDartThrowResult = useCallback((result: EntryExplorationDartThrowResult) => {
    dartShotResultRef.current = result;
    setDartShotId((currentShotId) => (currentShotId ?? 0) + 1);
    setDartShotResult(result);
  }, []);
  const handleDartFlightEnd = useCallback(() => {
    const landed = dartShotResultRef.current;

    setDartLandedResult(landed);
    dartViewControlsRef.current?.setHitCell(landed?.cell ?? null);
  }, []);
  const districtSelection = useEntryExplorationDistrictSelection({
    createExtraSceneInteractionControllers: createSubwayInteractionControllers,
    onDartThrowResult: handleDartThrowResult,
    onDartViewActiveChange: handleDartViewActiveChange,
    onDartViewControlsReady: handleDartViewControlsReady,
    onDartTargetHoverChange: setIsDartTargetHovered,
  });

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: districtSelection.handleSceneControlsReady,
  });

  useEffect(() => {
    onSubwayStationSelectionChange?.(subwaySelection.selectedStation, subwaySelection.status);
  }, [onSubwayStationSelectionChange, subwaySelection.selectedStation, subwaySelection.status]);

  const handleStartGridExploration = (result: EntryExplorationDartThrowResult): void => {
    const district = result.districtId ? getSeoulDistrictById(result.districtId) : null;

    if (!district) {
      return;
    }

    navigate(createDistrictExplorationPath(district.id, toSeoulGridCellCenter(result.cell)));
  };

  const handleExploreDistrict = (districtId: number): void => {
    navigate(createDistrictExplorationPath(districtId));
  };

  const handleExploreSubwayStation = (stationId: string): void => {
    navigate(createSubwayStationExplorationPath(stationId));
  };

  return (
    <main className="entry-exploration-page" data-dart-target={isDartTargetHovered}>
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      <EntryExplorationDartGuide
        isVisible={isDartGuideVisible}
        landedResult={dartLandedResult}
        onStartExploration={handleStartGridExploration}
        shotResult={dartShotResult}
      />
      <EntryExplorationDartArrow
        isTargetHovered={isDartTargetHovered}
        isVisible={isDartGuideVisible}
        onFlightEnd={handleDartFlightEnd}
        shotId={dartShotId}
      />
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
