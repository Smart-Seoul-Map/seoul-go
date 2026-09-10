import type { ReactElement } from "react";

import introBackgroundUrl from "../../../assets/entry-exploration/intro-background.png";
import { AppButton } from "@shared/ui/button";

import "./EntryExplorationIntroOverlay.css";

export type EntryExplorationIntroOverlayProps = {
  disabled: boolean;
  onStart: () => void;
};

export function EntryExplorationIntroOverlay({
  disabled,
  onStart,
}: EntryExplorationIntroOverlayProps): ReactElement {
  return (
    <section aria-label="서울고 탐방 시작" className="entry-exploration-intro-overlay">
      <div className="entry-exploration-intro-overlay-stage">
        <img alt="서울탐방 GO" src={introBackgroundUrl} />
        <AppButton disabled={disabled} onClick={onStart} size="lg" variant="strong">
          탐방 시작
        </AppButton>
      </div>
    </section>
  );
}
