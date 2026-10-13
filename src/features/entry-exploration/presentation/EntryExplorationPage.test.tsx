import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import * as THREE from "three";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { UseEntryExplorationThreeSceneOptions } from "../application/useEntryExplorationThreeScene";
import { EntryExplorationPage } from "./EntryExplorationPage";
import { AppToastProvider } from "@shared/ui/toast";
import { entryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import { loadEntryNumberRewards } from "../data/entryNumberRewardStorage";
import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { ENTRY_HANOK_PLACE, ENTRY_HANOK_PLACE_ID } from "../config/entryHanokPlace";
const FIRST_PLACE_ID = ENTRY_TEST_PLACES[0].id;
const SECOND_PLACE_ID = ENTRY_TEST_PLACES[1].id;
import type { EntrySlotState } from "../application/entrySlotInteraction";
import type { CreateEntryExplorationSceneInteractionControllersOptions } from "../application/createEntryExplorationSceneInteractionControllers";
import { createEntryNumberRewardStore } from "../application/entryNumberRewardStore";

let gridOptions: CreateEntryExplorationSceneInteractionControllersOptions;

let slotStateChange: ((state: EntrySlotState) => void) | undefined;
const slotRequestReward = vi.fn();
const slotClose = vi.fn();

vi.mock("../application/entrySlotInteraction", () => ({
  createEntrySlotInteraction: ({
    onStateChange,
  }: {
    onStateChange: (state: EntrySlotState) => void;
  }) => {
    slotStateChange = onStateChange;
    return {
      object: new THREE.Group(),
      requestReward: (digits: readonly number[]) => {
        slotRequestReward(digits);
        onStateChange({ status: "focusing" });
        return true;
      },
      setViewportBounds: vi.fn(),
      deactivate: () => {
        slotClose();
        onStateChange({ status: "closed" });
      },
      dispose: vi.fn(),
    };
  },
}));

let introStartHandler: UseEntryExplorationThreeSceneOptions["onIntroStart"];
let placeVisits: UseEntryExplorationThreeSceneOptions["placeVisits"];
let dismissPlaceFromBackground: UseEntryExplorationThreeSceneOptions["onPlacePanelDismiss"];

vi.mock("../application/createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn((options) => {
    gridOptions = options;

    return [];
  }),
}));

vi.mock("../application/useEntryExplorationThreeScene", () => ({
  useEntryExplorationThreeScene: ({
    createSceneInteractionControllers,
    onIntroStart,
    placeVisits: visits,
    onPlacePanelDismiss,
  }: UseEntryExplorationThreeSceneOptions) => {
    placeVisits = visits;
    introStartHandler = onIntroStart;
    dismissPlaceFromBackground = onPlacePanelDismiss;
    useEffect(() => {
      const controllers = createSceneInteractionControllers();
      return () => controllers.forEach((controller) => controller.dispose());
    }, [createSceneInteractionControllers]);
  },
}));

describe("EntryExplorationPage", () => {
  test("explains how to unlock the grid when entry is rejected", () => {
    renderEntryExplorationPage();
    startExploration();
    expect(gridOptions.getCollectedNumbers?.()).toEqual([]);
    act(() => gridOptions.onDartEntryBlocked?.());
    expect(screen.getByText("장소를 방문해 번호를 먼저 획득해 주세요")).toBeTruthy();
  });

  test("passes restored numbers and adds new numbers only after the slot result", () => {
    entryNumberRewardStore.setState({ rewards: [{ placeId: FIRST_PLACE_ID, number: 40 }] });
    renderEntryExplorationPage();
    startExploration();
    const getNumbers = gridOptions.getCollectedNumbers;
    expect(getNumbers?.()).toEqual([40]);
    act(() => placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 }));
    expect(getNumbers?.()).toEqual([40]);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    const reward = entryNumberRewardStore.getState().rewards[1];
    act(() => slotStateChange?.({ status: "result", result: String(reward.number) }));
    expect(getNumbers?.()).toEqual([40, reward.number]);
    expect(gridOptions.getCollectedNumbers).toBe(getNumbers);
  });

  test("restores an interrupted reward from session storage for grid entry without replaying", () => {
    const { unmount } = renderEntryExplorationPage();
    startExploration();
    act(() => placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 }));
    const savedNumber = loadEntryNumberRewards()[0].number;
    expect(gridOptions.getCollectedNumbers?.()).toEqual([]);
    unmount();

    const restoredStore = createEntryNumberRewardStore();
    entryNumberRewardStore.setState({ rewards: restoredStore.getState().rewards });
    renderEntryExplorationPage();
    startExploration();
    expect(gridOptions.getCollectedNumbers?.()).toEqual([savedNumber]);
    expect(screen.getByRole("button", { name: "내 번호 열기, 1개 획득" })).toBeTruthy();
    expect(slotRequestReward).not.toHaveBeenCalled();
  });

  test("shows an empty number panel only after starting exploration", () => {
    renderEntryExplorationPage();
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();

    startExploration();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" }));

    expect(screen.getByText("아직 획득한 번호가 없어요.")).toBeTruthy();
  });

  test("saves on first visit, spins after card dismissal, and reveals the saved number without retry", () => {
    const { router } = renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    const reward = entryNumberRewardStore.getState().rewards[0];
    expect(reward).toEqual({ placeId: FIRST_PLACE_ID, number: expect.any(Number) });
    expect(loadEntryNumberRewards()).toEqual([reward]);
    expect(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" })).toBeTruthy();
    expect(slotRequestReward).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).toHaveBeenCalledWith([
      Math.floor(reward.number / 10),
      reward.number % 10,
    ]);
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "돌리기" })).toBeNull();
    act(() => {
      slotStateChange?.({ status: "result", result: String(reward.number) });
    });
    expect(screen.getByRole("status", { name: "뽑힌 숫자" }).textContent).toBe(
      String(reward.number)
    );
    expect(screen.queryByRole("button", { name: "다시 돌리기" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    expect(slotClose).toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 1개 획득" }));
    expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toContain(
      String(reward.number)
    );
    expect(loadEntryNumberRewards()).toEqual([reward]);
    expect(router.state.location.pathname).toBe("/");
  });
  test("visiting hanok opens its panel but grants no reward and never starts the slot", () => {
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[ENTRY_HANOK_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    expect(screen.getByRole("dialog", { name: ENTRY_HANOK_PLACE.title })).toBeTruthy();
    expect(entryNumberRewardStore.getState().rewards).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
    act(() => {
      placeVisits?.[ENTRY_HANOK_PLACE_ID].update({ x: 10, z: 0 }, { x: 0, z: 0 });
      placeVisits?.[ENTRY_HANOK_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    expect(screen.getByRole("dialog", { name: ENTRY_HANOK_PLACE.title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(entryNumberRewardStore.getState().rewards).toEqual([]);
    expect(loadEntryNumberRewards()).toEqual([]);
    expect(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" })).toBeTruthy();
  });

  test("revisiting a rewarded place only opens its information card", () => {
    entryNumberRewardStore.setState({
      rewards: [{ placeId: FIRST_PLACE_ID, number: 40 }],
    });
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(entryNumberRewardStore.getState().rewards).toEqual([
      { placeId: FIRST_PLACE_ID, number: 40 },
    ]);
  });

  test("keeps an expanded list unchanged on a new visit until the slot presents its result", () => {
    entryNumberRewardStore.setState({ rewards: [{ placeId: FIRST_PLACE_ID, number: 40 }] });
    renderEntryExplorationPage();
    startExploration();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 1개 획득" }));
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    const saved = loadEntryNumberRewards();
    expect(saved).toHaveLength(2);
    expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toBe("추첨 번호40");
    expect(screen.getByLabelText(/1개 획득/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    act(() => {
      slotStateChange?.({ status: "result", result: String(saved[1].number) });
    });
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 2개 획득" }));
    expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toBe(
      `추첨 번호40추첨 번호${saved[1].number}`
    );
    expect(loadEntryNumberRewards()).toEqual(saved);
  });

  test("background dismissal presents the saved reward once, while revisits do not spin", () => {
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    const reward = entryNumberRewardStore.getState().rewards[0];
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
      expect(dismissPlaceFromBackground?.()).toBe(false);
    });
    expect(screen.queryByRole("dialog", { name: "해방촌신흥시장" })).toBeNull();
    expect(slotRequestReward).toHaveBeenCalledExactlyOnceWith([
      Math.floor(reward.number / 10),
      reward.number % 10,
    ]);
    act(() => {
      slotStateChange?.({ status: "result", result: String(reward.number) });
    });
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 0 }, { x: 0, z: 0 });
      placeVisits?.[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
    });
    expect(slotRequestReward).toHaveBeenCalledOnce();
    expect(entryNumberRewardStore.getState().rewards).toHaveLength(1);
  });

  test.each(["card", "spinning"])(
    "keeps the number but does not resume the slot after remounting during %s",
    (phase) => {
      const first = renderEntryExplorationPage();
      startExploration();
      act(() => {
        placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
      });
      if (phase === "spinning") fireEvent.click(screen.getByRole("button", { name: "닫기" }));
      const saved = loadEntryNumberRewards();
      expect(saved).toHaveLength(1);
      first.unmount();
      entryNumberRewardStore.setState({ rewards: saved });
      slotRequestReward.mockClear();
      renderEntryExplorationPage();
      expect(slotRequestReward).not.toHaveBeenCalled();
      startExploration();
      expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 1개 획득" }));
      expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toContain(
        String(saved[0].number)
      );
      act(() => {
        placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
      });
      fireEvent.click(screen.getByRole("button", { name: "닫기" }));
      expect(slotRequestReward).not.toHaveBeenCalled();
      expect(loadEntryNumberRewards()).toEqual(saved);
    }
  );
  beforeEach(() => {
    sessionStorage.clear();
    entryNumberRewardStore.setState({ rewards: [] });
    slotRequestReward.mockClear();
    slotClose.mockClear();
    slotStateChange = undefined;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      arc: vi.fn(),
      beginPath: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      lineWidth: 0,
      strokeRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("shows the exploration UI only after the scene reports the intro start", () => {
    renderEntryExplorationPage();
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();

    startExploration();

    expect(screen.getByRole("button", { name: /내 번호 열기/ })).toBeTruthy();
  });

  test("shows the tower panel on arrival and keeps manual dismissal until reentry", async () => {
    renderEntryExplorationPage();
    startExploration();
    expect(screen.queryByRole("dialog", { name: "리움미술관" })).toBeNull();
    const destination = { x: 10, z: 20 };
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update(destination, destination);
    });
    const panel = await screen.findByRole("dialog", { name: "리움미술관" });
    expect(panel.getAttribute("aria-modal")).not.toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "리움미술관" })).toBeNull());
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update(destination, destination);
    });
    expect(screen.queryByRole("dialog", { name: "리움미술관" })).toBeNull();
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update({ x: 20, z: 20 }, destination);
      placeVisits?.[SECOND_PLACE_ID].update(destination, destination);
    });
    expect(await screen.findByRole("dialog", { name: "리움미술관" })).toBeTruthy();
  });

  test("shows API place names, preserves dismissal, and switches to another place", async () => {
    renderEntryExplorationPage();
    startExploration();
    const hanok = { x: 10, z: 20 };
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update(hanok, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update(hanok, hanok);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 20 }, hanok);
      placeVisits?.[FIRST_PLACE_ID].update(hanok, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update({ x: 30, z: 20 }, { x: 30, z: 20 });
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 20 }, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "리움미술관" })).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("opens the hanok panel near the visible landmark area without requiring the exact center", async () => {
    renderEntryExplorationPage();
    startExploration();
    const hanok = { x: 10, z: 20 };

    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 13, z: 20 }, hanok);
    });

    expect(await screen.findByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
  });
});

function startExploration(): void {
  act(() => introStartHandler?.());
}

function renderEntryExplorationPage() {
  const router = createMemoryRouter([
    {
      element: (
        <EntryExplorationPage
          places={ENTRY_TEST_PLACES}
          renderPlacePanel={({ open, onClose, placeId }) =>
            open && (
              <div
                role="dialog"
                aria-label={
                  placeId === ENTRY_HANOK_PLACE_ID
                    ? ENTRY_HANOK_PLACE.title
                    : ENTRY_TEST_PLACES.find((place) => place.id === placeId)?.name
                }
              >
                <button onClick={onClose}>닫기</button>
              </div>
            )
          }
        />
      ),
      path: "/",
    },
    {
      element: <div>district exploration route</div>,
      path: "/exploration/districts/:districtId",
    },
  ]);

  return {
    ...render(
      <AppToastProvider>
        <RouterProvider router={router} />
      </AppToastProvider>
    ),
    router,
  };
}
