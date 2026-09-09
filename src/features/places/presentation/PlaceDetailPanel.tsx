import type { ReactElement, ReactNode } from "react";
import {
  AppResponsivePanel,
  useResponsivePanelPresentation,
  type AppResponsivePanelRootProps,
} from "@shared/ui/responsive-panel";
import { PlaceDetailCard, type PlaceDetailCardProps } from "./PlaceDetailCard";

export type PlaceDetailPanelProps = Pick<
  AppResponsivePanelRootProps,
  "open" | "onOpenChange" | "defaultOpen" | "modal"
> & {
  place: PlaceDetailCardProps;
  trigger?: ReactElement;
  footer?: ReactNode;
};

function PanelPlaceCard({ place }: Pick<PlaceDetailPanelProps, "place">): ReactElement {
  const presentation = useResponsivePanelPresentation();
  return (
    <PlaceDetailCard {...place} subtitle={presentation === "bottom-sheet" ? "" : place.subtitle} />
  );
}

export function PlaceDetailPanel({
  place,
  trigger,
  footer,
  ...rootProps
}: PlaceDetailPanelProps): ReactElement {
  return (
    <AppResponsivePanel.Root
      {...rootProps}
      sidePanelRootProps={{ presentation: "floating", direction: "right", size: "small" }}
      bottomSheetRootProps={{ handleOnly: true }}
    >
      {trigger && <AppResponsivePanel.Trigger asChild>{trigger}</AppResponsivePanel.Trigger>}
      <AppResponsivePanel.Content
        title={place.title}
        hideTitle
        showHandle
        width="var(--sg-detail-width)"
        className="PlaceDetailPanel"
      >
        <AppResponsivePanel.Body className="PlaceDetailPanelBody">
          <PanelPlaceCard place={place} />
        </AppResponsivePanel.Body>
        {footer && <AppResponsivePanel.Footer>{footer}</AppResponsivePanel.Footer>}
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
