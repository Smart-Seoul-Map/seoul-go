import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactElement } from "react";

type SubwaySelectionModalProps = {
  onClose: () => void;
};

export function SubwaySelectionModal({ onClose }: SubwaySelectionModalProps): ReactElement {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") {
      return;
    }

    onClose();
  };

  return (
    <div
      className="subway-selection-modal-backdrop"
      onKeyDown={handleDialogKeyDown}
      role="presentation"
    >
      <section
        aria-labelledby="subway-selection-modal-title"
        aria-modal="true"
        className="subway-selection-modal"
        role="dialog"
      >
        <button
          ref={closeButtonRef}
          aria-label="지하철역 선택 닫기"
          className="subway-selection-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <span className="subway-selection-modal-badge">임시 이벤트</span>
        <h2 id="subway-selection-modal-title">2호선 여행을 시작해 볼까요?</h2>
        <p>
          캐릭터가 지하철 표식에 도착했습니다. 다음 단계에서 이곳에 2호선 노선도와 랜덤 역 선정
          인터랙션이 들어갑니다.
        </p>
        <div aria-hidden="true" className="subway-selection-modal-placeholder">
          <span>2</span>
          <strong>서울 지하철 2호선</strong>
        </div>
      </section>
    </div>
  );
}
