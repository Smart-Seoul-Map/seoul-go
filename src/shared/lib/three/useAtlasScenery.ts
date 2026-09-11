import { useEffect } from "react";
import type { Object3D } from "three";

import { createAtlasScenery, type AtlasSceneryOptions } from "./atlasScenery";

export function useAtlasScenery<Key extends string>(
  parent: Object3D | null,
  options: AtlasSceneryOptions<Key>
): void {
  useEffect(() => {
    if (!parent) return;

    const scenery = createAtlasScenery(options);
    parent.add(scenery.object);

    return () => scenery.dispose();
  }, [parent, options]);
}
