import { useCallback } from "react";
import type { MouseEvent } from "react";

type WheelResultDialogProps = {
  onClose: () => void;
  result: string;
};

export function WheelResultDialog({ onClose, result }: WheelResultDialogProps) {
  const stopPopupClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

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
        <strong>{result}</strong>
        <button type="button" onClick={onClose}>
          확인
        </button>
      </section>
    </div>
  );
}
