import type { CSSProperties, ReactElement, ReactNode } from "react";
import {
  AppResponsivePanel,
  FLOATING_PANEL_SIDE_OPTIONS,
  FLOATING_PANEL_SHEET_OPTIONS,
  type AppResponsivePanelContentProps,
  useResponsivePanelPresentation,
  type AppResponsivePanelRootProps,
  type PanelSnapPoint,
} from "@shared/ui/responsive-panel";
import { PlaceDetailCard, type PlaceDetailCardProps } from "./PlaceDetailCard";
import { PlaceDetailExternalLink } from "./PlaceDetailExternalLink";

export type PlaceDetailPanelProps = Pick<
  AppResponsivePanelRootProps,
  "open" | "onOpenChange" | "defaultOpen" | "modal"
> &
  Pick<AppResponsivePanelContentProps, "onExitComplete" | "returnFocus"> & {
    place: PlaceDetailCardProps;
    trigger?: ReactElement;
    footer?: ReactNode;
    headerLeading?: ReactNode;
    headerTrailing?: ReactNode;
    mobileAboveContent?: ReactNode;
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
  headerTrailing,
  mobileAboveContent,
  children,
  className,
  style,
  onExitComplete,
  returnFocus,
}: Pick<
  PlaceDetailPanelProps,
  | "place"
  | "footer"
  | "headerLeading"
  | "headerTrailing"
  | "mobileAboveContent"
  | "children"
  | "className"
  | "onExitComplete"
  | "returnFocus"
> & {
  style: PlaceDetailPanelStyle;
}): ReactElement {
  const presentation = useResponsivePanelPresentation();
  const isBottomSheet = presentation === "bottom-sheet";
  const hasPanelHeader = !!headerLeading || !!headerTrailing;

  return (
    <AppResponsivePanel.Content
      onExitComplete={onExitComplete}
      returnFocus={returnFocus}
      title={place.title}
      hideTitle={!isBottomSheet && !hasPanelHeader}
      headerLeading={headerLeading}
      headerTrailing={headerTrailing}
      showCloseButton={false}
      showHandle
      width="var(--sg-detail-width)"
      className={["PlaceDetailPanel", className].filter(Boolean).join(" ")}
      style={style}
    >
      {isBottomSheet && mobileAboveContent && (
        <div className="PlaceDetailPanelAbove">{mobileAboveContent}</div>
      )}
      <AppResponsivePanel.Body className="PlaceDetailPanelBody" aria-label="장소 상세 정보">
        <PanelPlaceCard place={place} hasPanelHeader={hasPanelHeader} />
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
  headerTrailing,
  mobileAboveContent,
  children,
  className,
  mobileMaxHeight,
  mobileSnapPoints,
  mobileActiveSnapPoint,
  onMobileSnapPointChange,
  onExitComplete,
  returnFocus,
  ...rootProps
}: PlaceDetailPanelProps): ReactElement {
  const style: PlaceDetailPanelStyle = {
    "--place-detail-mobile-max-height":
      typeof mobileMaxHeight === "number" ? `${mobileMaxHeight}px` : mobileMaxHeight,
  };

  return (
    <AppResponsivePanel.Root
      {...rootProps}
      sidePanelRootProps={FLOATING_PANEL_SIDE_OPTIONS}
      bottomSheetRootProps={{
        ...FLOATING_PANEL_SHEET_OPTIONS,
        snapPoints: mobileSnapPoints ?? FLOATING_PANEL_SHEET_OPTIONS.snapPoints,
        activeSnapPoint: mobileActiveSnapPoint,
        setActiveSnapPoint: onMobileSnapPointChange,
      }}
    >
      {trigger && <AppResponsivePanel.Trigger asChild>{trigger}</AppResponsivePanel.Trigger>}
      <PlaceDetailPanelContent
        onExitComplete={onExitComplete}
        returnFocus={returnFocus}
        place={place}
        footer={footer}
        headerLeading={headerLeading}
        headerTrailing={headerTrailing}
        mobileAboveContent={mobileAboveContent}
        className={className}
        style={style}
      >
        {children}
      </PlaceDetailPanelContent>
    </AppResponsivePanel.Root>
  );
}
