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

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("uses the shared dialog close interactions while input is available", () => {
    const handleClose = vi.fn();

    render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({ handleClose })}
      />
    );

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));
    fireEvent.click(screen.getByRole("button", { name: "탐색 화면으로 돌아가기" }));

    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  test("blocks dialog and selection actions until the camera transition is complete", () => {
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

    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));
    fireEvent.click(screen.getByRole("button", { name: "랜덤 역 선정하기" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "탐색 화면으로 돌아가기" })).toBeNull();
    expect(handleClose).not.toHaveBeenCalled();
    expect(handleStationSelection).not.toHaveBeenCalled();
  });

  test("delegates station selection and keeps the dialog locked while selecting", () => {
    const handleClose = vi.fn();
    const handleStationSelection = vi.fn();
    const { rerender } = render(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({
          handleClose,
          handleStationSelection,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "랜덤 역 선정하기" }));

    expect(handleStationSelection).toHaveBeenCalledOnce();

    rerender(
      <SubwaySelectionDialog
        onExplore={vi.fn()}
        subwaySelection={createSubwaySelectionViewModel({
          handleClose,
          handleStationSelection,
          status: "selecting",
        })}
      />
    );
    fireEvent.click(screen.getByTestId("app-dialog-backdrop"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect((screen.getByRole("button", { name: "선정 중..." }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect(handleClose).not.toHaveBeenCalled();
  });

  test("shows the selected station result through shared typography", () => {
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
          selectedStation,
          status: "selected",
        })}
      />
    );

    expect(screen.getByText("시청역이 선정되었습니다.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 선택하기" })).toBeTruthy();

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

    expect(
      screen.getByText("서울대입구역 반경 1km에는 현재 탐방할 곳이 없어요. 다시 선정해 주세요.")
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "탐방하기" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "다시 선택하기" }));

    expect(handleStationSelection).toHaveBeenCalledOnce();
  });
});
