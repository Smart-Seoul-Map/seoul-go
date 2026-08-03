import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ExplorationPlaceCard } from "./ExplorationPlaceCard";

describe("ExplorationPlaceCard", () => {
  test("renders the place name and image", () => {
    render(
      <ExplorationPlaceCard
        place={{
          imageUrl: "https://example.com/place.jpg",
          markerColor: "#c92a2a",
          name: "Namsan Tower",
        }}
      />
    );

    expect(screen.getByText("Namsan Tower")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Namsan Tower 대표 이미지" })).toHaveAttribute(
      "src",
      "https://example.com/place.jpg"
    );
  });
});
