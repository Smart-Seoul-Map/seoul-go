import type { ReactNode } from "react";

import "./typography.css";

export type AppCaptionElement = "p" | "span";
export type AppCaptionTone = "muted" | "subtle" | "danger";
export type AppCaptionAlign = "start" | "center" | "end";
export type AppCaptionMaxLines = 1 | 2 | 3;

export type AppCaptionProps = {
  align?: AppCaptionAlign;
  as?: AppCaptionElement;
  children: ReactNode;
  id?: string;
  maxLines?: AppCaptionMaxLines;
  tone?: AppCaptionTone;
};

export function AppCaption({
  align = "start",
  as: Component = "p",
  children,
  id,
  maxLines,
  tone = "muted",
}: AppCaptionProps) {
  return (
    <Component
      className="AppCaption"
      data-align={align}
      data-max-lines={maxLines}
      data-tone={tone}
      id={id}
    >
      {children}
    </Component>
  );
}
