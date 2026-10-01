import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

import "./callout.css";

export type AppCalloutTone = "neutral" | "informative";
export type AppCalloutRole = "note" | "status" | "alert";

export type AppCalloutProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "title" | "role" | "tabIndex" | "onClick"
> & {
  title?: ReactNode;
  description: ReactNode;
  prefixIcon?: ReactNode;
  tone?: AppCalloutTone;
  role?: AppCalloutRole;
};

export function AppCallout({
  title,
  description,
  prefixIcon,
  tone = "neutral",
  role = "note",
  className,
  ...props
}: AppCalloutProps): ReactElement {
  const hasTitle = title !== undefined && title !== null && title !== false && title !== "";
  const hasIcon = prefixIcon !== undefined && prefixIcon !== null && prefixIcon !== false;

  return (
    <div
      aria-atomic={role === "note" ? undefined : true}
      {...props}
      className={["AppCallout", className].filter(Boolean).join(" ")}
      data-tone={tone}
      role={role}
    >
      {hasIcon && (
        <span className="AppCallout-icon" aria-hidden="true">
          {prefixIcon}
        </span>
      )}
      <div className="AppCallout-content">
        {hasTitle && (
          <>
            <span className="AppCallout-title">{title}</span>
            <span className="AppCallout-separator">{"  "}</span>
          </>
        )}
        <span className="AppCallout-description">{description}</span>
      </div>
    </div>
  );
}
