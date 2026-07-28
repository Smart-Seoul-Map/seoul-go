import type { ReactNode } from "react";

import type { AppButtonType } from "./buttonTypes";

import "./button.css";

export type AppIconButtonVariant = "layer" | "onImage";
export type AppIconButtonSize = "nav" | "sm" | "md";

export type AppIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: AppIconButtonSize;
  type?: AppButtonType;
  variant?: AppIconButtonVariant;
};

export function AppIconButton({
  ariaLabel,
  children,
  disabled = false,
  id,
  onClick,
  size = "nav",
  type = "button",
  variant = "layer",
}: AppIconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className="AppIconButton"
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
