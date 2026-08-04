import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationPlaceCard } from "./ExplorationPlaceCard";

const place = {
  imageUrl: "https://example.com/place.jpg",
  markerColor: "#c92a2a",
  name: "Namsan Tower",
};

describe("ExplorationPlaceCard", () => {
  test("renders the place name and image", () => {
    render(<ExplorationPlaceCard place={place} />);

    expect(screen.getByText("Namsan Tower")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Namsan Tower 대표 이미지" })).toHaveAttribute(
      "src",
      "https://example.com/place.jpg"
    );
  });

  test("separates the layered card body from the footer", () => {
    const { container } = render(<ExplorationPlaceCard place={place} />);

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
});
