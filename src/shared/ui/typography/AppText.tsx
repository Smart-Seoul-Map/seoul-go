import type { ReactNode } from "react";

import "./typography.css";

export type AppTextElement = "p" | "span" | "div";
export type AppTextRole = "body" | "supporting" | "dialogBody";
export type AppTextTone = "default" | "muted" | "subtle" | "disabled" | "brand" | "danger";
export type AppTextAlign = "start" | "center" | "end";
export type AppTextMaxLines = 1 | 2 | 3;

export type AppTextProps = {
  as?: AppTextElement;
  align?: AppTextAlign;
  children: ReactNode;
  id?: string;
  maxLines?: AppTextMaxLines;
  role?: AppTextRole;
  tone?: AppTextTone;
};

export function AppText({
  align = "start",
  as: Component = "p",
  children,
  id,
  maxLines,
  role = "body",
  tone = "default",
}: AppTextProps) {
  return (
    <Component
      className="AppText"
      data-align={align}
      data-max-lines={maxLines}
      data-role={role}
      data-tone={tone}
      id={id}
    >
      {children}
    </Component>
  );
}
