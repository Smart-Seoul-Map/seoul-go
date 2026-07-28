import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppCaption, AppHeading, AppText } from ".";

describe("Typography wrappers", () => {
  test("renders body text with semantic role and tone attributes", () => {
    render(
      <AppText role="supporting" tone="muted">
        탐방 설명
      </AppText>
    );

    const text = screen.getByText("탐방 설명");

    expect(text.tagName).toBe("P");
    expect(text.getAttribute("data-role")).toBe("supporting");
    expect(text.getAttribute("data-tone")).toBe("muted");
  });

  test("renders headings with the requested level and size", () => {
    render(
      <AppHeading as="h2" size="lg">
        자치구 선택
      </AppHeading>
    );

    const heading = screen.getByRole("heading", { level: 2, name: "자치구 선택" });

    expect(heading.getAttribute("data-size")).toBe("lg");
    expect(heading.getAttribute("data-tone")).toBe("default");
  });

  test("renders captions with line clamp metadata", () => {
    render(
      <AppCaption maxLines={2} tone="subtle">
        지도 위에서 선택 결과를 확인합니다.
      </AppCaption>
    );

    const caption = screen.getByText("지도 위에서 선택 결과를 확인합니다.");

    expect(caption.tagName).toBe("P");
    expect(caption.getAttribute("data-max-lines")).toBe("2");
    expect(caption.getAttribute("data-tone")).toBe("subtle");
  });
});
