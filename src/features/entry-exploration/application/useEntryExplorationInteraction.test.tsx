import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { EntryExplorationSceneObject } from "../config/entryExplorationSceneObjects";
import { useEntryExplorationInteraction } from "./useEntryExplorationInteraction";

const INTERACTIVE_OBJECTS: readonly EntryExplorationSceneObject[] = [
  {
    assetKey: "subwayEventMarker",
    id: "subway-selection-event-marker",
    interaction: {
      triggerRadius: 1.5,
      type: "subwaySelection",
    },
    position: { x: 6, z: 4 },
    rotationY: 0,
    size: { width: 3, depth: 3 },
    type: "floorOverlay",
    yOffset: 0.05,
  },
];

describe("useEntryExplorationInteraction", () => {
  test("activates an interaction when entering its trigger radius", () => {
    const { result } = renderHook(() => useEntryExplorationInteraction(INTERACTIVE_OBJECTS));

    act(() => {
      result.current.detectInteractionAtPoint({ x: 6, z: 4 });
    });

    expect(result.current.activeInteractionType).toBe("subwaySelection");
    expect(result.current.getHasActiveInteraction()).toBe(true);
  });

  test("rearms only after leaving the trigger radius", () => {
    const { result } = renderHook(() => useEntryExplorationInteraction(INTERACTIVE_OBJECTS));

    act(() => {
      result.current.detectInteractionAtPoint({ x: 6, z: 4 });
      result.current.closeInteraction();
      result.current.detectInteractionAtPoint({ x: 6, z: 4 });
    });
    expect(result.current.activeInteractionType).toBeNull();

    act(() => {
      result.current.detectInteractionAtPoint({ x: 0, z: 0 });
      result.current.detectInteractionAtPoint({ x: 6, z: 4 });
    });
    expect(result.current.activeInteractionType).toBe("subwaySelection");
  });
});
