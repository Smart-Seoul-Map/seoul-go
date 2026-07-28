import { useRef } from "react";
import type { ReactElement } from "react";

import { createEntryExplorationSceneInteractionControllers } from "../application/createEntryExplorationSceneInteractionControllers";
import { useEntryExplorationThreeScene } from "../application/useEntryExplorationThreeScene";

export function EntryExplorationPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEntryExplorationThreeScene({
    containerRef,
    createSceneInteractionControllers: createEntryExplorationSceneInteractionControllers,
  });

  return (
    <main className="entry-exploration-page">
      <div
        ref={containerRef}
        aria-label="서울고 탐색 진입 화면"
        className="entry-exploration-scene"
      />
    </main>
  );
}
