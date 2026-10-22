import type { ReactElement, ReactNode, SyntheticEvent } from "react";

import { AppBox } from "@shared/ui/box";
import { AppButton } from "@shared/ui/button";

import "./EntryExplorationSceneButton.css";

type EntryExplorationSceneButtonPlacement = "corner" | "bottom";

type EntryExplorationSceneButtonProps = {
  children: ReactNode;
  isDisabled?: boolean;
  isVisible: boolean;
  onClick: () => void;
  placement: EntryExplorationSceneButtonPlacement;
};

const BUTTON_SIZE = { bottom: "lg", corner: "md" } as const;

export function EntryExplorationSceneButton({
  children,
  isDisabled = false,
  isVisible,
  onClick,
  placement,
}: EntryExplorationSceneButtonProps): ReactElement | null {
  if (!isVisible) {
    return null;
  }

  return (
    <AppBox
      className="entry-exploration-scene-button"
      data-placement={placement}
      onClick={stopSceneInput}
      onPointerDown={stopSceneInput}
      onWheel={stopSceneInput}
    >
      <AppButton
        variant="primary"
        size={BUTTON_SIZE[placement]}
        disabled={isDisabled}
        onClick={onClick}
      >
        {children}
      </AppButton>
    </AppBox>
  );
}

function stopSceneInput(event: SyntheticEvent): void {
  event.stopPropagation();
}
