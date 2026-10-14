import { describe, expect, test, vi } from "vitest";

import {
  blockExplorationMapTrackpadWheel,
  disableExplorationMapDragInteractions,
  setExplorationMapZoomEnabled,
} from "./explorationMapInteractions";

function createZoomLockableMap() {
  const nativeZoom = { zoomIn: vi.fn(), zoomOut: vi.fn() };
  const map = Object.create(nativeZoom) as typeof nativeZoom & {
    scrollZoom: { disable: ReturnType<typeof vi.fn>; enable: ReturnType<typeof vi.fn> };
  };

  map.scrollZoom = { disable: vi.fn(), enable: vi.fn() };

  return { map, nativeZoom };
}

describe("탐색 지도 인터랙션", () => {
  test("지도 드래그 이동과 회전 인터랙션만 비활성화한다", () => {
    const map = {
      boxZoom: { disable: vi.fn() },
      dragPan: { disable: vi.fn() },
      dragRotate: { disable: vi.fn() },
    };

    disableExplorationMapDragInteractions(map);

    expect(map.boxZoom.disable).toHaveBeenCalledOnce();
    expect(map.dragPan.disable).toHaveBeenCalledOnce();
    expect(map.dragRotate.disable).toHaveBeenCalledOnce();
  });

  test("줌을 막으면 휠과 컨트롤 버튼이 함께 멈춘다", () => {
    const { map, nativeZoom } = createZoomLockableMap();

    setExplorationMapZoomEnabled(map as never, false);
    map.zoomIn();
    map.zoomOut();

    expect(map.scrollZoom.disable).toHaveBeenCalledOnce();
    expect(nativeZoom.zoomIn).not.toHaveBeenCalled();
    expect(nativeZoom.zoomOut).not.toHaveBeenCalled();
  });

  test("줌을 허용하면 휠이 지도 중심을 기준으로 돌고 버튼이 원래 동작으로 돌아온다", () => {
    const { map, nativeZoom } = createZoomLockableMap();

    setExplorationMapZoomEnabled(map as never, false);
    setExplorationMapZoomEnabled(map as never, true);
    map.zoomIn();

    expect(map.scrollZoom.enable).toHaveBeenCalledWith({ around: "center" });
    expect(nativeZoom.zoomIn).toHaveBeenCalledOnce();
  });
});

describe("blockExplorationMapTrackpadWheel", () => {
  function dispatchWheel(container: HTMLElement, init: { ctrlKey?: boolean; wheelDeltaY: number }) {
    const event = new WheelEvent("wheel", { cancelable: true, ctrlKey: init.ctrlKey });
    Object.defineProperty(event, "wheelDeltaY", { value: init.wheelDeltaY });
    container.dispatchEvent(event);

    return event;
  }

  test("blocks trackpad pinch and swipe", () => {
    const container = document.createElement("div");
    blockExplorationMapTrackpadWheel(container);

    expect(dispatchWheel(container, { ctrlKey: true, wheelDeltaY: 120 }).defaultPrevented).toBe(
      true
    );
    expect(dispatchWheel(container, { wheelDeltaY: -37 }).defaultPrevented).toBe(true);
  });

  test("lets mouse wheel notches through", () => {
    const container = document.createElement("div");
    blockExplorationMapTrackpadWheel(container);

    expect(dispatchWheel(container, { wheelDeltaY: -120 }).defaultPrevented).toBe(false);
  });

  test("stops blocking after the listener is removed", () => {
    const container = document.createElement("div");
    blockExplorationMapTrackpadWheel(container)();

    expect(dispatchWheel(container, { wheelDeltaY: -37 }).defaultPrevented).toBe(false);
  });
});
