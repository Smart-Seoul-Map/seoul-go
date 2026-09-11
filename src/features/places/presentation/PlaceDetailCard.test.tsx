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
  test("shows a theme link in a new tab without inventing an address", () => {
    render(
      <PlaceDetailCard
        title="한옥체험"
        description="공공한옥과 방문 안내를 지도에서 확인하세요."
        externalLink={{
          label: "한옥체험 지도 보기",
          href: "https://map.seoul.go.kr/smgis2/short/6P5oo",
        }}
      />
    );
    const link = screen.getByRole("link", { name: /한옥체험 지도 보기/ });
    expect(link.getAttribute("href")).toBe("https://map.seoul.go.kr/smgis2/short/6P5oo");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(document.querySelector(".PlaceDetailCardAddress")).toBeNull();
  });
  test("provides an accessible place region and the supplied details", () => {
    render(<PlaceDetailCard {...place} image={{ src: "/tower.jpg", alt: "서울 야경" }} />);
    expect(screen.getByRole("region", { name: place.title })).toBeTruthy();
    expect(screen.getByText(place.description)).toBeTruthy();
    expect(screen.getByText(place.address)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("img", { name: "서울 야경" }).getAttribute("src")).toBe("/tower.jpg");
  });
  test("shows a fallback for missing and broken images and retries a new image", () => {
    const { rerender } = render(<PlaceDetailCard {...place} />);
    expect(screen.getByText("이미지 준비중")).toBeTruthy();
    rerender(<PlaceDetailCard {...place} image={{ src: "/broken.jpg", alt: "First" }} />);
    fireEvent.error(screen.getByRole("img", { name: "First" }));
    expect(screen.getByText("이미지 준비중")).toBeTruthy();
    rerender(<PlaceDetailCard {...place} image={{ src: "/new.jpg", alt: "New" }} />);
    expect(screen.getByRole("img", { name: "New" })).toBeTruthy();
  });
});
