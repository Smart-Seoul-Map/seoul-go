import { useMemo } from "react";

import type { ProximityInteractionZone } from "@shared/lib/proximity/proximityInteraction";
import { useProximityInteractionController } from "@shared/lib/proximity/useProximityInteractionController";

import {
  ENTRY_EXPLORATION_SCENE_OBJECTS,
  type EntryExplorationInteractionType,
  type EntryExplorationSceneObject,
} from "../config/entryExplorationSceneObjects";
import {
  getEntryExplorationSceneDistance,
  type EntryExplorationScenePoint,
} from "../domain/entryExplorationSceneMath";

type EntryExplorationInteractionController = {
  activeInteractionType: EntryExplorationInteractionType | null;
  closeInteraction: () => void;
  detectInteractionAtPoint: (point: EntryExplorationScenePoint) => void;
  getHasActiveInteraction: () => boolean;
};

export function useEntryExplorationInteraction(
  sceneObjects: readonly EntryExplorationSceneObject[] = ENTRY_EXPLORATION_SCENE_OBJECTS
): EntryExplorationInteractionController {
  const zones = useMemo(
    () =>
      sceneObjects.flatMap<
        ProximityInteractionZone<EntryExplorationScenePoint, EntryExplorationInteractionType>
      >((object) => {
        if (!object.interaction) {
          return [];
        }

        return [
          {
            center: object.position,
            id: object.id,
            interactionId: object.interaction.type,
            radius: object.interaction.triggerRadius,
          },
        ];
      }),
    [sceneObjects]
  );
  const proximityInteraction = useProximityInteractionController({
    getDistance: getEntryExplorationSceneDistance,
    zones,
  });

  return {
    activeInteractionType: proximityInteraction.activeInteraction?.interactionId ?? null,
    closeInteraction: proximityInteraction.closeInteraction,
    detectInteractionAtPoint: proximityInteraction.detectInteractionAtPoint,
    getHasActiveInteraction: proximityInteraction.getHasActiveInteraction,
  };
}
