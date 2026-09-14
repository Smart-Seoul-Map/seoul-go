import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { PlaceDetailCard } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";

const place = { title: "Tower", description: "Description", address: "Address" };
const subtitle = "Custom subtitle";
const originalWidth = window.innerWidth;

test.each([390, 1366])("keeps the external link outside scrolling content at %ipx", (width) => {
  resize(width);
  render(
    <PlaceDetailPanel
      defaultOpen
      place={{
        ...place,
        externalLink: {
          label: "한옥체험 지도 보기",
          href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
        },
      }}
    />
  );
  const links = screen.getAllByRole("link", { name: /한옥체험 지도 보기/ });
  expect(links).toHaveLength(1);
  expect(links[0].closest(".AppResponsivePanelFooter")).not.toBeNull();
  expect(links[0].closest(".PlaceDetailPanelBody")).toBeNull();
});

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

test("accepts a screen-specific mobile height cap without fixing the sheet height", () => {
  resize(390);
  render(<PlaceDetailPanel place={place} defaultOpen mobileMaxHeight="40dvh" />);
  const dialog = screen.getByRole("dialog");
  expect(dialog.style.getPropertyValue("--place-detail-mobile-max-height")).toBe("40dvh");
  expect(dialog.style.height).toBe("");
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
});

test("starts a mobile sheet at the first snap point and expands from the handle", () => {
  resize(390);
  render(
    <PlaceDetailPanel
      place={place}
      defaultOpen
      mobileMaxHeight="600px"
      mobileSnapPoints={[0.4, "600px"]}
    />
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("40dvh");
  fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
  expect(dialog.style.getPropertyValue("--panel-snap-height")).toBe("600px");
  fireEvent.click(screen.getByRole("button", { name: "패널 높이 조절" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
});

test("lets the panel card hug its content while keeping the standalone card height", () => {
  resize(390);
  const { unmount } = render(<PlaceDetailPanel place={place} defaultOpen />);
  const panelCard = screen.getByRole("region", { name: place.title });
  expect(getComputedStyle(panelCard).minHeight).toBe("auto");

  unmount();
  cleanup();

  render(<PlaceDetailCard {...place} />);
  const standaloneCard = screen.getByRole("region", { name: place.title });
  expect(standaloneCard.closest(".PlaceDetailPanel")).toBeNull();
  expect(standaloneCard.classList.contains("PlaceDetailCard")).toBe(true);
});

test("keeps the mobile place title in the fixed panel header", () => {
  resize(390);
  render(<PlaceDetailPanel place={place} defaultOpen />);
  const dialog = screen.getByRole("dialog", { name: place.title });
  const title = screen.getByRole("heading", { name: place.title });

  expect(title.closest(".AppResponsivePanelHeader")).not.toBeNull();
  expect(title.closest(".PlaceDetailPanelBody")).toBeNull();
  expect(screen.getByRole("region", { name: place.title })).toBeTruthy();
  expect(dialog.dataset.presentation).toBe("bottom-sheet");
});

test("keeps the desktop place title inside the detail card", () => {
  resize(1200);
  render(<PlaceDetailPanel place={place} defaultOpen />);
  const title = screen
    .getAllByRole("heading", { name: place.title })
    .find((heading) => heading.closest(".PlaceDetailCardHeader"));

  expect(title).toBeTruthy();
  expect(title?.closest(".PlaceDetailCardHeader")).not.toBeNull();
  expect(title?.closest(".AppResponsivePanelHeader")).toBeNull();
});

test("leaves the default mobile height cap to the detail tokens", () => {
  resize(390);
  render(<PlaceDetailPanel place={place} defaultOpen />);
  expect(
    screen.getByRole("dialog").style.getPropertyValue("--place-detail-mobile-max-height")
  ).toBe("");
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
  expect(screen.getByRole("dialog").style.getPropertyValue("--panel-snap-height")).toBe("50dvh");
  resize(1200);
  expect(screen.getByText(subtitle)).toBeTruthy();
});

test("keeps the standalone card subtitle on mobile", () => {
  resize(375);
  render(<PlaceDetailCard {...place} subtitle={subtitle} />);
  expect(screen.getByText(subtitle)).toBeTruthy();
});
