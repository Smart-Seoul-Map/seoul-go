import type { ReactElement } from "react";
import { EXPLORATION_CALLOUT_MESSAGES } from "../config/explorationCalloutMessages";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";
import { ExplorationMapCallout } from "./ExplorationMapCallout";
import "./linked-places.css";

type LinkedPlacesCalloutProps = {
  selected: LinkedPlaceReference;
  isCharacterMoving?: boolean;
};

export function LinkedPlacesCallout({
  selected,
  isCharacterMoving,
}: LinkedPlacesCalloutProps): ReactElement {
  const messages = EXPLORATION_CALLOUT_MESSAGES.linked;

  return (
    <ExplorationMapCallout
      className="LinkedPlacesCallout"
      tone="informative"
      role="status"
      prefixIcon="!"
      expandKey={selected.id}
      isCharacterMoving={isCharacterMoving}
      description={
        <>
          <span>{messages.message}</span>
          <span>{messages.reference(selected.name)}</span>
        </>
      }
    />
  );
}
