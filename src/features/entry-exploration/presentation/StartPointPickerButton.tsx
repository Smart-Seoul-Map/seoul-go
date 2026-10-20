import type { ReactElement, SyntheticEvent } from "react";

import { AppButton } from "@shared/ui/button";

import "./StartPointPickerButton.css";

type StartPointPickerButtonProps = {
  isHidden?: boolean;
  onClick: () => void;
};

export function StartPointPickerButton({
  isHidden = false,
  onClick,
}: StartPointPickerButtonProps): ReactElement {
  return (
    <div
      className="start-point-picker-button"
      data-hidden={isHidden}
      inert={isHidden}
      onClick={stopSceneInput}
      onPointerDown={stopSceneInput}
      onWheel={stopSceneInput}
    >
      <AppButton variant="primary" size="md" onClick={onClick}>
        시작 지점 뽑기
      </AppButton>
    </div>
  );
}

function stopSceneInput(event: SyntheticEvent): void {
  event.stopPropagation();
}
