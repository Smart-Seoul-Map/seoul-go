import type { ComponentPropsWithRef } from "react";

import { type AppButtonSharedProps } from "./buttonTypes";

import "./button.css";

export type AppButtonVariant = "primary" | "secondary" | "strong" | "danger" | "outline" | "ghost";
export type AppButtonSize = "xs" | "sm" | "md" | "lg";

export type AppButtonProps = AppButtonSharedProps &
  ComponentPropsWithRef<"button"> & {
    size?: AppButtonSize;
    variant?: AppButtonVariant;
  };

export function AppButton({
  children,
  disabled = false,
  id,
  onClick,
  size = "md",
  type = "button",
  variant = "secondary",
  className,
  ...buttonProps
}: AppButtonProps) {
  return (
    <button
      {...buttonProps}
      className={["AppButton", className].filter(Boolean).join(" ")}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      id={id}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
