import { describe, expect, test, vi } from "vitest";

import { disableExplorationMapDragInteractions } from "./explorationMapInteractions";

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
});
