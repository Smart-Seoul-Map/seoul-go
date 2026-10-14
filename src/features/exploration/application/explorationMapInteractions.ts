import type { Map as MapLibreMap } from "maplibre-gl";

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

const MOUSE_WHEEL_NOTCH = 120;

export function blockExplorationMapTrackpadWheel(container: HTMLElement): () => void {
  const handleWheel = (event: WheelEvent) => {
    const { wheelDeltaY } = event as WheelEvent & { wheelDeltaY: number };
    const isTrackpadWheel = event.ctrlKey || wheelDeltaY % MOUSE_WHEEL_NOTCH !== 0;

    if (!isTrackpadWheel) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  container.addEventListener("wheel", handleWheel, { capture: true, passive: false });

  return () => container.removeEventListener("wheel", handleWheel, { capture: true });
}

export function setExplorationMapZoomEnabled(map: MapLibreMap, enabled: boolean): void {
  if (enabled) {
    map.scrollZoom.enable({ around: "center" });
    Reflect.deleteProperty(map, "zoomIn");
    Reflect.deleteProperty(map, "zoomOut");

    return;
  }

  map.scrollZoom.disable();
  map.zoomIn = () => map;
  map.zoomOut = () => map;
}
