import type { ReactNode } from "react";

import "./badge.css";

export type AppBadgeSize = "xs" | "sm" | "md" | "lg" | "number-sm" | "number-md" | "number-lg";
export type AppBadgeTone = "neutral" | "brand" | "info" | "warning" | "positive";
export type AppBadgeVariant = "solid" | "weak" | "outline" | "surface";
export type AppBadgeTextPolicy = "truncate" | "singleLine" | "twoLines";
export type AppBadgeWidth = "content" | "fill";

export type AppBadgeProps = {
  ariaLabel?: string;
  children: ReactNode;
  leading?: ReactNode;
  size?: AppBadgeSize;
  tone?: AppBadgeTone;
  variant?: AppBadgeVariant;
  textPolicy?: AppBadgeTextPolicy;
  width?: AppBadgeWidth;
};

export function AppBadge({
  ariaLabel,
  children,
  leading,
  size = "md",
  tone = "neutral",
  variant = "surface",
  textPolicy = "truncate",
  width = "content",
}: AppBadgeProps) {
  return (
    <span
      aria-label={ariaLabel}
      className="AppBadge"
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      data-text-policy={textPolicy}
      data-width={width}
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
