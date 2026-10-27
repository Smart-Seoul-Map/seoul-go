import {
  getEntryExplorationSceneDistance,
  type EntryExplorationScenePoint,
} from "./entryExplorationSceneMath";

type PlaceVisitOptions = {
  radius: number;
  onOpenChange: (open: boolean) => void;
};

export type EntryExplorationPlaceVisit = ReturnType<typeof createEntryExplorationPlaceVisit>;

type PlaceVisitTarget = {
  visit: EntryExplorationPlaceVisit;
  destination: EntryExplorationScenePoint;
};

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
  // Closed by the user while inside; stays closed until the character leaves the radius.
  let isDismissed = false;
  let isOpen = false;

  const changeOpen = (nextOpen: boolean): void => {
    if (isOpen === nextOpen) return;
    isOpen = nextOpen;
    onOpenChange(nextOpen);
  };

  const updateInside = (
    position: EntryExplorationScenePoint,
    destination: EntryExplorationScenePoint
  ): void => {
    isInside = isWithinArrivalRadius({ position, destination, radius });
    if (!isInside) isDismissed = false;
  };

  return {
    update(position: EntryExplorationScenePoint, destination: EntryExplorationScenePoint): boolean {
      updateInside(position, destination);
      const wasOpen = isOpen;
      changeOpen(isInside && !isDismissed);
      return isOpen && !wasOpen;
    },
    // Follows the arrival area while another place holds the panel; closing here is not a dismissal.
    updateClosed(
      position: EntryExplorationScenePoint,
      destination: EntryExplorationScenePoint
    ): void {
      updateInside(position, destination);
      changeOpen(false);
    },
    dismiss() {
      // Keep the visit active so closing does not reopen the panel on the next frame.
      // A panel that was never shown is not dismissed, so it can still open once it becomes the closest.
      if (isOpen) isDismissed = true;
      changeOpen(false);
    },
    reset() {
      isInside = false;
      isDismissed = false;
      changeOpen(false);
    },
  };
}

// Only the closest target may open; the others keep following their arrival areas without opening.
export function updateClosestEntryExplorationPlaceVisit(
  position: EntryExplorationScenePoint,
  targets: readonly PlaceVisitTarget[]
): boolean {
  const closest = targets.reduce<PlaceVisitTarget | null>((nearest, target) => {
    if (!nearest) return target;
    const isCloser =
      getEntryExplorationSceneDistance(position, target.destination) <
      getEntryExplorationSceneDistance(position, nearest.destination);

    return isCloser ? target : nearest;
  }, null);

  targets.forEach((target) => {
    if (target !== closest) target.visit.updateClosed(position, target.destination);
  });

  return closest?.visit.update(position, closest.destination) ?? false;
}
