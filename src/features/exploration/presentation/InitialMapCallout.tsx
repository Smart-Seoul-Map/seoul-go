import type { ReactElement } from "react";

import { EXPLORATION_CALLOUT_MESSAGES } from "../config/explorationCalloutMessages";
import { ExplorationMapCallout } from "./ExplorationMapCallout";
import "./linked-places.css";

type InitialMapCalloutProps = {
  isCharacterMoving?: boolean;
};

export function InitialMapCallout({ isCharacterMoving }: InitialMapCalloutProps): ReactElement {
  const messages = EXPLORATION_CALLOUT_MESSAGES.initial;

  return (
    <ExplorationMapCallout
      className="LinkedPlacesCallout"
      tone="informative"
      role="status"
      prefixIcon="!"
      isCharacterMoving={isCharacterMoving}
      description={
        <>
          <span>{messages.message}</span>
          <span>{messages.description}</span>
        </>
      }
    />
  );
}
