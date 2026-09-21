import type { ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";

export type ExplorationDistrictStatusBadgeProps = {
  districtName: string;
};

export function ExplorationDistrictStatusBadge({
  districtName,
}: ExplorationDistrictStatusBadgeProps): ReactElement {
  return (
    <AppBadge ariaLabel={`현재 ${districtName} 탐방중`} size="lg" tone="neutral" variant="solid">
      {districtName}
    </AppBadge>
  );
}
