import type { ReactElement } from "react";
import type { AppBoxProps } from "./boxTypes";
import { getBoxStyles } from "./boxStyles";
import { BoxSlot } from "./BoxSlot";
import "./box.css";

export function AppBox({
  as: Component = "div",
  asChild = false,
  ref,
  className,
  children,
  ...props
}: AppBoxProps): ReactElement {
  const { style, nativeProps } = getBoxStyles(props);
  const shared = {
    ...nativeProps,
    className: ["AppBox", className].filter(Boolean).join(" "),
    style,
  };
  if (asChild)
    return (
      <BoxSlot {...shared} ref={ref}>
        {children}
      </BoxSlot>
    );
  return (
    <Component {...shared} ref={ref}>
      {children}
    </Component>
  );
}
