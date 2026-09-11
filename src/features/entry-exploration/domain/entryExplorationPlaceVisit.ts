import {
  getEntryExplorationSceneDistance,
  type EntryExplorationScenePoint,
} from "./entryExplorationSceneMath";

type PlaceVisitOptions = {
  radius: number;
  onOpenChange: (open: boolean) => void;
};

export type EntryExplorationPlaceVisit = ReturnType<typeof createEntryExplorationPlaceVisit>;

function isWithinArrivalRadius({
  position,
  destination,
  radius,
}: {
  position: EntryExplorationScenePoint;
  destination: EntryExplorationScenePoint;
  radius: number;
}): boolean {
  return getEntryExplorationSceneDistance(position, destination) <= radius;
}

export function createEntryExplorationPlaceVisit({ radius, onOpenChange }: PlaceVisitOptions) {
  let isInside = false;
  let isOpen = false;

  const changeOpen = (nextOpen: boolean): void => {
    if (isOpen === nextOpen) return;
    isOpen = nextOpen;
    onOpenChange(nextOpen);
  };

  return {
    update(position: EntryExplorationScenePoint, destination: EntryExplorationScenePoint): boolean {
      const nextInside = isWithinArrivalRadius({ position, destination, radius });
      const isSameVisitAreaState = nextInside === isInside;

      if (isSameVisitAreaState) {
        return false;
      }

      isInside = nextInside;
      changeOpen(nextInside);
      return nextInside;
    },
    dismiss() {
      // Keep the visit active so closing does not reopen the panel on the next frame.
      changeOpen(false);
    },
    reset() {
      isInside = false;
      changeOpen(false);
    },
  };
}
