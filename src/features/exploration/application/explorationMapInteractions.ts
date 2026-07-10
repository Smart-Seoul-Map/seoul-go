type DisableableInteraction = {
  disable: () => void;
};

type ZoomLockableMap = {
  scrollZoom: DisableableInteraction;
  boxZoom: DisableableInteraction;
  doubleClickZoom: DisableableInteraction;
  touchZoomRotate: DisableableInteraction;
  keyboard: DisableableInteraction;
};

export function lockMapZoomInteractions(map: ZoomLockableMap): void {
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
  map.keyboard.disable();
}
