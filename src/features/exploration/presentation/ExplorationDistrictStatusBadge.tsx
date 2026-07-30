import type { ReactElement } from "react";

import { AppBadge } from "@shared/ui/badge";

export type ExplorationDistrictStatusBadgeProps = {
  districtName: string;
};

export function ExplorationDistrictStatusBadge({
  districtName,
}: ExplorationDistrictStatusBadgeProps): ReactElement {
  return (
    <AppBadge
      ariaLabel={`현재 ${districtName} 탐방중`}
      leading={<span className="exploration-district-status-badge-dot" />}
      size="lg"
      tone="warning"
      variant="solid"
    >
      {districtName} 탐방중
    </AppBadge>
  );
}
