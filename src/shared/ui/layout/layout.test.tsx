import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AppDialogActions, AppHStack, AppInline, AppStack, AppVStack } from ".";

describe("Layout wrappers", () => {
  test("renders base stacks with explicit direction", () => {
    render(
      <AppStack direction="horizontal" gap="lg">
        <span>base</span>
      </AppStack>
    );

    const stack = screen.getByText("base").parentElement;

    expect(stack?.getAttribute("data-direction")).toBe("horizontal");
    expect(stack?.getAttribute("data-gap")).toBe("lg");
  });

  test("renders vertical stacks with closed spacing and alignment metadata", () => {
    render(
      <AppVStack align="center" gap="md">
        <span>first</span>
        <span>second</span>
      </AppVStack>
    );

    const stack = screen.getByText("first").parentElement;

    expect(stack?.getAttribute("data-direction")).toBe("vertical");
    expect(stack?.getAttribute("data-gap")).toBe("md");
    expect(stack?.getAttribute("data-align")).toBe("center");
  });

  test("renders horizontal stacks with justification metadata", () => {
    render(
      <AppHStack align="center" gap="sm" justify="between">
        <span>left</span>
        <span>right</span>
      </AppHStack>
    );

    const stack = screen.getByText("left").parentElement;

    expect(stack?.getAttribute("data-direction")).toBe("horizontal");
    expect(stack?.getAttribute("data-gap")).toBe("sm");
    expect(stack?.getAttribute("data-justify")).toBe("between");
  });

  test("renders inline layouts that can opt into wrapping", () => {
    render(
      <AppInline gap="xs" wrap>
        <span>tag</span>
      </AppInline>
    );

    const inline = screen.getByText("tag").parentElement;

    expect(inline?.getAttribute("data-gap")).toBe("xs");
    expect(inline?.getAttribute("data-wrap")).toBe("true");
  });

  test("renders dialog actions with end alignment by default", () => {
    render(
      <AppDialogActions>
        <button type="button">cancel</button>
        <button type="button">confirm</button>
      </AppDialogActions>
    );

    const actions = screen.getByText("confirm").parentElement;

    expect(actions?.getAttribute("data-align")).toBe("end");
    expect(actions?.getAttribute("data-gap")).toBe("sm");
  });
});
