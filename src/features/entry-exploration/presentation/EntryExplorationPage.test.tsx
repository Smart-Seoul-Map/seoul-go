import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import * as THREE from "three";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { EntryExplorationDistrictSelectionResult } from "../application/entryExplorationDistrictJumpSelectionInteraction";
import type { SubwayStationAvailabilityStatus } from "../application/subwayStationAvailability";
import type { EntryExplorationSubwaySelectionViewModel } from "../application/useEntryExplorationSubwaySelection";
import type {
  EntryExplorationThreeSceneControls,
  UseEntryExplorationThreeSceneOptions,
} from "../application/useEntryExplorationThreeScene";
import { EntryExplorationPage } from "./EntryExplorationPage";
import { AppToastProvider } from "@shared/ui/toast";
import { entryNumberRewardStore } from "../application/useEntryNumberRewardStore";
import { loadEntryNumberRewards } from "../data/entryNumberRewardStorage";
import { ENTRY_EXPLORATION_PLACES } from "../config/entryExplorationPlace";
import type { EntrySlotState } from "../application/entrySlotInteraction";

let slotStateChange: ((state: EntrySlotState) => void) | undefined;
const slotRequestReward = vi.fn();
const slotClose = vi.fn();
const createSubwayControllers = () => [];

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

const sceneControls = {
  deactivateActiveInteraction: vi.fn(),
  isIntroReady: true,
  retryActiveInteraction: vi.fn(),
  startIntro: vi.fn(() => true),
} satisfies EntryExplorationThreeSceneControls;

let districtSelectionResultHandler:
  ((result: EntryExplorationDistrictSelectionResult) => void) | null = null;
let placeVisits: UseEntryExplorationThreeSceneOptions["placeVisits"];
let dismissPlaceFromBackground: UseEntryExplorationThreeSceneOptions["onPlacePanelDismiss"];
const subwaySelectionViewModel: EntryExplorationSubwaySelectionViewModel = {
  handleClose: vi.fn(),
  handleStationSelection: vi.fn(),
  isActive: false,
  isCameraReady: true,
  selectedStation: null,
  status: "idle",
};

vi.mock("../application/createEntryExplorationSceneInteractionControllers", () => ({
  createEntryExplorationSceneInteractionControllers: vi.fn(({ onDistrictSelectionResult }) => {
    districtSelectionResultHandler = onDistrictSelectionResult;

    return [];
  }),
}));

vi.mock("../application/useEntryExplorationThreeScene", () => ({
  useEntryExplorationThreeScene: ({
    createSceneInteractionControllers,
    onSceneControlsReady,
    placeVisits: visits,
    onPlacePanelDismiss,
  }: UseEntryExplorationThreeSceneOptions) => {
    placeVisits = visits;
    dismissPlaceFromBackground = onPlacePanelDismiss;
    useEffect(() => {
      const controllers = createSceneInteractionControllers();
      return () => controllers.forEach((controller) => controller.dispose());
    }, [createSceneInteractionControllers]);
    useEffect(() => {
      onSceneControlsReady?.(sceneControls);
    }, [onSceneControlsReady]);
  },
}));

vi.mock("../application/useEntryExplorationSubwaySelection", () => ({
  useEntryExplorationSubwaySelection: () => ({
    createSubwayInteractionControllers: createSubwayControllers,
    subwaySelection: subwaySelectionViewModel,
  }),
}));

describe("EntryExplorationPage", () => {
  test("shows an empty number panel only after starting exploration", () => {
    renderEntryExplorationPage();
    expect(screen.queryByRole("button", { name: /내 번호 열기/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    fireEvent.click(screen.getByRole("button", { name: "내 번호 열기, 0개 획득" }));

    expect(screen.getByText("아직 획득한 번호가 없어요.")).toBeTruthy();
  });

  test("saves on first visit, spins after card dismissal, and reveals the saved number without retry", () => {
    const { router } = renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    act(() => {
      placeVisits?.hanok.update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    const reward = entryNumberRewardStore.getState().rewards[0];
    expect(reward.revealed).toBe(false);
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
    expect(loadEntryNumberRewards()[0].revealed).toBe(true);
    expect(router.state.location.pathname).toBe("/");
  });
  test("revisiting a revealed place only opens its information card", () => {
    entryNumberRewardStore.setState({
      rewards: [{ placeId: "hanok", number: 40, revealed: true }],
    });
    renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    act(() => {
      placeVisits?.hanok.update({ x: 10, z: 20 }, { x: 10, z: 20 });
    });
    expect(screen.getByRole("dialog", { name: "한옥체험" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(slotRequestReward).not.toHaveBeenCalled();
    expect(entryNumberRewardStore.getState().rewards).toEqual([
      { placeId: "hanok", number: 40, revealed: true },
    ]);
  });

  test("background dismissal presents the saved reward once, while revisits do not spin", () => {
    renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    act(() => {
      placeVisits?.hanok.update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    const reward = entryNumberRewardStore.getState().rewards[0];
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
      expect(dismissPlaceFromBackground?.()).toBe(false);
    });
    expect(screen.queryByRole("dialog", { name: "한옥체험" })).toBeNull();
    expect(slotRequestReward).toHaveBeenCalledExactlyOnceWith([
      Math.floor(reward.number / 10),
      reward.number % 10,
    ]);
    act(() => {
      slotStateChange?.({ status: "result", result: String(reward.number) });
    });
    fireEvent.click(screen.getByRole("button", { name: "슬롯 닫기" }));
    act(() => {
      placeVisits?.hanok.update({ x: 30, z: 0 }, { x: 0, z: 0 });
      placeVisits?.hanok.update({ x: 0, z: 0 }, { x: 0, z: 0 });
    });
    act(() => {
      expect(dismissPlaceFromBackground?.()).toBe(true);
    });
    expect(slotRequestReward).toHaveBeenCalledOnce();
    expect(entryNumberRewardStore.getState().rewards).toHaveLength(1);
  });

  test("resumes an unrevealed saved reward after starting instead of drawing again", () => {
    entryNumberRewardStore.setState({
      rewards: [{ placeId: "tower", number: 65, revealed: false }],
    });
    renderEntryExplorationPage();
    expect(slotRequestReward).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    expect(slotRequestReward).toHaveBeenCalledWith([6, 5]);
    expect(entryNumberRewardStore.getState().rewards).toHaveLength(1);
  });
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

  test("shows selected district result and restores normal exploration when back action is clicked", () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    expect(screen.getByRole("dialog", { name: "용산구 선택" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "일반 탐방으로 돌아가기" }));

    expect(sceneControls.deactivateActiveInteraction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("retries district selection from the result dialog", () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "다시 선택하기" }));

    expect(sceneControls.retryActiveInteraction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "용산구 선택" })).toBeNull();
  });

  test("navigates to selected district exploration path from the result dialog", async () => {
    renderEntryExplorationPage();

    act(() => {
      districtSelectionResultHandler?.({
        districtId: 8,
        districtName: "용산구",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "탐방하기" }));

    expect(await screen.findByText("district exploration route")).toBeTruthy();
  });

  test("navigates to the main exploration map at the selected subway station", async () => {
    const selectedStation = {
      address: "서울특별시 중구 세종대로 지하 101",
      diagramPosition: { x: 46.73, y: 15.28 },
      id: "201",
      name: "시청",
      stationGeoPosition: { lat: 37.564718, lng: 126.977108 },
    };
    const { router } = renderEntryExplorationPage({
      subwayStationAvailabilityStatus: "available",
      subwaySelectionOverrides: {
        isActive: true,
        selectedStation,
        status: "selected",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "탐방하기" }));

    expect(await screen.findByText("subway station exploration route")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/exploration/stations/201");
    expect(router.state.location.search).toBe("");
  });

  test("reports the selected subway station to the app assembly layer", () => {
    const handleSubwayStationSelectionChange = vi.fn();
    const selectedStation = {
      address: "?쒖슱?밸퀎??以묎뎄 ?몄쥌?濡?吏??101",
      diagramPosition: { x: 46.73, y: 15.28 },
      id: "201",
      name: "?쒖껌",
      stationGeoPosition: { lat: 37.564718, lng: 126.977108 },
    };

    renderEntryExplorationPage({
      onSubwayStationSelectionChange: handleSubwayStationSelectionChange,
      subwaySelectionOverrides: {
        isActive: true,
        selectedStation,
        status: "selected",
      },
    });

    expect(handleSubwayStationSelectionChange).toHaveBeenCalledWith(selectedStation, "selected");
  });

  test("starts 3D exploration from the fixed intro button", () => {
    renderEntryExplorationPage();

    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));

    expect(sceneControls.startIntro).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "탐방 시작" })).toBeNull();
  });

  test("shows the tower panel on arrival and keeps manual dismissal until reentry", async () => {
    renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    expect(screen.queryByRole("dialog", { name: "N서울타워" })).toBeNull();
    const destination = { x: 10, z: 20 };
    act(() => {
      placeVisits?.tower.update(destination, destination);
    });
    const panel = await screen.findByRole("dialog", { name: "N서울타워" });
    expect(panel.getAttribute("aria-modal")).not.toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "N서울타워" })).toBeNull());
    act(() => {
      placeVisits?.tower.update(destination, destination);
    });
    expect(screen.queryByRole("dialog", { name: "N서울타워" })).toBeNull();
    act(() => {
      placeVisits?.tower.update({ x: 20, z: 20 }, destination);
      placeVisits?.tower.update(destination, destination);
    });
    expect(await screen.findByRole("dialog", { name: "N서울타워" })).toBeTruthy();
  });

  test("shows the hanok link, preserves dismissal, and switches to tower details without the link", async () => {
    renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    const hanok = { x: 10, z: 20 };
    act(() => {
      placeVisits?.hanok.update(hanok, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "한옥체험" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /한옥체험 지도 보기/ }).getAttribute("href")).toBe(
      "https://map.seoul.go.kr/smgis2/short/6P5oo"
    );
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    act(() => {
      placeVisits?.hanok.update(hanok, hanok);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => {
      placeVisits?.hanok.update({ x: 30, z: 20 }, hanok);
      placeVisits?.hanok.update(hanok, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "한옥체험" })).toBeTruthy();
    act(() => {
      placeVisits?.tower.update({ x: 30, z: 20 }, { x: 30, z: 20 });
      placeVisits?.hanok.update({ x: 30, z: 20 }, hanok);
    });
    expect(await screen.findByRole("dialog", { name: "N서울타워" })).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("opens the hanok panel near the visible landmark area without requiring the exact center", async () => {
    renderEntryExplorationPage();
    fireEvent.click(screen.getByRole("button", { name: "탐방 시작" }));
    const hanok = { x: 10, z: 20 };

    act(() => {
      placeVisits?.hanok.update({ x: 13, z: 20 }, hanok);
    });

    expect(await screen.findByRole("dialog", { name: "한옥체험" })).toBeTruthy();
  });
});

function renderEntryExplorationPage({
  onSubwayStationSelectionChange,
  subwayStationAvailabilityStatus = "idle",
  subwaySelectionOverrides = {},
}: {
  onSubwayStationSelectionChange?: (
    station: EntryExplorationSubwaySelectionViewModel["selectedStation"],
    status: EntryExplorationSubwaySelectionViewModel["status"]
  ) => void;
  subwayStationAvailabilityStatus?: SubwayStationAvailabilityStatus;
  subwaySelectionOverrides?: Partial<EntryExplorationSubwaySelectionViewModel>;
} = {}) {
  districtSelectionResultHandler = null;
  sceneControls.deactivateActiveInteraction.mockClear();
  sceneControls.retryActiveInteraction.mockClear();
  sceneControls.startIntro.mockClear();
  Object.assign(subwaySelectionViewModel, {
    handleClose: vi.fn(),
    handleStationSelection: vi.fn(),
    isActive: false,
    isCameraReady: true,
    selectedStation: null,
    status: "idle",
    ...subwaySelectionOverrides,
  });

  const router = createMemoryRouter([
    {
      element: (
        <EntryExplorationPage
          renderPlacePanel={({ open, onClose, placeId }) =>
            open && (
              <div role="dialog" aria-label={ENTRY_EXPLORATION_PLACES[placeId].title}>
                <button onClick={onClose}>닫기</button>
                {placeId === "hanok" && (
                  <a
                    href={ENTRY_EXPLORATION_PLACES.hanok.externalLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="한옥체험 지도 보기 (새 탭에서 열기)"
                  >
                    한옥체험 지도 보기
                  </a>
                )}
              </div>
            )
          }
          onSubwayStationSelectionChange={onSubwayStationSelectionChange}
          subwayStationAvailabilityStatus={subwayStationAvailabilityStatus}
        />
      ),
      path: "/",
    },
    {
      element: <div>district exploration route</div>,
      path: "/exploration/districts/:districtId",
    },
    {
      element: <div>subway station exploration route</div>,
      path: "/exploration/stations/:stationId",
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
