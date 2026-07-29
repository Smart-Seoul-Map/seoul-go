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
        subwaySelection={createSubwaySelectionViewModel({ isActive: false })}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("uses the shared dialog close interactions while input is available", () => {
    const handleClose = vi.fn();

    render(
      <SubwaySelectionDialog subwaySelection={createSubwaySelectionViewModel({ handleClose })} />
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
    render(
      <SubwaySelectionDialog
        subwaySelection={createSubwaySelectionViewModel({
          selectedStation: {
            address: "서울특별시 중구 서소문로 지하 127",
            id: "201",
            location: { lat: 37.564718, lng: 126.977108 },
            name: "시청",
            position: { x: 46.73, y: 15.28 },
          },
          status: "selected",
        })}
      />
    );

    expect(screen.getByText("시청역이 선정되었습니다.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 선택하기" })).toBeTruthy();
  });
});
