import { useCallback } from "react";
import type { MouseEvent } from "react";

import { createDistrictExplorationPath } from "@shared/constants/path";

import type { WheelDistrictResult } from "../application/useWheelDistrictSelection";

type WheelResultDialogProps = {
  onClose: () => void;
  result: WheelDistrictResult;
};

export function WheelResultDialog({ onClose, result }: WheelResultDialogProps) {
  const stopPopupClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);
  const moveToDistrictExploration = useCallback(() => {
    window.location.href = createDistrictExplorationPath(result.id);
  }, [result.id]);

  return (
    <div className="wheel-result-backdrop" role="presentation" onClick={onClose}>
      <section
        className="wheel-result-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-result-title"
        onClick={stopPopupClick}
      >
        <span id="wheel-result-title">결과</span>
        <strong>{result.name}</strong>
        <button type="button" onClick={moveToDistrictExploration}>
          확인
        </button>
      </section>
    </div>
  );
}
