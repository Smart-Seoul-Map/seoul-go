import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { PlaceDetailCard } from "./PlaceDetailCard";

afterEach(cleanup);
const place = {
  title: "N서울타워",
  description: "서울을 한눈에 보는 전망 명소",
  address: "서울 용산구 남산공원길 105",
};

describe("PlaceDetailCard", () => {
  test("provides an accessible place region and the supplied details", () => {
    render(<PlaceDetailCard {...place} image={{ src: "/tower.jpg", alt: "서울 야경" }} />);
    expect(screen.getByRole("region", { name: place.title })).toBeTruthy();
    expect(screen.getByText(place.description)).toBeTruthy();
    expect(screen.getByText(place.address)).toBeTruthy();
    expect(screen.getByRole("img", { name: "서울 야경" }).getAttribute("src")).toBe("/tower.jpg");
  });
  test("shows a fallback for missing and broken images and retries a new image", () => {
    const { rerender } = render(<PlaceDetailCard {...place} />);
    expect(screen.getByText("장소 대표 이미지")).toBeTruthy();
    rerender(<PlaceDetailCard {...place} image={{ src: "/broken.jpg", alt: "First" }} />);
    fireEvent.error(screen.getByRole("img", { name: "First" }));
    expect(screen.getByText("장소 대표 이미지")).toBeTruthy();
    rerender(<PlaceDetailCard {...place} image={{ src: "/new.jpg", alt: "New" }} />);
    expect(screen.getByRole("img", { name: "New" })).toBeTruthy();
  });
});
