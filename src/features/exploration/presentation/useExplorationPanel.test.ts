import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";

import { useExplorationPanel } from "./useExplorationPanel";

test("keeps one panel until its exit completes and ignores stale exit callbacks", () => {
  const { result } = renderHook(useExplorationPanel);
  act(() => result.current.openPanel({ type: "course" }));
  expect(result.current.state.status).toBe("open");
  act(() => result.current.closePanel());
  const staleFinish = result.current.finishExit;
  expect(result.current.state.status).toBe("closing");
  act(() => result.current.openPanel({ type: "course" }));
  act(staleFinish);
  expect(result.current.state.status).toBe("closing");
  act(() => result.current.finishExit());
  expect(result.current.state.status).toBe("open");
  act(() => result.current.closePanel());
  act(() => result.current.finishExit());
  expect(result.current.state.status).toBe("closed");
});

test("map dismissal cancels a queued panel switch", () => {
  const { result } = renderHook(useExplorationPanel);
  act(() => result.current.openPanel({ type: "course" }));
  act(() => result.current.openPanel({ type: "course" }));
  act(() => result.current.closePanel());
  act(() => result.current.finishExit());
  expect(result.current.state.status).toBe("closed");
});
