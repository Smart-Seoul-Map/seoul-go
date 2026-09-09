import type { CSSProperties, ReactElement, ReactNode } from "react";
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
  mobileMaxHeight?: CSSProperties["maxHeight"];
};

type PlaceDetailPanelStyle = CSSProperties & {
  "--place-detail-mobile-max-height"?: CSSProperties["maxHeight"];
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
  mobileMaxHeight,
  ...rootProps
}: PlaceDetailPanelProps): ReactElement {
  const style: PlaceDetailPanelStyle = {
    "--place-detail-mobile-max-height":
      typeof mobileMaxHeight === "number" ? `${mobileMaxHeight}px` : mobileMaxHeight,
  };

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
        style={style}
      >
        <AppResponsivePanel.Body className="PlaceDetailPanelBody">
          <PanelPlaceCard place={place} />
        </AppResponsivePanel.Body>
        {footer && <AppResponsivePanel.Footer>{footer}</AppResponsivePanel.Footer>}
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
