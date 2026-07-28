import { useRef } from "react";
import type { ReactElement } from "react";

import { useEntryExplorationDistrictSelectionFlow } from "../application/useEntryExplorationDistrictSelectionFlow";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";
import { EntryExplorationDistrictSelectionDialog } from "./EntryExplorationDistrictSelectionDialog";

export function EntryExplorationPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const districtSelection = useEntryExplorationDistrictSelectionFlow();

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: districtSelection.createSceneInteractionControllers,
    onSceneControlsReady: districtSelection.handleSceneControlsReady,
  });

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
      <EntryExplorationDistrictSelectionDialog {...districtSelection.dialogProps} />
    </main>
  );
}
