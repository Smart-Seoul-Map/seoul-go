const tokenPrefixes: Record<string, string> = {
  bg: "color-bg",
  text: "color-text",
  stroke: "color-stroke",
  strokeWidth: "stroke-width",
  spacing: "spacing",
  radius: "radius",
  shadow: "shadow",
  gradient: "gradient",
};

/** Token names belong to our design system; CSS literals pass through unchanged. */
export function resolveBoxToken(value: string | number): string {
  if (typeof value === "number") return `${value}px`;
  if (value === "full") return "100%";
  const separator = value.indexOf(".");
  const prefix = tokenPrefixes[value.slice(0, separator)];
  if (separator < 0 || !prefix) return value;
  const name = value.slice(separator + 1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `var(--sg-${prefix}-${name})`;
}

export function resolveBoxBorderWidth(value: string | number): string {
  return typeof value === "number" || /^\d+(\.\d+)?$/.test(value)
    ? `${value}px`
    : resolveBoxToken(value);
}
