import type { ReactNode } from "react";

import "./typography.css";

export type AppHeadingElement = "h1" | "h2" | "h3" | "h4";
export type AppHeadingSize = "sm" | "md" | "lg";
export type AppHeadingTone = "default" | "muted" | "brand" | "danger";
export type AppHeadingAlign = "start" | "center" | "end";
export type AppHeadingMaxLines = 1 | 2;

export type AppHeadingProps = {
  align?: AppHeadingAlign;
  as?: AppHeadingElement;
  children: ReactNode;
  id?: string;
  maxLines?: AppHeadingMaxLines;
  size?: AppHeadingSize;
  tone?: AppHeadingTone;
};

export function AppHeading({
  align = "start",
  as: Component = "h1",
  children,
  id,
  maxLines,
  size = "md",
  tone = "default",
}: AppHeadingProps) {
  return (
    <Component
      className="AppHeading"
      data-align={align}
      data-max-lines={maxLines}
      data-size={size}
      data-tone={tone}
      id={id}
    >
      {children}
    </Component>
  );
}
