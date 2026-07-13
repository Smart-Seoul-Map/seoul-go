import { useCallback } from "react";
import type { MouseEvent } from "react";

type DistrictResultDialogProps = {
  onClose: () => void;
  result: string;
};

export function DistrictResultDialog({ onClose, result }: DistrictResultDialogProps) {
  const stopPopupClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

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
        <strong>{result}</strong>
        <button type="button" onClick={onClose}>
          확인
        </button>
      </section>
    </div>
  );
}
