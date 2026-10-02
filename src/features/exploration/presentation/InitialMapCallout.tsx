import type { ReactElement } from "react";

import { AppCallout } from "@shared/ui/callout";

import { EXPLORATION_CALLOUT_MESSAGES } from "../config/explorationCalloutMessages";
import "./linked-places.css";

export function InitialMapCallout(): ReactElement {
  const messages = EXPLORATION_CALLOUT_MESSAGES.initial;

  return (
    <AppCallout
      className="LinkedPlacesCallout"
      tone="informative"
      role="status"
      prefixIcon="!"
      description={
        <>
          <span>{messages.message}</span>
          <span>{messages.description}</span>
        </>
      }
    />
  );
}
