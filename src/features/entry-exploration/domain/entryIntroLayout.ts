import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUT_EDITION_IDS,
  ENTRY_INTRO_LAYOUT_OBJECT_IDS,
  ENTRY_INTRO_LAYOUT_VIEWPORTS,
  type EntryIntroLayout,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutNode,
  type EntryIntroLayoutObjectId,
  type EntryIntroLayoutPlacement,
  type EntryIntroLayoutTransform,
  type EntryIntroLayoutView,
} from "../config/entryIntroLayout";
import type { EntryExplorationScenePoint } from "./entryExplorationSceneMath";

const EDITION_FIRST_PLACE_SCREEN_RATIO = 0.45;
const DEGREES_TO_RADIANS = Math.PI / 180;
const DEFAULT_PLACEMENT: EntryIntroLayoutPlacement = { x: 0, z: 0, scale: 1, rotation: 0 };

export function getEntryIntroLayoutBlend(aspect: number): number {
  const { mobile, pc } = ENTRY_INTRO_LAYOUT_VIEWPORTS;
  const mobileAspect = mobile.width / mobile.height;
  const pcAspect = pc.width / pc.height;
  const blend = (aspect - mobileAspect) / (pcAspect - mobileAspect);

  return Math.min(Math.max(blend, 0), 1);
}

export function toEntryIntroLayoutPlacement(
  transform: EntryIntroLayoutTransform
): EntryIntroLayoutPlacement {
  return {
    x: transform.x,
    z: transform.z,
    scale: transform.scale ?? 1,
    rotation: transform.rotation ?? 0,
  };
}

export function composeEntryIntroLayoutPlacement(
  parent: EntryIntroLayoutPlacement,
  local: EntryIntroLayoutPlacement
): EntryIntroLayoutPlacement {
  const radians = parent.rotation * DEGREES_TO_RADIANS;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = local.x * parent.scale;
  const z = local.z * parent.scale;

  return {
    x: parent.x + x * cos + z * sin,
    z: parent.z - x * sin + z * cos,
    scale: parent.scale * local.scale,
    rotation: parent.rotation + local.rotation,
  };
}

export function decomposeEntryIntroLayoutPlacement(
  parent: EntryIntroLayoutPlacement,
  world: EntryIntroLayoutPlacement
): EntryIntroLayoutPlacement {
  const radians = parent.rotation * DEGREES_TO_RADIANS;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = world.x - parent.x;
  const dz = world.z - parent.z;

  return {
    x: (dx * cos - dz * sin) / parent.scale,
    z: (dx * sin + dz * cos) / parent.scale,
    scale: world.scale / parent.scale,
    rotation: world.rotation - parent.rotation,
  };
}

export function composeEntryIntroLayoutWorld(
  nodes: readonly EntryIntroLayoutNode[],
  locals: ReadonlyMap<string, EntryIntroLayoutPlacement>
): Map<string, EntryIntroLayoutPlacement> {
  const parents = new Map(
    nodes.flatMap((node) => (node.parent ? [[node.id, node.parent] as const] : []))
  );
  const world = new Map<string, EntryIntroLayoutPlacement>();

  const resolve = (id: string, visiting: Set<string>): EntryIntroLayoutPlacement | undefined => {
    const known = world.get(id);

    if (known) return known;

    const local = locals.get(id);

    if (!local) return undefined;

    const parentId = parents.get(id);
    const parentWorld =
      parentId && !visiting.has(parentId)
        ? resolve(parentId, new Set([...visiting, id]))
        : undefined;
    const placement = parentWorld ? composeEntryIntroLayoutPlacement(parentWorld, local) : local;

    world.set(id, placement);

    return placement;
  };

  locals.forEach((_, id) => resolve(id, new Set()));

  return world;
}

export function createEntryIntroLayoutLocals(
  edition: readonly EntryIntroLayoutPlacement[],
  objects: Readonly<Record<string, EntryIntroLayoutPlacement>>
): Map<string, EntryIntroLayoutPlacement> {
  return new Map([
    ...edition.map(
      (placement, index) => [ENTRY_INTRO_LAYOUT_EDITION_IDS[index], placement] as const
    ),
    ...Object.entries(objects),
  ]);
}

export function resolveEntryIntroLayout(
  document: EntryIntroLayoutDocument,
  aspect: number
): EntryIntroLayout {
  const { mobile, pc } = document;
  const blend = getEntryIntroLayoutBlend(aspect);
  const edition = pc.edition.map((transform, index) =>
    blendPlacement(mobile.edition[index] ?? transform, transform, blend)
  );
  const objects = Object.fromEntries(
    Object.entries(pc.objects).map(([id, transform]) => [
      id,
      blendPlacement(mobile.objects[id] ?? transform, transform, blend),
    ])
  );

  return buildEntryIntroLayout(
    document.nodes,
    keepFirstEditionPlaceOnScreen(edition, aspect),
    objects
  );
}

export function resolveEntryIntroLayoutView(
  document: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView
): EntryIntroLayout {
  const { edition, objects } = document[view];

  return buildEntryIntroLayout(
    document.nodes,
    edition.map(toEntryIntroLayoutPlacement),
    Object.fromEntries(
      Object.entries(objects).map(([id, transform]) => [id, toEntryIntroLayoutPlacement(transform)])
    )
  );
}

export function keepFirstEditionPlaceOnScreen<Point extends EntryExplorationScenePoint>(
  edition: readonly Point[],
  aspect: number
): readonly Point[] {
  const { cameraOffset, cameraViewSize, intro } = ENTRY_EXPLORATION_SCENE_CONFIG;
  const length = Math.hypot(cameraOffset.x, cameraOffset.z);
  const forward = { x: cameraOffset.x / length, z: cameraOffset.z / length };
  const right = { x: forward.z, z: -forward.x };
  const first = edition[0];
  const across =
    (first.x - intro.targetPosition.x) * right.x + (first.z - intro.targetPosition.z) * right.z;
  const maxAcross = cameraViewSize * aspect * EDITION_FIRST_PLACE_SCREEN_RATIO;
  const clampedAcross = Math.min(Math.max(across, -maxAcross), maxAcross);
  const shiftRight = clampedAcross - across;
  const shiftForward = Math.abs(across) - Math.abs(clampedAcross);

  return edition.map((point) => ({
    ...point,
    x: point.x + right.x * shiftRight + forward.x * shiftForward,
    z: point.z + right.z * shiftRight + forward.z * shiftForward,
  }));
}

function blendPlacement(
  mobile: EntryIntroLayoutTransform,
  pc: EntryIntroLayoutTransform,
  ratio: number
): EntryIntroLayoutPlacement {
  const from = toEntryIntroLayoutPlacement(mobile);
  const to = toEntryIntroLayoutPlacement(pc);

  return {
    x: from.x + (to.x - from.x) * ratio,
    z: from.z + (to.z - from.z) * ratio,
    scale: from.scale + (to.scale - from.scale) * ratio,
    rotation: from.rotation + (to.rotation - from.rotation) * ratio,
  };
}

function buildEntryIntroLayout(
  nodes: readonly EntryIntroLayoutNode[],
  edition: readonly EntryIntroLayoutPlacement[],
  objects: Readonly<Record<string, EntryIntroLayoutPlacement>>
): EntryIntroLayout {
  const world = composeEntryIntroLayoutWorld(nodes, createEntryIntroLayoutLocals(edition, objects));
  const getWorld = (id: string): EntryIntroLayoutPlacement => world.get(id) ?? DEFAULT_PLACEMENT;

  return {
    edition: edition.map((_, index) => getWorld(ENTRY_INTRO_LAYOUT_EDITION_IDS[index])),
    objects: Object.fromEntries(
      ENTRY_INTRO_LAYOUT_OBJECT_IDS.map((id) => [id, getWorld(id)])
    ) as Record<EntryIntroLayoutObjectId, EntryIntroLayoutPlacement>,
    stickers: nodes.flatMap((node) =>
      node.kind === "sticker" && node.asset
        ? [{ id: node.id, asset: node.asset, placement: getWorld(node.id) }]
        : []
    ),
  };
}
