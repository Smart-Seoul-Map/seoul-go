import type { ReactElement } from "react";

import { InitialMapCallout, LinkedPlacesCallout } from "@features/exploration";

import type { useLinkedPlaceExploration } from "./useLinkedPlaceExploration";

type ExplorationMapNoticeProps = {
  initialPlacesReady: boolean;
  linked: Pick<ReturnType<typeof useLinkedPlaceExploration>, "selected" | "isSuccess" | "places">;
};

export function ExplorationMapNotice({
  initialPlacesReady,
  linked,
}: ExplorationMapNoticeProps): ReactElement | null {
  if (linked.selected) {
    if (!linked.isSuccess || linked.places.length === 0) return null;

    return <LinkedPlacesCallout selected={linked.selected} />;
  }

  return initialPlacesReady ? <InitialMapCallout /> : null;
}
