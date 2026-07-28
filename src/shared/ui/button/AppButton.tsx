import { type AppButtonSharedProps } from "./buttonTypes";

import "./button.css";

export type AppButtonVariant = "primary" | "secondary" | "strong" | "danger" | "outline" | "ghost";
export type AppButtonSize = "xs" | "sm" | "md" | "lg";

export type AppButtonProps = AppButtonSharedProps & {
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
}: AppButtonProps) {
  return (
    <button
      className="AppButton"
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
