import type { ReactNode } from "react";

import "./layout.css";

export type AppStackDirection = "vertical" | "horizontal";
export type AppStackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type AppStackAlign = "start" | "center" | "end" | "stretch";
export type AppStackJustify = "start" | "center" | "end" | "between";

export type AppStackProps = {
  align?: AppStackAlign;
  children: ReactNode;
  direction?: AppStackDirection;
  gap?: AppStackGap;
  justify?: AppStackJustify;
};

export function AppStack({
  align = "stretch",
  children,
  direction = "vertical",
  gap = "md",
  justify = "start",
}: AppStackProps) {
  return (
    <div
      className="AppStack"
      data-align={align}
      data-direction={direction}
      data-gap={gap}
      data-justify={justify}
    >
      {children}
    </div>
  );
}
