import type { ReactNode } from "react";

import { AppStack, type AppStackAlign, type AppStackGap, type AppStackJustify } from "./AppStack";

export type AppHStackProps = {
  align?: AppStackAlign;
  children: ReactNode;
  gap?: AppStackGap;
  justify?: AppStackJustify;
};

export function AppHStack({ align, children, gap, justify }: AppHStackProps) {
  return (
    <AppStack align={align} direction="horizontal" gap={gap} justify={justify}>
      {children}
    </AppStack>
  );
}
