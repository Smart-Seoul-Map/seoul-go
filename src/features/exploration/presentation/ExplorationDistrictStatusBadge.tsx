import type { ReactElement } from "react";

import { AppBadge, type AppBadgeSize } from "@shared/ui/badge";

export type ExplorationDistrictStatusBadgeProps = {
  districtName: string;
  size?: AppBadgeSize;
};

export function ExplorationDistrictStatusBadge({
  districtName,
  size = "md",
}: ExplorationDistrictStatusBadgeProps): ReactElement {
  return (
    <AppBadge
      ariaLabel={`현재 ${districtName} 탐방중`}
      size={size}
      tone="neutral"
      variant="solid"
      textPolicy="singleLine"
    >
      {districtName}
    </AppBadge>
  );
}
