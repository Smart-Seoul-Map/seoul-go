import { useCallback, useEffect, useRef, useState } from "react";

import { easeOutCubic } from "@shared/lib/animation/easing";

import {
  LINE2_BRANCH_STATION_IDS,
  LINE2_INITIAL_STATION_ID,
  LINE2_MAIN_LOOP_STATION_IDS,
  LINE2_SELECTION_ANIMATION_DURATION_MS,
  LINE2_STATIONS,
} from "../config/line2SelectionConfig";
import {
  createLine2SelectionRoute,
  getLine2RoutePointAtProgress,
  selectRandomLine2Station,
  type Line2RoutePoint,
  type Line2Station,
} from "../domain/line2Station";

export type Line2StationSelectionStatus = "idle" | "selecting" | "selected";

type Line2StationSelectionController = {
  handleStationSelection: () => void;
  selectedStation: Line2Station | null;
  status: Line2StationSelectionStatus;
  trainPosition: Line2RoutePoint;
};

const initialStation = LINE2_STATIONS.find((station) => station.id === LINE2_INITIAL_STATION_ID);
const safeInitialStation = initialStation ?? LINE2_STATIONS[0];

export function useLine2StationSelection(): Line2StationSelectionController {
  const animationFrameRef = useRef<number | null>(null);
  const currentStationIdRef = useRef<string>(safeInitialStation.id);
  const [selectedStation, setSelectedStation] = useState<Line2Station | null>(null);
  const [status, setStatus] = useState<Line2StationSelectionStatus>("idle");
  const [trainPosition, setTrainPosition] = useState<Line2RoutePoint>(safeInitialStation.position);

  const cancelSelectionAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = null;
  }, []);

  const handleStationSelection = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    const targetStation = selectRandomLine2Station(LINE2_STATIONS);
    const route = createLine2SelectionRoute({
      branchStationIds: LINE2_BRANCH_STATION_IDS,
      mainLoopStationIds: LINE2_MAIN_LOOP_STATION_IDS,
      startStationId: currentStationIdRef.current,
      stations: LINE2_STATIONS,
      targetStationId: targetStation.id,
    });
    let startTime: number | null = null;

    setSelectedStation(null);
    setStatus("selecting");

    const animateSelection = (time: number) => {
      startTime ??= time;

      const elapsedTime = time - startTime;
      const progress = Math.min(elapsedTime / LINE2_SELECTION_ANIMATION_DURATION_MS, 1);
      const easedProgress = easeOutCubic(progress);

      setTrainPosition(getLine2RoutePointAtProgress(route, easedProgress));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateSelection);
        return;
      }

      animationFrameRef.current = null;
      currentStationIdRef.current = targetStation.id;
      setSelectedStation(targetStation);
      setStatus("selected");
    };

    animationFrameRef.current = requestAnimationFrame(animateSelection);
  }, []);

  useEffect(() => cancelSelectionAnimation, [cancelSelectionAnimation]);

  return {
    handleStationSelection,
    selectedStation,
    status,
    trainPosition,
  };
}
