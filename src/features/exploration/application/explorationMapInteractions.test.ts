import { describe, expect, test, vi } from "vitest";

import { lockMapZoomInteractions } from "./explorationMapInteractions";

describe("탐색 지도 인터랙션", () => {
  test("확대/축소 관련 MapLibre 인터랙션을 비활성화한다", () => {
    const map = {
      scrollZoom: { disable: vi.fn() },
      boxZoom: { disable: vi.fn() },
      doubleClickZoom: { disable: vi.fn() },
      touchZoomRotate: { disable: vi.fn() },
      keyboard: { disable: vi.fn() },
    };

    lockMapZoomInteractions(map);

    expect(map.scrollZoom.disable).toHaveBeenCalledOnce();
    expect(map.boxZoom.disable).toHaveBeenCalledOnce();
    expect(map.doubleClickZoom.disable).toHaveBeenCalledOnce();
    expect(map.touchZoomRotate.disable).toHaveBeenCalledOnce();
    expect(map.keyboard.disable).toHaveBeenCalledOnce();
  });
});
