import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { AppSpeechBubble } from ".";

afterEach(cleanup);

describe("AppSpeechBubble", () => {
  test("renders the speaker before the message", () => {
    const { container } = render(
      <AppSpeechBubble speaker="해치" message="아래 화살을 눌러 발사!" />
    );

    expect(screen.getByText("해치")).toHaveClass("AppSpeechBubble-speaker");
    expect(screen.getByText("아래 화살을 눌러 발사!")).toHaveClass("AppSpeechBubble-message");
    expect(container.firstElementChild?.textContent).toBe("해치아래 화살을 눌러 발사!");
  });

  test("hides the decorative frame from assistive technology", () => {
    const { container } = render(<AppSpeechBubble speaker="해치" message="안녕" />);
    const frame = container.querySelector(".AppSpeechBubble-frame");

    expect(frame).toHaveAttribute("aria-hidden", "true");
    expect(frame?.querySelectorAll("svg")).toHaveLength(2);
  });

  test("forwards attributes without replacing its base class", () => {
    render(
      <AppSpeechBubble
        className="DartGuide"
        data-testid="bubble"
        role="status"
        speaker="해치"
        message="안녕"
      />
    );

    expect(screen.getByRole("status")).toHaveClass("AppSpeechBubble", "DartGuide");
    expect(screen.getByTestId("bubble")).toBe(screen.getByRole("status"));
  });
});
