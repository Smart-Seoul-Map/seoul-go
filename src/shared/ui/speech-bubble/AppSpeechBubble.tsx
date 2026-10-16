import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

import "./speech-bubble.css";

type SpeechBubbleCapSide = "start" | "end";

export type AppSpeechBubbleProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  speaker: ReactNode;
  message: ReactNode;
};

const CAP_PATH =
  "M64 0C33.5 0 0 4.6 0 29.6C0 45.1 12.4 45.5 12.4 56C12.4 59 10.6 62.4 10.6 65.9C10.6 82.9 48 84 64 84";

function SpeechBubbleCap({ side }: { side: SpeechBubbleCapSide }): ReactElement {
  return (
    <svg
      className="AppSpeechBubble-cap"
      data-side={side}
      viewBox="0 0 64 84"
      preserveAspectRatio="none"
      focusable="false"
    >
      <path d={CAP_PATH} />
    </svg>
  );
}

export function AppSpeechBubble({
  speaker,
  message,
  className,
  ...props
}: AppSpeechBubbleProps): ReactElement {
  return (
    <div {...props} className={["AppSpeechBubble", className].filter(Boolean).join(" ")}>
      <span className="AppSpeechBubble-frame" aria-hidden="true">
        <SpeechBubbleCap side="start" />
        <span className="AppSpeechBubble-body" />
        <SpeechBubbleCap side="end" />
      </span>
      <span className="AppSpeechBubble-speaker">{speaker}</span>
      <p className="AppSpeechBubble-message">{message}</p>
    </div>
  );
}
