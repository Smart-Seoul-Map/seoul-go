type DisableableInteraction = {
  disable: () => void;
};

type DragLockableMap = {
  boxZoom: DisableableInteraction;
  dragPan: DisableableInteraction;
  dragRotate: DisableableInteraction;
};

export function disableExplorationMapDragInteractions(map: DragLockableMap): void {
  map.boxZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
}
