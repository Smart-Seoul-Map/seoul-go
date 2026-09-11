import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  AppResponsivePanel,
  useResponsivePanelPresentation,
  type AppResponsivePanelRootProps,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import { PlaceDetailCard, type PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailExternalLink } from "./PlaceDetailExternalLink";

export type PlaceDetailPanelProps = Pick<
  AppResponsivePanelRootProps,
  "open" | "onOpenChange" | "defaultOpen" | "modal"
> & {
  place: PlaceDetailCardProps;
  trigger?: ReactElement;
  footer?: ReactNode;
  mobileMaxHeight?: CSSProperties["maxHeight"];
  mobileSnapPoints?: PanelSnapPoint[];
  mobileActiveSnapPoint?: PanelSnapPoint | null;
  onMobileSnapPointChange?: (point: PanelSnapPoint | null) => void;
};

type PlaceDetailPanelStyle = CSSProperties & {
  "--place-detail-mobile-max-height"?: CSSProperties["maxHeight"];
};

function PanelPlaceCard({ place }: Pick<PlaceDetailPanelProps, "place">): ReactElement {
  const presentation = useResponsivePanelPresentation();
  return (
    <PlaceDetailCard
      {...place}
      externalLink={undefined}
      subtitle={presentation === "bottom-sheet" ? "" : place.subtitle}
    />
  );
}

export function PlaceDetailPanel({
  place,
  trigger,
  footer,
  mobileMaxHeight,
  mobileSnapPoints,
  mobileActiveSnapPoint,
  onMobileSnapPointChange,
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
      bottomSheetRootProps={{
        handleOnly: true,
        closeOnFinalSnapClick: false,
        snapPoints: mobileSnapPoints,
        activeSnapPoint: mobileActiveSnapPoint,
        setActiveSnapPoint: onMobileSnapPointChange,
      }}
    >
      {trigger && <AppResponsivePanel.Trigger asChild>{trigger}</AppResponsivePanel.Trigger>}
      <AppResponsivePanel.Content
        title={place.title}
        hideTitle
        showCloseButton={false}
        showHandle
        width="var(--sg-detail-width)"
        className="PlaceDetailPanel"
        style={style}
      >
        <AppResponsivePanel.Body className="PlaceDetailPanelBody">
          <PanelPlaceCard place={place} />
        </AppResponsivePanel.Body>
        {(footer || place.externalLink) && (
          <AppResponsivePanel.Footer className="PlaceDetailPanelFooter">
            {place.externalLink && <PlaceDetailExternalLink {...place.externalLink} />}
            {footer}
          </AppResponsivePanel.Footer>
        )}
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}
