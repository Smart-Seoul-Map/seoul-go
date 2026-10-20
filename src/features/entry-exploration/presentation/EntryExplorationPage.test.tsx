import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect } from "react";
import * as THREE from "three";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { UseEntryExplorationThreeSceneOptions } from "../application/useEntryExplorationThreeScene";
import { EntryExplorationPage } from "./EntryExplorationPage";
import { AppToastProvider } from "@shared/ui/toast";
import { entryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import { loadEntryNumberRewards } from "../data/entryNumberRewardStorage";
import { ENTRY_TEST_PLACES } from "../testing/entryEditionFixtures";
import { ENTRY_HANOK_PLACE, ENTRY_HANOK_PLACE_ID } from "../config/entryHanokPlace";
import { ENTRY_CHARACTER_SPEECH_MESSAGES } from "../config/entryCharacterSpeechMessages";
const FIRST_PLACE_ID = ENTRY_TEST_PLACES[0].id;
const SECOND_PLACE_ID = ENTRY_TEST_PLACES[1].id;
const FIRST_REWARD = { placeId: FIRST_PLACE_ID, placeName: "해방촌신흥시장", east: 54, north: 49 };
const SECOND_REWARD = { placeId: SECOND_PLACE_ID, placeName: "리움미술관", east: 55, north: 48 };
const TOAST_MESSAGE = "번호를 추가했어요";
const DART_TOAST_ACTION = "다트게임하기";
import type { EntrySlotState } from "../application/entrySlotInteraction";
import type { CreateEntryExplorationSceneInteractionControllersOptions } from "../application/createEntryExplorationSceneInteractionControllers";
import { createEntryNumberRewardStore } from "../application/entryNumberRewardStore";

let gridOptions: CreateEntryExplorationSceneInteractionControllersOptions;

const slotRequestReward = vi.fn();

vi.mock("../application/entrySlotInteraction", () => ({
  createEntrySlotInteraction: ({
    onStateChange,
  }: {
    onStateChange: (state: EntrySlotState) => void;
  }) => ({
    object: new THREE.Group(),
    requestReward: (digits: readonly number[]) => {
      slotRequestReward(digits);
      onStateChange({ status: "focusing" });
      return true;
    },
    setViewportBounds: vi.fn(),
    deactivate: () => onStateChange({ status: "closed" }),
    dispose: vi.fn(),
  }),
}));

let introStartHandler: UseEntryExplorationThreeSceneOptions["onIntroStart"];
let placeVisits: UseEntryExplorationThreeSceneOptions["placeVisits"];
let dismissPlaceFromBackground: UseEntryExplorationThreeSceneOptions["onPlacePanelDismiss"];
let characterMovingChange: UseEntryExplorationThreeSceneOptions["onCharacterMovingChange"];
let speechAnchor: UseEntryExplorationThreeSceneOptions["characterSpeechAnchor"];

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
    onCharacterMovingChange,
    characterSpeechAnchor,
  }: UseEntryExplorationThreeSceneOptions) => {
    placeVisits = visits;
    introStartHandler = onIntroStart;
    dismissPlaceFromBackground = onPlacePanelDismiss;
    characterMovingChange = onCharacterMovingChange;
    speechAnchor = characterSpeechAnchor;
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

  test("passes restored numbers to the dart and adds new numbers only after the place panel closes", () => {
    entryNumberRewardStore.setState({ rewards: [FIRST_REWARD] });
    renderEntryExplorationPage();
    startExploration();
    const getNumbers = gridOptions.getCollectedNumbers;
    expect(getNumbers?.()).toEqual([54, 49]);
    act(() => placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 }));
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD, SECOND_REWARD]);
    expect(getNumbers?.()).toEqual([54, 49]);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(getNumbers?.()).toEqual([54, 49, 55, 48]);
    expect(gridOptions.getCollectedNumbers).toBe(getNumbers);
  });

  test("lists every place row but passes a shared number to the dart once", () => {
    entryNumberRewardStore.setState({
      rewards: [
        FIRST_REWARD,
        {
          placeId: "smart-seoul:1786321258890:26_edition25_24",
          placeName: "을지로 골목",
          east: 55,
          north: 52,
        },
        {
          placeId: "smart-seoul:1786321258890:26_edition25_23",
          placeName: "서순라길",
          east: 55,
          north: 52,
        },
      ],
    });
    renderEntryExplorationPage();
    startExploration();
    expect(gridOptions.getCollectedNumbers?.()).toEqual([54, 49, 55, 52]);
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 6개 획득" }));
    expect(getNumberRowTexts()).toEqual([
      "해방촌신흥시장|54",
      "해방촌신흥시장|49",
      "을지로 골목|55",
      "을지로 골목|52",
      "서순라길|55",
      "서순라길|52",
    ]);
  });

  test("restores a reward saved before the panel closed without a toast after remounting", () => {
    const first = renderEntryExplorationPage();
    startExploration();
    act(() => placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 }));
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD]);
    expect(gridOptions.getCollectedNumbers?.()).toEqual([]);
    first.unmount();

    entryNumberRewardStore.setState({ rewards: createEntryNumberRewardStore().getState().rewards });
    renderEntryExplorationPage();
    startExploration();
    expect(gridOptions.getCollectedNumbers?.()).toEqual([54, 49]);
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 2개 획득" }));
    expect(getNumberRowTexts()).toEqual(["해방촌신흥시장|54", "해방촌신흥시장|49"]);
    act(() => placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 }));
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD]);
  });

  test("shows an empty number panel only after starting exploration", () => {
    renderEntryExplorationPage();
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();

    startExploration();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" }));

    expect(screen.getByText("아직 획득한 번호가 없어요.")).toBeTruthy();
  });

  test("saves on first visit and shows the toast and place rows when the panel closes without the slot", () => {
    const { router } = renderEntryExplorationPage();
    startExploration();
    act(() => characterMovingChange?.(false));
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(entryNumberRewardStore.getState().rewards).toEqual([FIRST_REWARD]);
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD]);
    expect(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" })).toBeTruthy();
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    const toastMessage = screen.getByText(TOAST_MESSAGE);
    expect(toastMessage.closest(".AppToast")?.getAttribute("data-status")).toBe("success");
    expect(screen.getByRole("button", { name: DART_TOAST_ACTION })).toBeTruthy();
    expect(screen.getByRole("button", { name: "내 번호 접기, 2개 획득" })).toBeTruthy();
    expect(getNumberRowTexts()).toEqual(["해방촌신흥시장|54", "해방촌신흥시장|49"]);
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "숫자 슬롯" })).toBeNull();
    expect(getSpeechText()).toContain(ENTRY_CHARACTER_SPEECH_MESSAGES.intro);
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD]);
    expect(router.state.location.pathname).toBe("/");
  });

  test("toast action closes an open place panel and requests the dart view with one visited place", () => {
    renderEntryExplorationPage();
    startExploration();
    const dartViewControls = registerDartViewControls();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(gridOptions.getCollectedNumbers?.()).toEqual([54, 49]);
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 20 }, { x: 10, z: 20 });
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    expect(dartViewControls.requestApproach).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: DART_TOAST_ACTION }));

    expect(screen.queryByRole("dialog", { name: "해방촌신흥시장" })).toBeNull();
    expect(dartViewControls.requestApproach).toHaveBeenCalledOnce();
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(screen.queryByRole("button", { name: DART_TOAST_ACTION })).toBeNull();
    expect(entryNumberRewardStore.getState().rewards).toEqual([FIRST_REWARD]);
  });

  test("toast action over another pending place adds its numbers without a second toast", () => {
    renderEntryExplorationPage();
    startExploration();
    const dartViewControls = registerDartViewControls();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "리움미술관" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: DART_TOAST_ACTION }));

    expect(screen.queryByRole("dialog", { name: "리움미술관" })).toBeNull();
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(gridOptions.getCollectedNumbers?.()).toEqual([54, 49, 55, 48]);
    expect(dartViewControls.requestApproach).toHaveBeenCalledOnce();
  });

  test("revisiting a place rewarded in this session adds no number and shows no toast", () => {
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    fireEvent.click(screen.getByRole("button", { name: DART_TOAST_ACTION }));
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();

    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 20 }, { x: 10, z: 20 });
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(screen.queryByRole("button", { name: DART_TOAST_ACTION })).toBeNull();
    expect(entryNumberRewardStore.getState().rewards).toEqual([FIRST_REWARD]);
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD]);
    expect(screen.getByRole("button", { name: /2개 획득/ })).toBeTruthy();
    expect(slotRequestReward).not.toHaveBeenCalled();
  });

  test("collapses the automatically opened number panel when the character starts moving", () => {
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.getByRole("button", { name: "내 번호 접기, 2개 획득" })).toBeTruthy();

    act(() => characterMovingChange?.(true));
    expect(screen.getByRole("button", { name: "내 번호 열기, 2개 획득" })).toBeTruthy();

    act(() => characterMovingChange?.(false));
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 2개 획득" }));
    act(() => characterMovingChange?.(true));
    expect(screen.getByRole("button", { name: "내 번호 접기, 2개 획득" })).toBeTruthy();
  });

  test("visiting hanok opens its panel but grants no reward and shows neither a toast nor the slot", () => {
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
    expect(screen.queryByRole("button", { name: DART_TOAST_ACTION })).toBeNull();
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

  test("revisiting a place restored from storage only opens its information card", () => {
    entryNumberRewardStore.setState({ rewards: [FIRST_REWARD] });
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "해방촌신흥시장" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    expect(screen.queryByRole("button", { name: DART_TOAST_ACTION })).toBeNull();
    expect(entryNumberRewardStore.getState().rewards).toEqual([FIRST_REWARD]);
  });

  test("keeps an expanded list unchanged on a new visit until the place panel closes", () => {
    entryNumberRewardStore.setState({ rewards: [FIRST_REWARD] });
    renderEntryExplorationPage();
    startExploration();
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 2개 획득" }));
    act(() => {
      placeVisits?.[SECOND_PLACE_ID].update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD, SECOND_REWARD]);
    expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toBe(
      "해방촌신흥시장|54해방촌신흥시장|49"
    );
    expect(screen.getByLabelText(/2개 획득/)).toBeTruthy();
    expect(screen.queryByText(TOAST_MESSAGE)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.getByText(TOAST_MESSAGE)).toBeTruthy();
    expect(screen.getByRole("button", { name: "내 번호 접기, 4개 획득" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "획득한 숫자" }).textContent).toBe(
      "해방촌신흥시장|54해방촌신흥시장|49리움미술관|55리움미술관|48"
    );
    expect(loadEntryNumberRewards()).toEqual([FIRST_REWARD, SECOND_REWARD]);
  });

  test("background dismissal shows the reward toast once, while revisits add nothing", () => {
    renderEntryExplorationPage();
    startExploration();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
      expect(dismissPlaceFromBackground?.()).toBe(false);
    });
    expect(screen.queryByRole("dialog", { name: "해방촌신흥시장" })).toBeNull();
    expect(screen.getByText(TOAST_MESSAGE)).toBeTruthy();
    expect(screen.getByRole("button", { name: "내 번호 접기, 2개 획득" })).toBeTruthy();
    act(() => {
      placeVisits?.[FIRST_PLACE_ID].update({ x: 30, z: 0 }, { x: 0, z: 0 });
      placeVisits?.[FIRST_PLACE_ID].update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
    });
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(entryNumberRewardStore.getState().rewards).toEqual([FIRST_REWARD]);
    expect(screen.getByRole("button", { name: /2개 획득/ })).toBeTruthy();
  });

  beforeEach(() => {
    sessionStorage.clear();
    entryNumberRewardStore.setState({ rewards: [] });
    slotRequestReward.mockClear();
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

function getNumberRowTexts(): (string | null)[] {
  return within(screen.getByRole("list", { name: "획득한 숫자" }))
    .getAllByRole("listitem")
    .map((row) => row.textContent);
}

function getSpeechText(): string {
  return (speechAnchor as CSS2DObject | undefined)?.element.textContent ?? "";
}

function registerDartViewControls() {
  const controls = {
    requestApproach: vi.fn(),
    resetThrow: vi.fn(),
    setHitCell: vi.fn(),
    throwAtRandomCell: vi.fn(),
  };
  act(() => gridOptions.onDartViewControlsReady?.(controls));
  return controls;
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
