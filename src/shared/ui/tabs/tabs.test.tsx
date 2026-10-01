import "@testing-library/jest-dom/vitest";

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { AppTabs, type AppTabsRootProps } from ".";
import { getNextTabIndex } from "./tabsNavigation";

afterEach(cleanup);

function Example({ children, ...props }: AppTabsRootProps) {
  return (
    <AppTabs.Root {...props}>
      <AppTabs.List aria-label="Places">
        <AppTabs.Trigger value="a">Alpha</AppTabs.Trigger>
        <AppTabs.Trigger value="b" disabled>
          Beta
        </AppTabs.Trigger>
        <AppTabs.Trigger value="c">Gamma</AppTabs.Trigger>
      </AppTabs.List>
      <AppTabs.Content value="a">
        <input aria-label="Draft" />
      </AppTabs.Content>
      <AppTabs.Content value="b">Beta content</AppTabs.Content>
      <AppTabs.Content value="c">Gamma content</AppTabs.Content>
      {children}
    </AppTabs.Root>
  );
}

describe("AppTabs", () => {
  test("links the selected tab and panel with only one tab stop", () => {
    render(<Example defaultValue="a" />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    const panel = screen.getByRole("tabpanel");

    expect(alpha).toHaveAttribute("aria-selected", "true");
    expect(alpha).toHaveAttribute("tabindex", "0");
    expect(panel).toHaveAttribute("id", alpha.getAttribute("aria-controls"));
    expect(panel).toHaveAttribute("aria-labelledby", alpha.id);
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
  });

  test("selects the first enabled tab when no initial value is supplied", () => {
    render(<Example />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });

  test("click changes content once and preserves inactive panel state", () => {
    const onValueChange = vi.fn();
    render(<Example defaultValue="a" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "kept" } });
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Gamma content");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "Alpha" }));
    expect(screen.getByRole("textbox")).toHaveValue("kept");
  });

  test("arrows skip disabled tabs, wrap and activate; Home and End select endpoints", () => {
    render(<Example defaultValue="a" />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    const gamma = screen.getByRole("tab", { name: "Gamma" });
    act(() => alpha.focus());
    fireEvent.keyDown(alpha, { key: "ArrowRight" });
    expect(gamma).toHaveFocus();
    expect(gamma).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(gamma, { key: "ArrowRight" });
    expect(alpha).toHaveFocus();
    fireEvent.keyDown(alpha, { key: "ArrowLeft" });
    expect(gamma).toHaveFocus();
    fireEvent.keyDown(gamma, { key: "Home" });
    expect(alpha).toHaveFocus();
    fireEvent.keyDown(alpha, { key: "End" });
    expect(gamma).toHaveFocus();
  });

  test("disabled clicks and perpendicular arrows do not change selection", () => {
    const onValueChange = vi.fn();
    render(<Example defaultValue="a" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Beta" }));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowDown" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("vertical tabs use up/down navigation", () => {
    render(<Example defaultValue="a" orientation="vertical" />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowDown" });
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveFocus();
  });

  test("controlled selection waits for the parent value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Example value="a" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    expect(onValueChange).toHaveBeenCalledWith("c");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    rerender(<Example value="c" onValueChange={onValueChange} />);
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("aria-selected", "true");
  });

  test("an invalid controlled value does not silently select another panel", () => {
    render(<Example value="missing" />);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("tabindex", "0");
  });

  test("handles disabled changes without losing DOM order or leaving every tab unreachable", () => {
    function Dynamic({ disabled }: { disabled: boolean }) {
      return (
        <AppTabs.Root>
          <AppTabs.List aria-label="Dynamic">
            <AppTabs.Trigger value="a" disabled={disabled}>
              Alpha
            </AppTabs.Trigger>
            <AppTabs.Trigger value="c">Gamma</AppTabs.Trigger>
          </AppTabs.List>
          <AppTabs.Content value="a">Alpha content</AppTabs.Content>
          <AppTabs.Content value="c">Gamma content</AppTabs.Content>
        </AppTabs.Root>
      );
    }
    const { rerender } = render(<Dynamic disabled />);
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("tabindex", "0");
    rerender(<Dynamic disabled={false} />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("tabindex", "0");
    rerender(<Dynamic disabled />);
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("tabindex", "0");
  });

  test("uses the current rendered order after tabs are reordered or removed", () => {
    function Dynamic({ values }: { values: string[] }) {
      return (
        <AppTabs.Root defaultValue="a">
          <AppTabs.List aria-label="Dynamic">
            {values.map((value) => (
              <AppTabs.Trigger key={value} value={value}>
                {value}
              </AppTabs.Trigger>
            ))}
          </AppTabs.List>
          {values.map((value) => (
            <AppTabs.Content key={value} value={value}>
              {value} content
            </AppTabs.Content>
          ))}
        </AppTabs.Root>
      );
    }
    const { rerender } = render(<Dynamic values={["a", "b", "c"]} />);
    rerender(<Dynamic values={["a", "c", "b"]} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "a" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "c" })).toHaveFocus();
    rerender(<Dynamic values={["a", "b"]} />);
    expect(screen.getByRole("tab", { name: "a" })).toHaveAttribute("aria-selected", "true");
  });

  test("keeps ids separate across multiple instances with the same values", () => {
    render(
      <>
        <Example defaultValue="a" />
        <Example defaultValue="a" />
      </>
    );
    const tabs = screen.getAllByRole("tab", { name: "Alpha" });
    expect(tabs[0].id).not.toBe(tabs[1].id);
  });

  test("respects consumer cancellation of click and keyboard events", () => {
    const onValueChange = vi.fn();
    render(
      <AppTabs.Root defaultValue="a" onValueChange={onValueChange}>
        <AppTabs.List aria-label="Cancel" onKeyDown={(event) => event.preventDefault()}>
          <AppTabs.Trigger value="a">Alpha</AppTabs.Trigger>
          <AppTabs.Trigger value="c" onClick={(event) => event.preventDefault()}>
            Gamma
          </AppTabs.Trigger>
        </AppTabs.List>
        <AppTabs.Content value="a">Alpha content</AppTabs.Content>
        <AppTabs.Content value="c">Gamma content</AppTabs.Content>
      </AppTabs.Root>
    );
    fireEvent.click(screen.getByRole("tab", { name: "Gamma" }));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Alpha" }), { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("nested tablists do not react to each other's keyboard navigation", () => {
    const onOuterChange = vi.fn();
    render(
      <Example defaultValue="a" onValueChange={onOuterChange}>
        <AppTabs.Root defaultValue="inner-a">
          <AppTabs.List aria-label="Inner">
            <AppTabs.Trigger value="inner-a">Inner A</AppTabs.Trigger>
            <AppTabs.Trigger value="inner-b">Inner B</AppTabs.Trigger>
          </AppTabs.List>
          <AppTabs.Content value="inner-a">Inner content A</AppTabs.Content>
          <AppTabs.Content value="inner-b">Inner content B</AppTabs.Content>
        </AppTabs.Root>
      </Example>
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "Inner A" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Inner B" })).toHaveAttribute("aria-selected", "true");
    expect(onOuterChange).not.toHaveBeenCalled();
  });
});

describe("tab navigation", () => {
  test("reverses horizontal arrows in RTL and leaves unrelated keys alone", () => {
    expect(getNextTabIndex("ArrowLeft", 0, 3, "horizontal", true)).toBe(1);
    expect(getNextTabIndex("ArrowRight", 0, 3, "horizontal", true)).toBe(2);
    expect(getNextTabIndex("Tab", 0, 3, "horizontal")).toBeUndefined();
    expect(getNextTabIndex("Home", 0, 0, "horizontal")).toBeUndefined();
  });
});
