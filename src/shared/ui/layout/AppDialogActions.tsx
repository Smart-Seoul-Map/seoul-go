import type { ReactNode } from "react";

import type { AppStackAlign, AppStackGap } from "./AppStack";
import "./layout.css";

export type AppDialogActionsProps = {
  align?: AppStackAlign;
  children: ReactNode;
  gap?: AppStackGap;
};

export function AppDialogActions({ align = "end", children, gap = "sm" }: AppDialogActionsProps) {
  return (
    <div className="AppDialogActions" data-align={align} data-gap={gap}>
      {children}
    </div>
  );
}
