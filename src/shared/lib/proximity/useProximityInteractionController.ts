import { useCallback, useRef, useState } from "react";

import { getProximityZonesAtPoint, type ProximityInteractionZone } from "./proximityInteraction";

export type ActiveProximityInteraction<TInteractionId extends string> = {
  interactionId: TInteractionId;
  zoneId: string;
};

type ProximityInteractionControllerOptions<TPosition, TInteractionId extends string> = {
  getDistance: (from: TPosition, to: TPosition) => number;
  isInsideZone?: (
    point: TPosition,
    zone: ProximityInteractionZone<TPosition, TInteractionId>
  ) => boolean;
  zones: readonly ProximityInteractionZone<TPosition, TInteractionId>[];
};

type ProximityInteractionController<TPosition, TInteractionId extends string> = {
  activeInteraction: ActiveProximityInteraction<TInteractionId> | null;
  closeInteraction: () => void;
  detectInteractionAtPoint: (point: TPosition) => void;
  getHasActiveInteraction: () => boolean;
};

export function useProximityInteractionController<TPosition, TInteractionId extends string>({
  getDistance,
  isInsideZone,
  zones,
}: ProximityInteractionControllerOptions<
  TPosition,
  TInteractionId
>): ProximityInteractionController<TPosition, TInteractionId> {
  const activeInteractionRef = useRef<ActiveProximityInteraction<TInteractionId> | null>(null);
  const suppressedZoneIdsRef = useRef(new Set<string>());
  const [activeInteraction, setActiveInteraction] =
    useState<ActiveProximityInteraction<TInteractionId> | null>(null);

  const detectInteractionAtPoint = useCallback(
    (point: TPosition) => {
      const containingZones = isInsideZone
        ? zones.filter((zone) => isInsideZone(point, zone))
        : getProximityZonesAtPoint({
            getDistance,
            point,
            zones,
          });
      const containingZoneIds = new Set(containingZones.map((zone) => zone.id));

      suppressedZoneIdsRef.current.forEach((zoneId) => {
        if (!containingZoneIds.has(zoneId)) {
          suppressedZoneIdsRef.current.delete(zoneId);
        }
      });

      if (activeInteractionRef.current) {
        return;
      }

      const enteredZone = containingZones.find(
        (zone) => !suppressedZoneIdsRef.current.has(zone.id)
      );

      if (!enteredZone) {
        return;
      }

      const nextInteraction = {
        interactionId: enteredZone.interactionId,
        zoneId: enteredZone.id,
      };

      suppressedZoneIdsRef.current.add(enteredZone.id);
      activeInteractionRef.current = nextInteraction;
      setActiveInteraction(nextInteraction);
    },
    [getDistance, isInsideZone, zones]
  );

  const closeInteraction = useCallback(() => {
    activeInteractionRef.current = null;
    setActiveInteraction(null);
  }, []);

  const getHasActiveInteraction = useCallback(() => activeInteractionRef.current !== null, []);

  return {
    activeInteraction,
    closeInteraction,
    detectInteractionAtPoint,
    getHasActiveInteraction,
  };
}
