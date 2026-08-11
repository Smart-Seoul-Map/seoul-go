import "@testing-library/jest-dom/vitest";

import type { ReactElement } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { MapMarkerFeatureCollection } from "@shared/lib/maplibre/mapMarkerFeature";
import { AppToastProvider } from "@shared/ui/toast";

import type { ExplorationPlaceMarkerSelection } from "../application/explorationPlaceMarkers";
import { visitedPlaceStore } from "../application/useVisitedPlaceStore";
import { ExplorationPage } from "./ExplorationPage";

type MockExplorationMapProps = {
  onPlaceMarkerClear?: () => void;
  onPlaceMarkerSelect?: (place: ExplorationPlaceMarkerSelection) => void;
};

const explorationMapMock = vi.hoisted(() => ({
  latestProps: null as MockExplorationMapProps | null,
}));

vi.mock("./ExplorationMap", () => ({
  ExplorationMap: (props: MockExplorationMapProps) => {
    explorationMapMock.latestProps = props;

    return <div data-testid="exploration-map" />;
  },
}));

const themeProgressItems = [
  {
    id: "all",
    markerColor: null,
    markerColorToken: null,
    name: "방문지",
    totalCount: 3,
    visitedCount: 0,
  },
  {
    id: "night",
    markerColor: "#1971c2",
    markerColorToken: "--sg-place-theme-blue",
    name: "서울 야경명소",
    totalCount: 2,
    visitedCount: 0,
  },
] as const;

describe("ExplorationPage", () => {
  afterEach(() => {
    cleanup();
    visitedPlaceStore.setState({ placeIds: [] });
    explorationMapMock.latestProps = null;
  });

  test("지도 위에 테마별 장소 개수 배지를 표시한다", () => {
    renderExplorationPage(<ExplorationPage themeProgressItems={themeProgressItems} />);

    expect(screen.getByLabelText("서울 지도 탐색")).toBeInTheDocument();
    expect(screen.getByLabelText("테마별 장소 개수")).toBeInTheDocument();
    expect(screen.getByLabelText("서울 야경명소 장소 0/2")).toBeInTheDocument();
    expect(screen.getByText("방문지")).toBeInTheDocument();
    expect(screen.getByText("서울 야경명소")).toBeInTheDocument();
    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("자치구 이름이 있을 때만 현재 탐방 상태 배지를 표시한다", () => {
    const { rerender } = renderExplorationPage(
      <ExplorationPage themeProgressItems={themeProgressItems} />
    );

    expect(screen.queryByLabelText("현재 용산구 탐방중")).not.toBeInTheDocument();

    rerender(
      <AppToastProvider>
        <ExplorationPage districtName="용산구" themeProgressItems={themeProgressItems} />
      </AppToastProvider>
    );

    expect(screen.getByLabelText("현재 용산구 탐방중")).toBeInTheDocument();
    expect(screen.getByText("용산구 탐방중")).toBeInTheDocument();
  });

  test("저장된 방문 장소 수를 방문지와 테마별 배지에 반영한다", () => {
    visitedPlaceStore.setState({ placeIds: ["place-1"] });

    renderExplorationPage(
      <ExplorationPage
        placeMarkers={createPlaceMarkers()}
        themeProgressItems={themeProgressItems}
      />
    );

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  test("장소 카드가 열린 시점에 방문 장소 수를 반영한다", () => {
    renderExplorationPage(
      <ExplorationPage
        placeMarkers={createPlaceMarkers()}
        themeProgressItems={themeProgressItems}
      />
    );

    expect(screen.getByText("0/3")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();

    act(() => {
      explorationMapMock.latestProps?.onPlaceMarkerSelect?.(createPlaceMarkerSelection());
    });

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});

function renderExplorationPage(ui: ReactElement) {
  return render(<AppToastProvider>{ui}</AppToastProvider>);
}

function createPlaceMarkers(): MapMarkerFeatureCollection {
  return {
    features: [
      {
        geometry: { coordinates: [126.9, 37.5], type: "Point" },
        id: "place-1",
        properties: {
          closedMarkerImage: "blue_closed_box",
          id: "place-1",
          imageUrl: "",
          markerColor: "#1971c2",
          markerImage: "blue_closed_box",
          name: "place-1",
          openMarkerImage: "blue_open_box",
          themeId: "night",
          themeName: "Night",
        },
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}

function createPlaceMarkerSelection(): ExplorationPlaceMarkerSelection {
  return {
    id: "place-1",
    imageUrl: "",
    markerColor: "#1971c2",
    name: "place-1",
    position: {
      lat: 37.5,
      lng: 126.9,
    },
    themeId: "night",
    themeName: "Night",
  };
}
