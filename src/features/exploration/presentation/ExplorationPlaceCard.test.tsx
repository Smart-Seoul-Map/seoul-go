import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { ExplorationPlaceCard } from "./ExplorationPlaceCard";

const place = {
  id: "place-1",
  imageUrl: "https://example.com/place.jpg",
  markerColor: "#c92a2a",
  name: "Namsan Tower",
  position: {
    lat: 37.5,
    lng: 126.9,
  },
  themeId: "100032",
  themeName: "서울 미래유산",
};

const noopAddToCourse = () => {};

describe("ExplorationPlaceCard", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders the place name and image", () => {
    render(<ExplorationPlaceCard onAddToCourse={noopAddToCourse} place={place} />);

    expect(screen.getByText("Namsan Tower")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Namsan Tower 대표 이미지" })).toHaveAttribute(
      "src",
      "https://example.com/place.jpg"
    );
  });

  test("separates the layered card body from the footer", () => {
    const { container } = render(
      <ExplorationPlaceCard onAddToCourse={noopAddToCourse} place={place} />
    );

    expect(container.querySelector(".exploration-place-card-panel-line")).not.toBeInTheDocument();

    const cardBody = container.querySelector<HTMLElement>(".exploration-place-card-body");
    const footer = container.querySelector<HTMLElement>(".exploration-place-card-footer");

    expect(cardBody).toContainElement(
      container.querySelector<HTMLElement>(".exploration-place-card-header")
    );
    expect(cardBody).toContainElement(
      container.querySelector<HTMLElement>(".exploration-place-card-panel")
    );
    expect(container.querySelector<HTMLElement>(".exploration-place-card-panel")).toContainElement(
      container.querySelector<HTMLElement>(".exploration-place-card-panel-inner")
    );
    expect(
      container.querySelector<HTMLElement>(".exploration-place-card-panel-inner")
    ).toContainElement(
      container.querySelector<HTMLElement>(".exploration-place-card-panel-surface")
    );
    expect(cardBody).not.toContainElement(footer);
    expect(footer?.previousElementSibling).toBe(cardBody);
  });

  test("calls add handler when course button is clicked", () => {
    const handleAddToCourse = vi.fn();

    render(<ExplorationPlaceCard onAddToCourse={handleAddToCourse} place={place} />);

    fireEvent.click(screen.getByRole("button", { name: "스탬프 코스 +" }));

    expect(handleAddToCourse).toHaveBeenCalledWith(place);
  });
});
