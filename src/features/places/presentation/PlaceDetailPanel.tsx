import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  AppResponsivePanel,
  useResponsivePanelPresentation,
  type AppResponsivePanelRootProps,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import { PlaceDetailCard, type PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailExternalLink } from "./PlaceDetailExternalLink";

const PLACE_DETAIL_SHEET_SNAP_POINTS = [0.5, 0.9] as const;

export type PlaceDetailPanelProps = Pick<
  AppResponsivePanelRootProps,
  "open" | "onOpenChange" | "defaultOpen" | "modal"
> & {
  place: PlaceDetailCardProps;
  trigger?: ReactElement;
  footer?: ReactNode;
  headerLeading?: ReactNode;
  children?: ReactNode;
  className?: string;
  mobileMaxHeight?: CSSProperties["maxHeight"];
  mobileSnapPoints?: PanelSnapPoint[];
  mobileActiveSnapPoint?: PanelSnapPoint | null;
  onMobileSnapPointChange?: (point: PanelSnapPoint | null) => void;
};

type PlaceDetailPanelStyle = CSSProperties & {
  "--place-detail-mobile-max-height"?: CSSProperties["maxHeight"];
};

function PanelPlaceCard({
  place,
  hasPanelHeader,
}: Pick<PlaceDetailPanelProps, "place"> & { hasPanelHeader: boolean }): ReactElement {
  const presentation = useResponsivePanelPresentation();
  return (
    <PlaceDetailCard
      {...place}
      externalLink={undefined}
      showHeader={!hasPanelHeader && presentation !== "bottom-sheet"}
      subtitle={presentation === "bottom-sheet" ? "" : place.subtitle}
    />
  );
}

function PlaceDetailPanelContent({
  place,
  footer,
  headerLeading,
  children,
  className,
  style,
}: Pick<PlaceDetailPanelProps, "place" | "footer" | "headerLeading" | "children" | "className"> & {
  style: PlaceDetailPanelStyle;
}): ReactElement {
  const presentation = useResponsivePanelPresentation();
  const isBottomSheet = presentation === "bottom-sheet";

  return (
    <AppResponsivePanel.Content
      title={place.title}
      hideTitle={!isBottomSheet && !headerLeading}
      headerLeading={headerLeading}
      showCloseButton={false}
      showHandle
      width="var(--sg-detail-width)"
      className={["PlaceDetailPanel", className].filter(Boolean).join(" ")}
      style={style}
    >
      <AppResponsivePanel.Body className="PlaceDetailPanelBody">
        <PanelPlaceCard place={place} hasPanelHeader={!!headerLeading} />
        {children}
      </AppResponsivePanel.Body>
      {(footer || place.externalLink) && (
        <AppResponsivePanel.Footer className="PlaceDetailPanelFooter">
          {place.externalLink && <PlaceDetailExternalLink {...place.externalLink} />}
          {footer}
        </AppResponsivePanel.Footer>
      )}
    </AppResponsivePanel.Content>
  );
}

export function PlaceDetailPanel({
  place,
  trigger,
  footer,
  headerLeading,
  children,
  className,
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
        snapPoints: mobileSnapPoints ?? [...PLACE_DETAIL_SHEET_SNAP_POINTS],
        activeSnapPoint: mobileActiveSnapPoint,
        setActiveSnapPoint: onMobileSnapPointChange,
        closeOnEscape: true,
        closeOnInteractOutside: true,
        lazyMount: true,
        unmountOnExit: true,
      }}
    >
      {trigger && <AppResponsivePanel.Trigger asChild>{trigger}</AppResponsivePanel.Trigger>}
      <PlaceDetailPanelContent
        place={place}
        footer={footer}
        headerLeading={headerLeading}
        className={className}
        style={style}
      >
        {children}
      </PlaceDetailPanelContent>
    </AppResponsivePanel.Root>
  );
}
