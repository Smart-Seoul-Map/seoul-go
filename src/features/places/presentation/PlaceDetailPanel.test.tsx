import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PlaceDetailCard } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";

const place = { title: "Tower", description: "Description", address: "Address" };
const subtitle = "Custom subtitle";
const originalWidth = window.innerWidth;

function resize(width: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    window.dispatchEvent(new Event("resize"));
  });
}

afterEach(() => {
  cleanup();
  resize(originalWidth);
});

test("omits the subtitle only in the bottom sheet and restores it after resizing", () => {
  resize(1200);
  render(<PlaceDetailPanel place={{ ...place, subtitle }} defaultOpen />);
  expect(screen.getByRole("dialog").dataset.appearance).toBe("floating");
  expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  expect(screen.getByText(subtitle)).toBeTruthy();
  resize(375);
  expect(screen.queryByText(subtitle)).toBeNull();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("dialog").dataset.appearance).toBeUndefined();
  resize(1200);
  expect(screen.getByText(subtitle)).toBeTruthy();
});

test("keeps the standalone card subtitle on mobile", () => {
  resize(375);
  render(<PlaceDetailCard {...place} subtitle={subtitle} />);
  expect(screen.getByText(subtitle)).toBeTruthy();
});
