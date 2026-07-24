import { useEffect } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";

import { useLine2StationSelection } from "../application/useLine2StationSelection";
import type { Line2RoutePoint } from "../domain/line2Station";

type SubwaySelectionControlsProps = {
  isInteractionLocked: boolean;
  onClose: () => void;
  onTrainPositionChange: (position: Line2RoutePoint) => void;
};

export function SubwaySelectionControls({
  isInteractionLocked,
  onClose,
  onTrainPositionChange,
}: SubwaySelectionControlsProps): ReactElement {
  const stationSelection = useLine2StationSelection();
  const isSelectionInProgress = stationSelection.status === "selecting";
  const isInputLocked = isInteractionLocked || isSelectionInProgress;

  useEffect(() => {
    onTrainPositionChange(stationSelection.trainPosition);
  }, [onTrainPositionChange, stationSelection.trainPosition]);

  const selectionButtonLabel =
    stationSelection.status === "selected" ? "다시 선정하기" : "랜덤 역 선정하기";

  const handleLayerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || isInputLocked) {
      return;
    }

    onClose();
  };

  return (
    <div className="subway-selection-layer" onPointerDown={handleLayerPointerDown}>
      <section
        aria-busy={isInputLocked}
        aria-labelledby="subway-selection-title"
        className="subway-selection-controls"
      >
        <button
          aria-label="탐색 화면으로 돌아가기"
          className="subway-selection-close"
          disabled={isInputLocked}
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className="subway-selection-controls-copy">
          <span>서울 지하철 2호선</span>
          <h2 id="subway-selection-title">오늘은 어느 역으로 떠날까요?</h2>
        </div>
        <div aria-live="polite" className="subway-selection-result">
          {stationSelection.status === "idle" ? (
            <span>본선과 지선 51개 역 중 한 곳을 선정해요.</span>
          ) : null}
          {isSelectionInProgress ? <span>열차가 노선도를 달리고 있어요...</span> : null}
          {stationSelection.selectedStation ? (
            <strong>{stationSelection.selectedStation.name}역이 선정되었습니다!</strong>
          ) : null}
        </div>
        <button
          className="subway-selection-button"
          disabled={isInputLocked}
          onClick={stationSelection.handleStationSelection}
          type="button"
        >
          {isSelectionInProgress ? "선정 중..." : selectionButtonLabel}
        </button>
        {stationSelection.selectedStation ? (
          <button
            className="subway-selection-explore-button"
            disabled={isInputLocked}
            type="button"
          >
            {stationSelection.selectedStation.name}역 탐험하기
          </button>
        ) : null}
      </section>
    </div>
  );
}
