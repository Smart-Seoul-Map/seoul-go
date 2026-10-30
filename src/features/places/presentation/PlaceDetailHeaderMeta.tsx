import type { ReactElement } from "react";

import { getSelectionYearBadgeTone } from "@shared/constants/selectionYearBadge";
import { AppBadge } from "@shared/ui/badge";
import { useResponsivePanelPresentation } from "@shared/ui/responsive-panel";

type PlaceDetailHeaderMetaProps = {
  selectionYear?: number | string;
};

export function PlaceDetailHeaderMeta({
  selectionYear,
}: PlaceDetailHeaderMetaProps): ReactElement | null {
  const presentation = useResponsivePanelPresentation();
  if (selectionYear === undefined) return null;

  return (
    <div className="PlaceDetailMeta">
      <AppBadge
        size={presentation === "bottom-sheet" ? "number-sm" : "number-md"}
        tone={getSelectionYearBadgeTone(selectionYear)}
        variant="solid"
        textPolicy="singleLine"
      >
        {selectionYear}
      </AppBadge>
    </div>
  );
}
