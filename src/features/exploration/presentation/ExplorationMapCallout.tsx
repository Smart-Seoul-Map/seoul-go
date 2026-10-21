import { useId, useState, type ReactElement } from "react";

import { AppCallout, type AppCalloutProps } from "@shared/ui/callout";

import "./linked-places.css";

type ExplorationMapCalloutProps = AppCalloutProps & {
  expandKey?: string;
  isCharacterMoving?: boolean;
};

export function ExplorationMapCallout({
  expandKey,
  isCharacterMoving = false,
  ...calloutProps
}: ExplorationMapCalloutProps): ReactElement {
  const calloutId = useId();
  const [isOpen, setIsOpen] = useState(true);
  const [openedKey, setOpenedKey] = useState(expandKey);
  const [wasCharacterMoving, setWasCharacterMoving] = useState(isCharacterMoving);

  if (expandKey !== openedKey) {
    setOpenedKey(expandKey);
    setIsOpen(true);
  }
  if (isCharacterMoving !== wasCharacterMoving) {
    setWasCharacterMoving(isCharacterMoving);
    if (isCharacterMoving) setIsOpen(false);
  }

  return (
    <div className="ExplorationMapCallout" data-open={isOpen}>
      <AppCallout {...calloutProps} id={calloutId} />
      <button
        type="button"
        className="ExplorationMapCallout-toggle"
        aria-controls={calloutId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "안내 접기" : "안내 펼치기"}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}
