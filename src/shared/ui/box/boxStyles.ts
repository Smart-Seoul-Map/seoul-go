import type { CSSProperties } from "react";
import type { AppBoxProps, BoxBreakpoint } from "./boxTypes";
import { resolveBoxBorderWidth, resolveBoxToken } from "./boxTokens";

const breakpoints: BoxBreakpoint[] = ["base", "sm", "md", "lg", "xl"];
const sides = ["top", "right", "bottom", "left"] as const;
const responsiveAliases: Record<string, string[]> = {
  width: ["width"],
  "min-width": ["minWidth"],
  "max-width": ["maxWidth"],
  height: ["height"],
  "min-height": ["minHeight"],
  "max-height": ["maxHeight"],
  display: ["display"],
  "flex-direction": ["flexDirection"],
  gap: ["gap"],
  padding: ["padding", "p"],
  "padding-x": ["paddingX", "px"],
  "padding-y": ["paddingY", "py"],
  "padding-top": ["paddingTop", "pt"],
  "padding-right": ["paddingRight", "pr"],
  "padding-bottom": ["paddingBottom", "pb"],
  "padding-left": ["paddingLeft", "pl"],
  margin: ["margin", "m"],
  "margin-x": ["marginX", "mx"],
  "margin-y": ["marginY", "my"],
  "margin-top": ["marginTop", "mt"],
  "margin-right": ["marginRight", "mr"],
  "margin-bottom": ["marginBottom", "mb"],
  "margin-left": ["marginLeft", "ml"],
};
const staticKeys = [
  "color",
  "borderColor",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "boxShadow",
  "top",
  "right",
  "bottom",
  "left",
  "position",
  "overflowX",
  "overflowY",
  "zIndex",
  "flexGrow",
  "flexShrink",
  "flexWrap",
  "justifyContent",
  "justifySelf",
  "alignItems",
  "alignContent",
  "alignSelf",
  "gridColumn",
  "gridRow",
] as const;
type Variables = Record<string, string | number>;
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function responsive(
  name: string,
  value: unknown,
  transform: (value: string | number) => string
): Variables {
  const values = typeof value === "object" && value !== null ? value : { base: value };
  const result: Variables = {};
  for (const point of breakpoints) {
    const current: unknown = Reflect.get(values, point);
    if (typeof current !== "string" && typeof current !== "number") continue;
    result[`--sg-box-${name}-${point}`] = transform(current);
  }
  return result;
}

export function getBoxStyles(props: AppBoxProps): {
  style: CSSProperties;
  nativeProps: Record<string, unknown>;
} {
  const nativeProps: Record<string, unknown> = { ...props };
  const variables: Variables = {};
  function take(...names: string[]): unknown {
    const selected = names.map((name) => nativeProps[name]).find((value) => value != null);
    for (const name of names) delete nativeProps[name];
    return selected;
  }

  const background = take("background", "bg");
  const gradient = take("bgGradient", "backgroundGradient");
  const direction = take("bgGradientDirection", "backgroundGradientDirection");
  if (typeof background === "string")
    variables["--sg-box-background"] = resolveBoxToken(background);
  else if (typeof gradient === "string" && typeof direction === "string") {
    variables["--sg-box-background"] =
      `linear-gradient(${direction}, ${resolveBoxToken(gradient)})`;
  }
  for (const key of staticKeys) {
    const value = take(key);
    const variable = `--sg-box-${kebab(key)}`;
    if (value === true) variables[variable] = key === "flexWrap" ? "wrap" : 1;
    if (typeof value !== "string" && typeof value !== "number") continue;
    if (/^border.*Width$/.test(key)) variables[variable] = resolveBoxBorderWidth(value);
    else
      variables[variable] = ["zIndex", "flexGrow", "flexShrink"].includes(key)
        ? value
        : resolveBoxToken(value);
  }

  // Bleed selects the most specific prop first; margin props then take precedence.
  for (const side of sides) {
    const cap = side[0].toUpperCase() + side.slice(1);
    const axis = side === "left" || side === "right" ? "X" : "Y";
    const value = nativeProps[`bleed${cap}`] ?? nativeProps[`bleed${axis}`] ?? nativeProps.bleed;
    Object.assign(
      variables,
      responsive(`margin-${side}`, value, (v) => {
        const dimension = v === "asPadding" ? `var(--sg-box-padding-${side})` : resolveBoxToken(v);
        return `calc(${dimension} * -1)`;
      })
    );
  }
  take("bleed", "bleedX", "bleedY", "bleedTop", "bleedRight", "bleedBottom", "bleedLeft");
  for (const [name, aliases] of Object.entries(responsiveAliases)) {
    const value = take(...aliases);
    Object.assign(
      variables,
      responsive(name, value, (v) => {
        if (v === "safeArea" && (name === "padding-top" || name === "padding-bottom")) {
          return `var(--sg-safe-area-${name.slice(8)})`;
        }
        return resolveBoxToken(v);
      })
    );
  }
  const transform = take("unstable_transform");
  if (typeof transform === "string") variables["--sg-box-transform"] = transform;
  take("_active", "style");
  const active = props._active?.bg ?? props._active?.background;
  if (active != null) {
    variables["--sg-box-active-background"] = resolveBoxToken(active);
    nativeProps["data-box-active"] = "";
  }
  const hideFrom = take("hideFrom");
  // CSSProperties is the DOM boundary for our private CSS custom properties.
  const style = { ...variables, ...props.style } as CSSProperties;
  if (typeof hideFrom === "string")
    Object.assign(style, { [`--sg-box-display-${hideFrom}`]: "none" });
  return { style, nativeProps };
}
