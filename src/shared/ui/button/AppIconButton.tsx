import type { ReactNode } from "react";

import type { AppButtonType } from "./buttonTypes";

import "./button.css";

export type AppIconButtonVariant = "layer" | "onImage";
export type AppIconButtonSize = "nav" | "sm" | "md";

export type AppIconButtonProps = {
  ariaExpanded?: boolean;
  ariaHasPopup?: React.AriaAttributes["aria-haspopup"];
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: AppIconButtonSize;
  title?: string;
  type?: AppButtonType;
  variant?: AppIconButtonVariant;
};

export function AppIconButton({
  ariaExpanded,
  ariaHasPopup,
  ariaLabel,
  children,
  className,
  disabled = false,
  id,
  onClick,
  size = "nav",
  title,
  type = "button",
  variant = "layer",
}: AppIconButtonProps) {
  return (
    <button
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-label={ariaLabel}
      className={className ? `AppIconButton ${className}` : "AppIconButton"}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      id={id}
      onClick={onClick}
      title={title}
      type={type}
    >
      {children}
    </button>
  );
}
