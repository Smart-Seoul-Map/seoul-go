import { useCallback } from "react";
import type { MouseEvent } from "react";

import { createDistrictExplorationPath } from "@shared/constants/path";

type DistrictResultDialogProps = {
  onClose: () => void;
  result: {
    id: number;
    name: string;
  };
};

export function DistrictResultDialog({ onClose, result }: DistrictResultDialogProps) {
  const stopPopupClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);
  const moveToDistrictExploration = useCallback(() => {
    window.location.href = createDistrictExplorationPath(result.id);
  }, [result.id]);

  return (
    <div className="district-result-backdrop" role="presentation" onClick={onClose}>
      <section
        className="district-result-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="district-result-title"
        onClick={stopPopupClick}
      >
        <span id="district-result-title">선정 결과</span>
        <strong>{result.name}</strong>
        <button type="button" onClick={moveToDistrictExploration}>
          확인
        </button>
      </section>
    </div>
  );
}
