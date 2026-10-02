import type { ReactElement } from "react";
import { AppCallout } from "@shared/ui/callout";
import { EXPLORATION_CALLOUT_MESSAGES } from "../config/explorationCalloutMessages";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";
import "./linked-places.css";

type LinkedPlacesCalloutProps = {
  selected: LinkedPlaceReference;
};

export function LinkedPlacesCallout({ selected }: LinkedPlacesCalloutProps): ReactElement {
  const messages = EXPLORATION_CALLOUT_MESSAGES.linked;

  return (
    <AppCallout
      className="LinkedPlacesCallout"
      tone="informative"
      role="status"
      prefixIcon="!"
      description={
        <>
          <span>{messages.message}</span>
          <span>{messages.reference(selected.name)}</span>
        </>
      }
    />
  );
}
