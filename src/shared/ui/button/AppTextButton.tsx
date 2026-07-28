import { type AppButtonSharedProps } from "./buttonTypes";

import "./button.css";

export type AppTextButtonVariant = "neutral" | "brand" | "danger";
export type AppTextButtonSize = "sm" | "md";

export type AppTextButtonProps = AppButtonSharedProps & {
  size?: AppTextButtonSize;
  variant?: AppTextButtonVariant;
};

export function AppTextButton({
  children,
  disabled = false,
  id,
  onClick,
  size = "md",
  type = "button",
  variant = "neutral",
}: AppTextButtonProps) {
  return (
    <button
      className="AppTextButton"
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
