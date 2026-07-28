import type { ReactNode } from "react";

import { AppStack, type AppStackAlign, type AppStackGap, type AppStackJustify } from "./AppStack";

export type AppVStackProps = {
  align?: AppStackAlign;
  children: ReactNode;
  gap?: AppStackGap;
  justify?: AppStackJustify;
};

export function AppVStack({ align, children, gap, justify }: AppVStackProps) {
  return (
    <AppStack align={align} direction="vertical" gap={gap} justify={justify}>
      {children}
    </AppStack>
  );
}
