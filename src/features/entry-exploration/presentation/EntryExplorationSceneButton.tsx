import type { ReactElement, ReactNode, SyntheticEvent } from "react";

import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";

import "./EntryExplorationSceneButton.css";

type EntryExplorationSceneButtonProps = {
  children: ReactNode;
  isDisabled?: boolean;
  isVisible: boolean;
  onClick: () => void;
};

export function EntryExplorationSceneButton({
  children,
  isDisabled = false,
  isVisible,
  onClick,
}: EntryExplorationSceneButtonProps): ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <AppBox
      className="entry-exploration-scene-button"
      onClick={stopSceneInput}
      onPointerDown={stopSceneInput}
      onWheel={stopSceneInput}
    >
      <AppButton variant="primary" size="lg" disabled={isDisabled} onClick={onClick}>
        {children}
      </AppButton>
    </AppBox>
  );
}

function stopSceneInput(event: SyntheticEvent): void {
  event.stopPropagation();
}
