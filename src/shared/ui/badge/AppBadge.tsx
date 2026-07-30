import type { ReactNode } from "react";

import "./badge.css";

export type AppBadgeSize = "md" | "lg";
export type AppBadgeTone = "neutral" | "brand" | "info" | "warning" | "positive";
export type AppBadgeVariant = "solid" | "weak" | "outline";

export type AppBadgeProps = {
  ariaLabel?: string;
  children: ReactNode;
  leading?: ReactNode;
  size?: AppBadgeSize;
  tone?: AppBadgeTone;
  variant?: AppBadgeVariant;
};

export function AppBadge({
  ariaLabel,
  children,
  leading,
  size = "md",
  tone = "neutral",
  variant = "solid",
}: AppBadgeProps) {
  return (
    <span
      aria-label={ariaLabel}
      className="AppBadge"
      data-size={size}
      data-tone={tone}
      data-variant={variant}
    >
      {leading ? (
        <span aria-hidden="true" className="AppBadge-leading">
          {leading}
        </span>
      ) : null}
      <span className="AppBadge-content">{children}</span>
    </span>
  );
}
