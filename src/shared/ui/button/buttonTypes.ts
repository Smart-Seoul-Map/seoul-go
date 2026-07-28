import type { MouseEventHandler, ReactNode } from "react";

export type AppButtonType = "button" | "submit" | "reset";

export type AppButtonSharedProps = {
  children: ReactNode;
  disabled?: boolean;
  id?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: AppButtonType;
};
