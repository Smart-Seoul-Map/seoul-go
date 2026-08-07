import { useEffect, useId, useRef, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { AppIconButton } from "../button";
import { AppDialogActions, AppVStack } from "../layout";
import { AppHeading, AppText, type AppHeadingSize, type AppTextTone } from "../typography";

import "./dialog.css";

export type AppDialogRole = "dialog" | "alertdialog";
export type AppDialogAppearance = "surface" | "guide";

export type AppDialogIconAction = {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
};

export type AppDialogProps = {
  actions?: ReactNode;
  appearance?: AppDialogAppearance;
  backAction?: AppDialogIconAction;
  children: ReactNode;
  closeAction?: AppDialogIconAction;
  closeOnEscape?: boolean;
  closeOnInteractOutside?: boolean;
  description?: ReactNode;
  descriptionTone?: AppTextTone;
  onOpenChange?: (open: boolean) => void;
  open: boolean;
  role?: AppDialogRole;
  title: ReactNode;
  titleSize?: AppHeadingSize;
};

function getDialogPortalRoot(): HTMLElement {
  return document.body;
}

export function AppDialog({
  actions,
  appearance = "surface",
  backAction,
  children,
  closeAction,
  closeOnEscape = true,
  closeOnInteractOutside = false,
  description,
  descriptionTone = "muted",
  onOpenChange,
  open,
  role = "dialog",
  title,
  titleSize = "md",
}: AppDialogProps): ReactElement | null {
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || !closeOnEscape || !onOpenChange) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const buttons = Array.from(actionsRef.current?.querySelectorAll("button") ?? []);
    buttons.at(-1)?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = () => {
    if (closeOnInteractOutside) {
      onOpenChange?.(false);
    }
  };

  return createPortal(
    <div
      className="AppDialogBackdrop"
      data-appearance={appearance}
      data-testid="app-dialog-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="AppDialog"
        data-appearance={appearance}
        onClick={(event) => event.stopPropagation()}
        role={role}
      >
        <header className="AppDialogHeader">
          <div className="AppDialogHeaderActionSlot">
            {backAction && (
              <AppIconButton
                ariaLabel={backAction.ariaLabel}
                onClick={backAction.onClick}
                size="sm"
                variant="layer"
              >
                {backAction.children}
              </AppIconButton>
            )}
          </div>
          <AppVStack align="stretch" gap="xs">
            <AppHeading as="h2" id={titleId} size={titleSize}>
              {title}
            </AppHeading>
            {description && (
              <AppText id={descriptionId} role="supporting" tone={descriptionTone}>
                {description}
              </AppText>
            )}
          </AppVStack>
          <div className="AppDialogHeaderActionSlot">
            {closeAction && (
              <AppIconButton
                ariaLabel={closeAction.ariaLabel}
                onClick={closeAction.onClick}
                size="sm"
                variant="layer"
              >
                {closeAction.children}
              </AppIconButton>
            )}
          </div>
        </header>
        <main className="AppDialogBody">{children}</main>
        {actions && (
          <footer className="AppDialogFooter" ref={actionsRef}>
            <AppDialogActions>{actions}</AppDialogActions>
          </footer>
        )}
      </section>
    </div>,
    getDialogPortalRoot()
  );
}
