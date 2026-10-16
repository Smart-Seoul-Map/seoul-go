import { useEffect, useRef, useState, type ReactElement, type RefObject } from "react";

import { createIntroLayoutStageSrc, type IntroLayoutStageView } from "./introLayoutEditorConfig";

type IntroLayoutViewport = {
  width: number;
  height: number;
};

type IntroLayoutStageFrameProps = {
  title: string;
  view: IntroLayoutStageView;
  viewport: IntroLayoutViewport;
  frameRef: RefObject<HTMLIFrameElement | null>;
  isHidden?: boolean;
};

export function IntroLayoutStageFrame({
  title,
  view,
  viewport,
  frameRef,
  isHidden = false,
}: IntroLayoutStageFrameProps): ReactElement {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const scale = useFitScale(areaRef, viewport);

  return (
    <div ref={areaRef} className="IntroLayoutStageFrame" data-hidden={isHidden}>
      <div
        className="IntroLayoutStageFrame-box"
        style={{ width: viewport.width * scale, height: viewport.height * scale }}
      >
        <iframe
          ref={frameRef}
          title={title}
          src={createIntroLayoutStageSrc(view)}
          width={viewport.width}
          height={viewport.height}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

function useFitScale(
  areaRef: RefObject<HTMLDivElement | null>,
  { width, height }: IntroLayoutViewport
): number {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const area = areaRef.current;

    if (!area) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const bounds = entry.contentRect;

      setScale(Math.min(bounds.width / width, bounds.height / height));
    });
    observer.observe(area);

    return () => observer.disconnect();
  }, [areaRef, height, width]);

  return scale;
}
