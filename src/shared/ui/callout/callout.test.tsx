import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { AppCallout } from ".";

afterEach(cleanup);

describe("AppCallout", () => {
  test("renders a non-interactive note without automatically announcing it", () => {
    render(<AppCallout description="Explore nearby places." />);
    const note = screen.getByRole("note");

    expect(note).toHaveTextContent("Explore nearby places.");
    expect(note).toHaveAttribute("data-tone", "neutral");
    expect(note).not.toHaveAttribute("tabindex");
    expect(note).not.toHaveAttribute("aria-live");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("keeps the title and description inline, separated by two spaces", () => {
    render(<AppCallout title="Notice" description="Nearby places are ready." />);
    const title = screen.getByText("Notice");
    const description = screen.getByText("Nearby places are ready.");

    expect(title.tagName).toBe("SPAN");
    expect(description.tagName).toBe("SPAN");
    expect(title.parentElement?.textContent).toBe("Notice  Nearby places are ready.");
  });

  test.each([undefined, null, false, ""])("omits an empty title (%s) and its spacing", (title) => {
    render(<AppCallout title={title} description="Description only" />);
    expect(screen.getByRole("note").querySelector(".AppCallout-title")).toBeNull();
    expect(screen.getByRole("note").textContent).toBe("Description only");
  });

  test("accepts a decorative prefix without announcing it twice", () => {
    render(<AppCallout prefixIcon={<span data-testid="icon">i</span>} description="Information" />);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  test("does not reserve an icon slot when omitted", () => {
    render(<AppCallout description="Information" />);
    expect(screen.getByRole("note").querySelector(".AppCallout-icon")).toBeNull();
  });

  test("allows a persistent polite status region to receive updated text", () => {
    const { rerender } = render(<AppCallout role="status" tone="informative" description="" />);
    const status = screen.getByRole("status");
    rerender(<AppCallout role="status" tone="informative" description="Five places found." />);

    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Five places found.");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveAttribute("data-tone", "informative");
  });

  test("supports explicit urgent semantics without coupling them to a color", () => {
    render(<AppCallout role="alert" description="Please check the message." />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-atomic", "true");
  });

  test("forwards layout and accessibility attributes without replacing its base class", () => {
    render(
      <AppCallout
        id="notice"
        className="MapNotice"
        aria-label="Map information"
        description="Ready"
      />
    );
    expect(screen.getByRole("note", { name: "Map information" })).toHaveClass(
      "AppCallout",
      "MapNotice"
    );
    expect(screen.getByRole("note")).toHaveAttribute("id", "notice");
  });
});
