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
