import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import type { LinkedPlaceReference } from "@features/exploration";
import type { SmartSeoulThemePlace } from "@features/places";

import { ExplorationMapNotice } from "./ExplorationMapNotice";

const selected: LinkedPlaceReference = {
  id: "edition-a",
  name: "해방촌 신흥시장",
  position: { lat: 37.54, lng: 126.99 },
  addedAt: "2026-10-02",
};
const place: SmartSeoulThemePlace = {
  id: "nearby-a",
  sourceContentId: "nearby-a",
  name: "연계 장소",
  description: "",
  districtName: "용산구",
  themeId: "100032",
  themeName: "서울 미래유산",
  address: "",
  imageUrl: "",
  position: selected.position,
};

afterEach(cleanup);

test("shows the initial notice only when base places are ready", () => {
  const linked = { selected: null, isSuccess: false, places: [] };
  const view = render(<ExplorationMapNotice initialPlacesReady={false} linked={linked} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  view.rerender(<ExplorationMapNotice initialPlacesReady linked={linked} />);
  expect(screen.getByRole("status")).toHaveTextContent("서울 시민이 뽑은 장소가 표시됩니다.");
  expect(screen.getByRole("status")).toHaveTextContent("가까운 장소부터 자유롭게 탐방해 보세요.");
});

test("replaces the initial notice after linked results succeed and updates the reference", () => {
  const linked = { selected, isSuccess: true, places: [place] };
  const view = render(<ExplorationMapNotice initialPlacesReady linked={linked} />);
  expect(screen.getByRole("status")).toHaveTextContent("근처에 함께 가볼 만한 장소를 찾았어요.");
  expect(screen.getByRole("status")).toHaveTextContent("해방촌 신흥시장 기준 · 반경 1km");
  expect(screen.queryByText("서울 시민이 뽑은 장소가 표시됩니다.")).not.toBeInTheDocument();
  expect(screen.queryByText(/직선거리/)).not.toBeInTheDocument();

  view.rerender(
    <ExplorationMapNotice
      initialPlacesReady
      linked={{ ...linked, selected: { ...selected, id: "edition-b", name: "리움미술관" } }}
    />
  );
  expect(screen.getByRole("status")).toHaveTextContent("리움미술관 기준 · 반경 1km");
});

test.each([
  { isSuccess: false, places: [] },
  { isSuccess: false, places: [place] },
  { isSuccess: true, places: [] },
])("hides notices for pending, failed or empty linked results: %j", (query) => {
  render(<ExplorationMapNotice initialPlacesReady linked={{ selected, ...query }} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
