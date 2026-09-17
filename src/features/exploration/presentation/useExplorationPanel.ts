import { useCallback, useRef, useState } from "react";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";

type PanelContent = { type: "place"; place: ExplorationPlaceMarkerSelection } | { type: "course" };
type PanelInstance = PanelContent & { instance: number };

type PanelState =
  | { status: "closed" }
  | { status: "open"; content: PanelInstance }
  | { status: "closing"; content: PanelInstance; next: PanelInstance | null };

export function useExplorationPanel() {
  const [state, setState] = useState<PanelState>({ status: "closed" });
  const instance = useRef(0);
  const openPanel = useCallback((content: PanelContent) => {
    const next = { ...content, instance: ++instance.current };
    setState((previous) => {
      if (previous.status === "closed") return { status: "open", content: next };
      return { status: "closing", content: previous.content, next };
    });
  }, []);
  const closePanel = useCallback(() => {
    setState((previous) =>
      previous.status === "closed"
        ? previous
        : { status: "closing", content: previous.content, next: null }
    );
  }, []);
  const finishExit = useCallback(() => {
    setState((previous) => {
      if (previous !== state || previous.status !== "closing") return previous;
      return previous.next ? { status: "open", content: previous.next } : { status: "closed" };
    });
  }, [state]);

  return { state, openPanel, closePanel, finishExit };
}
