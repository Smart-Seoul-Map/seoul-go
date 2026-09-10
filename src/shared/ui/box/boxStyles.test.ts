import { describe, expect, test } from "vitest";
import { getBoxStyles } from "./boxStyles";
import type { AppBoxProps } from "./boxTypes";

function variables(props: AppBoxProps): Record<string, unknown> {
  return { ...getBoxStyles(props).style };
}

describe("Box public style API", () => {
  test.each([
    ["width", "width"],
    ["minWidth", "min-width"],
    ["maxWidth", "max-width"],
    ["height", "height"],
    ["minHeight", "min-height"],
    ["maxHeight", "max-height"],
    ["gap", "gap"],
    ["padding", "padding"],
    ["p", "padding"],
    ["paddingX", "padding-x"],
    ["px", "padding-x"],
    ["paddingY", "padding-y"],
    ["py", "padding-y"],
    ["paddingTop", "padding-top"],
    ["pt", "padding-top"],
    ["paddingRight", "padding-right"],
    ["pr", "padding-right"],
    ["paddingBottom", "padding-bottom"],
    ["pb", "padding-bottom"],
    ["paddingLeft", "padding-left"],
    ["pl", "padding-left"],
    ["margin", "margin"],
    ["m", "margin"],
    ["marginX", "margin-x"],
    ["mx", "margin-x"],
    ["marginY", "margin-y"],
    ["my", "margin-y"],
    ["marginTop", "margin-top"],
    ["mt", "margin-top"],
    ["marginRight", "margin-right"],
    ["mr", "margin-right"],
    ["marginBottom", "margin-bottom"],
    ["mb", "margin-bottom"],
    ["marginLeft", "margin-left"],
    ["ml", "margin-left"],
  ])("resolves responsive %s without leaking it to the DOM", (prop, css) => {
    const result = getBoxStyles({
      [prop]: {
        base: "spacing.2",
        sm: "spacing.3",
        md: undefined,
        lg: "spacing.4",
        xl: "spacing.8",
      },
    });
    expect(result.nativeProps).not.toHaveProperty(prop);
    expect(result.style).toMatchObject({
      [`--sg-box-${css}-base`]: "var(--sg-spacing-2)",
      [`--sg-box-${css}-sm`]: "var(--sg-spacing-3)",
      [`--sg-box-${css}-lg`]: "var(--sg-spacing-4)",
      [`--sg-box-${css}-xl`]: "var(--sg-spacing-8)",
    });
    expect(result.style).not.toHaveProperty(`--sg-box-${css}-md`);
  });

  test("resolves gradient stops and requires an explicit direction", () => {
    expect(variables({ bgGradient: "var(--custom-stops)" })).not.toHaveProperty(
      "--sg-box-background"
    );
    expect(
      variables({ bgGradient: "var(--custom-stops)", bgGradientDirection: "to right" })
    ).toMatchObject({
      "--sg-box-background": "linear-gradient(to right, var(--custom-stops))",
    });
    expect(
      variables({
        background: "white",
        bg: "black",
        bgGradient: "var(--custom-stops)",
        bgGradientDirection: "43deg",
      })
    ).toMatchObject({ "--sg-box-background": "white" });
  });

  test("resolves individual borders, corners, position, flex and grid properties", () => {
    const result = getBoxStyles({
      borderTopWidth: "strokeWidth.surface",
      borderRightWidth: 1,
      borderBottomWidth: 0,
      borderLeftWidth: "2",
      borderTopLeftRadius: "radius.2",
      borderTopRightRadius: 0,
      borderBottomRightRadius: "10%",
      borderBottomLeftRadius: "radius.full",
      top: 0,
      right: "10%",
      bottom: "auto",
      left: "spacing.4",
      position: "absolute",
      overflowX: "auto",
      overflowY: "hidden",
      zIndex: 2,
      flexGrow: 2,
      flexShrink: 0,
      flexWrap: "nowrap",
      flexDirection: { md: "column" },
      justifyContent: "center",
      justifySelf: "start",
      alignItems: "center",
      alignContent: "stretch",
      alignSelf: "auto",
      gridColumn: "1 / 3",
      gridRow: "2",
      unstable_transform: "translateX(10px)",
    });
    expect(result.nativeProps).toEqual({});
    expect(result.style).toMatchObject({
      "--sg-box-border-top-width": "var(--sg-stroke-width-surface)",
      "--sg-box-border-right-width": "1px",
      "--sg-box-border-bottom-width": "0px",
      "--sg-box-border-left-width": "2px",
      "--sg-box-border-top-left-radius": "var(--sg-radius-2)",
      "--sg-box-border-top-right-radius": "0px",
      "--sg-box-border-bottom-right-radius": "10%",
      "--sg-box-border-bottom-left-radius": "var(--sg-radius-full)",
      "--sg-box-top": "0px",
      "--sg-box-z-index": 2,
      "--sg-box-flex-grow": 2,
      "--sg-box-flex-shrink": 0,
      "--sg-box-flex-direction-md": "column",
      "--sg-box-grid-column": "1 / 3",
      "--sg-box-transform": "translateX(10px)",
    });
  });

  test("selects bleed side before axis before all sides", () => {
    expect(
      variables({ bleed: "spacing.1", bleedX: "spacing.2", bleedLeft: { md: "spacing.4" } })
    ).toEqual({
      "--sg-box-margin-top-base": "calc(var(--sg-spacing-1) * -1)",
      "--sg-box-margin-bottom-base": "calc(var(--sg-spacing-1) * -1)",
      "--sg-box-margin-right-base": "calc(var(--sg-spacing-2) * -1)",
      "--sg-box-margin-left-md": "calc(var(--sg-spacing-4) * -1)",
    });
  });

  test("preserves zero, ordinary CSS strings and explicit style overrides", () => {
    expect(
      variables({ p: 0, width: "calc(100% - 2rem)", style: { padding: "5px" } })
    ).toMatchObject({
      "--sg-box-padding-base": "0px",
      "--sg-box-width-base": "calc(100% - 2rem)",
      padding: "5px",
    });
  });
});
