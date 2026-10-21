import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";

import {
  ENTRY_HANOK_PLACE,
  ENTRY_HANOK_PLACE_ID,
  type EntryEditionPlace,
} from "@features/entry-exploration";
import { useSeoulEditionPlacesQuery, type PlaceDetailCardProps } from "@features/places";

import { ENTRY_EDITION_MODELS } from "../../src/features/entry-exploration/config/entryEditionModels";
import {
  ENTRY_INTRO_LAYOUTS,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutView,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import {
  resolveEntryIntroLayout,
  resolveEntryIntroLayoutView,
} from "../../src/features/entry-exploration/domain/entryIntroLayout";
import { IntroLayoutArrivalPanel } from "./IntroLayoutArrivalPanel";
import type { IntroLayoutStageView } from "./introLayoutEditorConfig";
import {
  getEditionIndex,
  isEditionItemId,
  postIntroLayoutStageMessage,
  readIntroLayoutShellMessage,
  toEditionItemId,
  type IntroLayoutArrivalTarget,
  type IntroLayoutItemId,
} from "./introLayoutEditorMessages";
import {
  createIntroLayoutEditorScene,
  type IntroLayoutEditorScene,
  type IntroLayoutHandle,
} from "./introLayoutEditorScene";
import {
  getIntroLayoutDescendants,
  getIntroLayoutItemIds,
  getIntroLayoutItemKind,
  getIntroLayoutWorld,
} from "./introLayoutTree";

import "../../src/features/entry-exploration/presentation/entry-edition-places.css";
import "../../src/app/router/EntryExplorationRoute.css";
import "./IntroLayoutStage.css";

type IntroLayoutStageProps = {
  view: IntroLayoutStageView;
};

const NO_PLACES: readonly EntryEditionPlace[] = [];
const NO_SELECTION: readonly IntroLayoutItemId[] = [];
const NO_HANDLES: ReadonlyMap<IntroLayoutItemId, IntroLayoutHandle> = new Map();

export function IntroLayoutStage({ view }: IntroLayoutStageProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const query = useSeoulEditionPlacesQuery();
  const places = useMemo(() => selectModeledEditionPlaces(query.data), [query.data]);
  const aspect = useSyncExternalStore(subscribeWindowResize, getWindowAspect);
  const [scene, setScene] = useState<IntroLayoutEditorScene | null>(null);
  const [layoutDocument, setLayoutDocument] =
    useState<EntryIntroLayoutDocument>(ENTRY_INTRO_LAYOUTS);
  const [selectedIds, setSelectedIds] = useState<readonly IntroLayoutItemId[]>(NO_SELECTION);
  const [arrivalId, setArrivalId] = useState<IntroLayoutItemId | null>(null);
  const layout = useMemo(
    () =>
      view === "preview"
        ? resolveEntryIntroLayout(layoutDocument, aspect)
        : resolveEntryIntroLayoutView(layoutDocument, view),
    [aspect, layoutDocument, view]
  );
  const handles = useMemo(
    () => (view === "preview" ? NO_HANDLES : getHandles(layoutDocument, view)),
    [layoutDocument, view]
  );
  const arrivalPlace = arrivalId ? getArrivalPlace(arrivalId, places) : null;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const nextScene = createIntroLayoutEditorScene({
      container,
      isEditable: view !== "preview",
      onMove: (id, point) => {
        if (view !== "preview") {
          postIntroLayoutStageMessage({ type: "move", view, id, point });
        }
      },
      onSelect: (id) => postIntroLayoutStageMessage({ type: "select", id }),
    });
    setScene(nextScene);

    return () => {
      nextScene.dispose();
      setScene(null);
    };
  }, [view]);

  useEffect(() => {
    if (!scene) {
      return;
    }

    scene.setPlaces(places);
    postIntroLayoutStageMessage({ type: "ready", arrivalTargets: getArrivalTargets(places) });
  }, [places, scene]);

  useEffect(() => {
    scene?.setLayout(layout, handles);
  }, [handles, layout, scene]);

  useEffect(() => {
    const primaryId = selectedIds.at(-1) ?? null;
    const relatedIds = selectedIds.flatMap((id) => [
      ...(id === primaryId ? [] : [id]),
      ...getIntroLayoutDescendants(layoutDocument, id),
    ]);

    scene?.setSelection(primaryId, relatedIds);
  }, [layoutDocument, scene, selectedIds]);

  useEffect(() => {
    if (!scene) {
      return;
    }

    const handleMessage = (event: MessageEvent<unknown>) => {
      const message = readIntroLayoutShellMessage(event);

      if (!message) {
        return;
      }

      switch (message.type) {
        case "state":
          setLayoutDocument(message.document);
          setSelectedIds(message.selectedIds);
          return;
        case "focus":
          setArrivalId(message.arrivalId);

          if (message.arrivalId) {
            scene.focusOnItem(message.arrivalId);
          }

          return;
        case "camera":
          scene.showCameraPreset(message.preset);
          return;
        case "floor":
          scene.setFloorTexture(message.textureUrl);
          return;
        case "models":
          scene.setModelUrls(message.urls);
          return;
        case "stickers":
          scene.setStickerUrls(message.urls);
          return;
        default: {
          const unhandled: never = message;
          return unhandled;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [scene]);

  const handleArrivalClose = (): void => {
    setArrivalId(null);
    postIntroLayoutStageMessage({ type: "closeArrival" });
  };

  return (
    <main className="entry-exploration-page IntroLayoutStage">
      <div
        ref={containerRef}
        aria-label="인트로 배치 편집 화면"
        className="entry-exploration-scene"
      />
      {arrivalPlace && (
        <IntroLayoutArrivalPanel
          key={arrivalId}
          place={arrivalPlace}
          onClose={handleArrivalClose}
        />
      )}
    </main>
  );
}

function subscribeWindowResize(callback: () => void): () => void {
  window.addEventListener("resize", callback);

  return () => window.removeEventListener("resize", callback);
}

function getWindowAspect(): number {
  return Math.max(window.innerWidth, 1) / Math.max(window.innerHeight, 1);
}

function getHandles(
  layoutDocument: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView
): Map<IntroLayoutItemId, IntroLayoutHandle> {
  const world = getIntroLayoutWorld(layoutDocument, view);

  return new Map(
    getIntroLayoutItemIds(layoutDocument).flatMap((id) => {
      const placement = world.get(id);
      const kind = getIntroLayoutItemKind(layoutDocument, id);

      if (!placement || !kind) {
        return [];
      }

      return [[id, { point: { x: placement.x, z: placement.z }, kind }] as const];
    })
  );
}

function selectModeledEditionPlaces(
  source: readonly EntryEditionPlace[] | undefined
): readonly EntryEditionPlace[] {
  if (!source) {
    return NO_PLACES;
  }

  return Object.keys(ENTRY_EDITION_MODELS).flatMap(
    (id) => source.find((place) => place.id === id) ?? []
  );
}

function getArrivalTargets(places: readonly EntryEditionPlace[]): IntroLayoutArrivalTarget[] {
  return [
    ...places.map((place, index) => ({ id: toEditionItemId(index), name: place.name })),
    { id: ENTRY_HANOK_PLACE_ID, name: ENTRY_HANOK_PLACE.title },
  ];
}

function getArrivalPlace(
  id: IntroLayoutItemId,
  places: readonly EntryEditionPlace[]
): PlaceDetailCardProps | null {
  if (id === ENTRY_HANOK_PLACE_ID) {
    return ENTRY_HANOK_PLACE;
  }

  const place = isEditionItemId(id) ? places[getEditionIndex(id)] : undefined;

  if (!place) {
    return null;
  }

  return {
    title: place.name,
    description: place.description,
    address: place.address,
    subtitle: place.selectionYear ? `${place.selectionYear} · 서울에디션` : "서울에디션",
    image: { src: place.imageUrl, alt: place.name },
  };
}
