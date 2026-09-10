import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AppBox } from ".";

afterEach(cleanup);

test("renders a neutral div and forwards native props and refs", () => {
  const ref = createRef<HTMLDivElement>();
  render(<AppBox ref={ref} data-testid="box" aria-label="Place" className="custom" />);
  const box = screen.getByTestId("box");
  expect(box.tagName).toBe("DIV");
  expect(ref.current).toBe(box);
  expect(box.classList.contains("custom")).toBe(true);
  expect(box.style.getPropertyValue("--sg-box-background")).toBe("");
});

test("resolves project tokens and does not leak style props to HTML", () => {
  render(
    <AppBox
      data-testid="box"
      bg="bg.surfacePaper"
      color="text.muted"
      borderWidth="1.2"
      borderColor="stroke.weak"
      borderRadius="radius.7"
      boxShadow="shadow.raised"
      p="spacing.4"
      width="full"
    />
  );
  const box = screen.getByTestId("box");
  expect(box.style.getPropertyValue("--sg-box-background")).toBe(
    "var(--sg-color-bg-surface-paper)"
  );
  expect(box.style.getPropertyValue("--sg-box-border-width")).toBe("1.2px");
  expect(box.style.getPropertyValue("--sg-box-border-radius")).toBe("var(--sg-radius-7)");
  expect(box.style.getPropertyValue("--sg-box-padding-base")).toBe("var(--sg-spacing-4)");
  expect(box.style.getPropertyValue("--sg-box-width-base")).toBe("100%");
  expect(box.hasAttribute("bg")).toBe(false);
  expect(box.hasAttribute("p")).toBe(false);
});

test("keeps responsive values in CSS and respects longhand aliases and hideFrom", () => {
  render(
    <AppBox
      data-testid="box"
      padding={{ base: "spacing.2", md: "spacing.6" }}
      p="spacing.1"
      px="spacing.3"
      pt="safeArea"
      display={{ base: "flex", xl: "grid" }}
      hideFrom="lg"
    />
  );
  const style = screen.getByTestId("box").style;
  expect(style.getPropertyValue("--sg-box-padding-base")).toBe("var(--sg-spacing-2)");
  expect(style.getPropertyValue("--sg-box-padding-md")).toBe("var(--sg-spacing-6)");
  expect(style.getPropertyValue("--sg-box-padding-x-base")).toBe("var(--sg-spacing-3)");
  expect(style.getPropertyValue("--sg-box-padding-top-base")).toBe("var(--sg-safe-area-top)");
  expect(style.getPropertyValue("--sg-box-display-lg")).toBe("none");
  expect(style.getPropertyValue("--sg-box-display-xl")).toBe("grid");
});

test("supports negative bleed relative to its padding", () => {
  render(<AppBox data-testid="box" px="spacing.4" bleedX="asPadding" />);
  expect(screen.getByTestId("box").style.getPropertyValue("--sg-box-margin-left-base")).toBe(
    "calc(var(--sg-box-padding-left) * -1)"
  );
});

test("supports margins, flex booleans, active background and style overrides", () => {
  render(
    <AppBox
      data-testid="box"
      m="spacing.2"
      mx="auto"
      flexGrow
      flexWrap
      _active={{ bg: "bg.brand" }}
      bg="bg.surface"
      style={{ background: "white" }}
    />
  );
  const box = screen.getByTestId("box");
  expect(box.style.getPropertyValue("--sg-box-margin-x-base")).toBe("auto");
  expect(box.style.getPropertyValue("--sg-box-flex-grow")).toBe("1");
  expect(box.style.getPropertyValue("--sg-box-flex-wrap")).toBe("wrap");
  expect(box.style.getPropertyValue("--sg-box-active-background")).toBe("var(--sg-color-bg-brand)");
  expect(box.hasAttribute("data-box-active")).toBe(true);
  expect(box.style.background).toBe("white");
});

test("changes the element with as without adding a wrapper", () => {
  render(
    <AppBox as="aside" aria-label="Details">
      Place
    </AppBox>
  );
  expect(screen.getByRole("complementary").classList.contains("AppBox")).toBe(true);
});

test("asChild composes events, styles, classes and both refs on the child", () => {
  const parentRef = createRef<HTMLDivElement>();
  const childRef = createRef<HTMLDivElement>();
  const calls: string[] = [];
  const { unmount } = render(
    <AppBox
      asChild
      ref={parentRef}
      className="outer"
      onClick={() => calls.push("parent")}
      style={{ color: "red" }}
    >
      <div
        ref={childRef}
        className="inner"
        style={{ color: "blue" }}
        onClick={() => calls.push("child")}
      >
        Place
      </div>
    </AppBox>
  );
  const box = screen.getByText("Place");
  expect(parentRef.current).toBe(box);
  expect(childRef.current).toBe(box);
  expect(box.style.color).toBe("blue");
  expect(box.className).toContain("outer");
  expect(box.className).toContain("inner");
  fireEvent.click(box);
  expect(calls).toEqual(["child", "parent"]);
  unmount();
  expect(parentRef.current).toBeNull();
  expect(childRef.current).toBeNull();
});

test("asChild honors callback ref cleanup", () => {
  const dispose = vi.fn();
  const { unmount } = render(
    <AppBox asChild ref={() => dispose}>
      <div>Place</div>
    </AppBox>
  );
  unmount();
  expect(dispose).toHaveBeenCalledOnce();
});
