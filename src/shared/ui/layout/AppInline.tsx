import type { ReactNode } from "react";

import type { AppStackAlign, AppStackGap, AppStackJustify } from "./AppStack";
import "./layout.css";

export type AppInlineProps = {
  align?: AppStackAlign;
  children: ReactNode;
  gap?: AppStackGap;
  justify?: AppStackJustify;
  wrap?: boolean;
};

export function AppInline({
  align = "center",
  children,
  gap = "sm",
  justify = "start",
  wrap = false,
}: AppInlineProps) {
  return (
    <div
      className="AppInline"
      data-align={align}
      data-gap={gap}
      data-justify={justify}
      data-wrap={wrap}
    >
      {children}
    </div>
  );
}
