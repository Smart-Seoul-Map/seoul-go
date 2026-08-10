import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { EntryExplorationSubwaySelectionViewModel } from "../application/useEntryExplorationSubwaySelection";
import { SubwaySelectionDialog } from "./SubwaySelectionDialog";

function createSubwaySelectionViewModel(
  overrides: Partial<EntryExplorationSubwaySelectionViewModel> = {}
): EntryExplorationSubwaySelectionViewModel {
  return {
    handleClose: vi.fn(),
    handleStationSelection: vi.fn(),
    isActive: true,
    isCameraReady: true,
    selectedStation: null,
    status: "idle",
    ...overrides,
  };
}

describe("SubwaySelectionDialog", () => {
  afterEach(cleanup);

  test("renders nothing while the interaction is inactive", () => {
    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({ isActive: false })}
      />
    );

    expect(screen.queryByRole("region", { name: "지하철 역 선정 안내" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("shows a plain guide overlay that starts station selection after confirmation", () => {
    const handleStationSelection = vi.fn();

    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({ handleStationSelection })}
      />
    );

    screen.getByRole("region", { name: "지하철 역 선정 안내" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("app-dialog-backdrop")).toBeNull();
    expect(screen.getByText("서울 지하철 2호선").getAttribute("data-tone")).toBe("brand");
    expect(screen.getByRole("heading", { name: "출발역 랜덤 선정" })).toBeTruthy();
    expect(
      screen.getByText("확인을 누르면 2호선 노선도 위로 열차가", { exact: false })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "확인" }).getAttribute("data-variant")).toBe(
      "primary"
    );

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(handleStationSelection).toHaveBeenCalledOnce();
  });

  test("returns to the character scene when the guide backdrop is clicked", () => {
    const handleClose = vi.fn();

    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({ handleClose })}
      />
    );

    fireEvent.click(screen.getByRole("region", { name: "지하철 역 선정 안내" }));

    expect(handleClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("subway-selection-guide-backdrop"));

    expect(handleClose).toHaveBeenCalledOnce();
  });

  test("blocks guide confirmation until the camera transition is complete", () => {
    const handleClose = vi.fn();
    const handleStationSelection = vi.fn();

    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({
          handleClose,
          handleStationSelection,
          isCameraReady: false,
        })}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "확인" });

    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(confirmButton);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "탐색 화면으로 돌아가기" })).toBeNull();
    expect(handleClose).not.toHaveBeenCalled();
    expect(handleStationSelection).not.toHaveBeenCalled();
  });

  test("removes the guide while the train is selecting a station", () => {
    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({ status: "selecting" })}
      />
    );

    expect(screen.queryByRole("region", { name: "지하철 역 선정 안내" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("app-dialog-backdrop")).toBeNull();
  });

  test("shows the selected station result through shared typography", () => {
    const handleClose = vi.fn();
    const handleExplore = vi.fn();
    const selectedStation = {
      address: "서울특별시 중구 세종대로 지하 101",
      diagramPosition: { x: 46.73, y: 15.28 },
      id: "201",
      name: "시청",
      stationGeoPosition: { lat: 37.564718, lng: 126.977108 },
    };

    render(
      <SubwaySelectionDialog
        availabilityStatus="available"
        onExplore={handleExplore}
        subwaySelection={createSubwaySelectionViewModel({
          handleClose,
          selectedStation,
          status: "selected",
        })}
      />
    );

    screen.getByRole("dialog", { name: "시청역" });
    screen.getByRole("heading", { name: "시청역" });

    expect(screen.getByText("출발역이 선정되었습니다.")).toBeTruthy();
    expect(screen.getByText("시청역", { selector: "span" }).getAttribute("data-tone")).toBe(
      "brand"
    );
    expect(screen.getByRole("button", { name: "다시 선택하기" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));
    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));

    expect(handleClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "탐방하기" }));

    expect(handleExplore).toHaveBeenCalledWith("201");
  });

  test("shows retry guidance instead of exploration when the selected station has no places", () => {
    const handleStationSelection = vi.fn();
    const selectedStation = {
      address: "서울특별시 관악구 남부순환로 지하1822",
      diagramPosition: { x: 0, y: 0 },
      id: "228",
      name: "서울대입구",
      stationGeoPosition: { lat: 37.481247, lng: 126.952739 },
    };

    render(
      <SubwaySelectionDialog
        availabilityStatus="empty"
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({
          handleStationSelection,
          selectedStation,
          status: "selected",
        })}
      />
    );

    expect(screen.getByText("반경 1km 내에 탐방할 곳이 없습니다.")).toBeTruthy();
    expect(screen.getByText("다른 역으로 다시 선정해 주세요.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "탐방하기" }) as HTMLButtonElement).disabled).toBe(
      true
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 선택하기" }));

    expect(handleStationSelection).toHaveBeenCalledOnce();
  });

  test("keeps every exit interaction available while station availability is checking", () => {
    const handleClose = vi.fn();
    const selectedStation = {
      address: "서울특별시 중구 세종대로 지하 101",
      diagramPosition: { x: 46.73, y: 15.28 },
      id: "201",
      name: "시청",
      stationGeoPosition: { lat: 37.564718, lng: 126.977108 },
    };

    render(
      <SubwaySelectionDialog
        availabilityStatus="checking"
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({
          handleClose,
          selectedStation,
          status: "selected",
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));
    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(handleClose).toHaveBeenCalledTimes(3);
  });
});
