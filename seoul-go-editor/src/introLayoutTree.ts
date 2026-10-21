import { ENTRY_EXPLORATION_SCENE_CONFIG } from "../../src/features/entry-exploration/config/entryExplorationSceneConfig";
import {
  ENTRY_INTRO_LAYOUT_MODEL_IDS,
  ENTRY_INTRO_LAYOUT_OBJECT_IDS,
  ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS,
  type EntryIntroLayoutDocument,
  type EntryIntroLayoutNode,
  type EntryIntroLayoutPlacement,
  type EntryIntroLayoutTransform,
  type EntryIntroLayoutView,
  type EntryIntroLayoutViewData,
} from "../../src/features/entry-exploration/config/entryIntroLayout";
import {
  composeEntryIntroLayoutWorld,
  createEntryIntroLayoutLocals,
  decomposeEntryIntroLayoutPlacement,
  toEntryIntroLayoutPlacement,
} from "../../src/features/entry-exploration/domain/entryIntroLayout";
import type { EntryExplorationScenePoint } from "../../src/features/entry-exploration/domain/entryExplorationSceneMath";

export type IntroLayoutItemKind = "model" | "fixed" | "group" | "sticker" | "draftModel";

export type IntroLayoutTreeItem = {
  id: string;
  kind: IntroLayoutItemKind;
  children: readonly IntroLayoutTreeItem[];
};

export type IntroLayoutTransformPatch = Partial<EntryIntroLayoutPlacement>;

export type IntroLayoutDropPosition = "before" | "inside" | "after";

export type IntroLayoutDropTarget = {
  parentId: string | null;
  beforeId: string | null;
};

const VIEWS: readonly EntryIntroLayoutView[] = ["pc", "mobile"];
const POSITION_PRECISION = 100;
const SCALE_PRECISION = 1000;
const ROTATION_PRECISION = 10;
const NEW_CHILD_OFFSET = { x: 1, z: 1 };
const NEW_ROOT_OFFSET = { x: 2, z: 2 };
const FIXED_IDS: readonly string[] = ENTRY_INTRO_LAYOUT_OBJECT_IDS;

export function isIntroLayoutModelId(id: string): boolean {
  return ENTRY_INTRO_LAYOUT_MODEL_IDS.includes(id);
}

export function isIntroLayoutPositionOnly(id: string): boolean {
  return ENTRY_INTRO_LAYOUT_POSITION_ONLY_IDS.includes(id);
}

export function getIntroLayoutItemKind(
  document: EntryIntroLayoutDocument,
  id: string
): IntroLayoutItemKind | null {
  if (isIntroLayoutModelId(id)) return "model";

  if (FIXED_IDS.includes(id)) return "fixed";

  const node = findNode(document, id);

  return node?.kind ?? null;
}

export function getIntroLayoutItemIds(document: EntryIntroLayoutDocument): string[] {
  return [
    ...ENTRY_INTRO_LAYOUT_MODEL_IDS,
    ...FIXED_IDS,
    ...document.nodes.flatMap((node) => (node.kind ? [node.id] : [])),
  ];
}

export function getIntroLayoutNode(
  document: EntryIntroLayoutDocument,
  id: string
): EntryIntroLayoutNode | undefined {
  return findNode(document, id);
}

export function getIntroLayoutParent(
  document: EntryIntroLayoutDocument,
  id: string
): string | null {
  return findNode(document, id)?.parent ?? null;
}

export function isIntroLayoutDescendant(
  document: EntryIntroLayoutDocument,
  ancestorId: string,
  id: string
): boolean {
  const seen = new Set<string>();
  let current = getIntroLayoutParent(document, id);

  while (current !== null && !seen.has(current)) {
    if (current === ancestorId) return true;

    seen.add(current);
    current = getIntroLayoutParent(document, current);
  }

  return false;
}

export function getIntroLayoutDescendants(
  document: EntryIntroLayoutDocument,
  ancestorId: string
): string[] {
  return getIntroLayoutItemIds(document).filter((id) =>
    isIntroLayoutDescendant(document, ancestorId, id)
  );
}

export function getIntroLayoutAncestors(document: EntryIntroLayoutDocument, id: string): string[] {
  const ancestors: string[] = [];
  let current = getIntroLayoutParent(document, id);

  while (current !== null && !ancestors.includes(current)) {
    ancestors.push(current);
    current = getIntroLayoutParent(document, current);
  }

  return ancestors;
}

export function getIntroLayoutTopSelection(
  document: EntryIntroLayoutDocument,
  ids: readonly string[]
): string[] {
  return ids.filter(
    (id) => !ids.some((other) => other !== id && isIntroLayoutDescendant(document, other, id))
  );
}

export function getIntroLayoutDropTarget(
  document: EntryIntroLayoutDocument,
  movingIds: readonly string[],
  targetId: string,
  position: IntroLayoutDropPosition
): IntroLayoutDropTarget | null {
  if (!movingIds.length || movingIds.includes(targetId)) return null;

  if (position === "inside" && !canIntroLayoutHaveChildren(document, targetId)) return null;

  const target =
    position === "inside"
      ? { parentId: targetId, beforeId: null }
      : {
          parentId: getIntroLayoutParent(document, targetId),
          beforeId: getSiblingInsertId(document, targetId, position, movingIds),
        };

  return movingIds.every((id) => canIntroLayoutMove(document, id, target.parentId)) ? target : null;
}

export function moveIntroLayoutNodes(
  document: EntryIntroLayoutDocument,
  ids: readonly string[],
  { parentId, beforeId }: IntroLayoutDropTarget
): EntryIntroLayoutDocument {
  return ids.reduce(
    (current, id) => moveIntroLayoutNode(current, id, parentId, beforeId),
    document
  );
}

export function renameIntroLayoutNode(
  document: EntryIntroLayoutDocument,
  id: string,
  name: string
): EntryIntroLayoutDocument {
  if (!findNode(document, id)?.kind) return document;

  return {
    ...document,
    nodes: document.nodes.map((node) => (node.id === id ? { ...node, name } : node)),
  };
}

export function getIntroLayoutTree(document: EntryIntroLayoutDocument): IntroLayoutTreeItem[] {
  const build = (id: string): IntroLayoutTreeItem => ({
    id,
    kind: getIntroLayoutItemKind(document, id) ?? "fixed",
    children: getChildIds(document, id).map(build),
  });
  const listedRootIds = document.nodes.flatMap((node) => (node.parent ? [] : [node.id]));
  const unlistedFixedIds = FIXED_IDS.filter((id) => !findNode(document, id));

  return [...ENTRY_INTRO_LAYOUT_MODEL_IDS, ...listedRootIds, ...unlistedFixedIds].map(build);
}

export function canIntroLayoutMove(
  document: EntryIntroLayoutDocument,
  id: string,
  parentId: string | null
): boolean {
  if (isIntroLayoutModelId(id) || isIntroLayoutPositionOnly(id)) return false;

  if (parentId === null) return true;

  if (parentId === id || isIntroLayoutPositionOnly(parentId)) return false;

  if (getIntroLayoutItemKind(document, parentId) === null) return false;

  return !isIntroLayoutDescendant(document, id, parentId);
}

export function getIntroLayoutWorld(
  document: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView
): Map<string, EntryIntroLayoutPlacement> {
  const { objects } = document[view];

  return composeEntryIntroLayoutWorld(
    document.nodes,
    createEntryIntroLayoutLocals(
      Object.fromEntries(
        Object.entries(objects).map(([id, transform]) => [
          id,
          toEntryIntroLayoutPlacement(transform),
        ])
      )
    )
  );
}

export function getIntroLayoutLocal(
  document: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView,
  id: string
): EntryIntroLayoutPlacement {
  return toEntryIntroLayoutPlacement(getTransform(document[view], id));
}

export function setIntroLayoutLocal(
  document: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView,
  id: string,
  patch: IntroLayoutTransformPatch
): EntryIntroLayoutDocument {
  const current = getIntroLayoutLocal(document, view, id);
  const next = isIntroLayoutPositionOnly(id)
    ? { x: patch.x ?? current.x, z: patch.z ?? current.z, scale: 1, rotation: 0 }
    : { ...current, ...patch };

  return { ...document, [view]: setTransform(document[view], id, toTransform(next)) };
}

export function setIntroLayoutWorldPoint(
  document: EntryIntroLayoutDocument,
  view: EntryIntroLayoutView,
  id: string,
  point: EntryExplorationScenePoint
): EntryIntroLayoutDocument {
  const parentId = getIntroLayoutParent(document, id);
  const world = getIntroLayoutWorld(document, view);
  const parentWorld = parentId ? world.get(parentId) : undefined;
  const current = world.get(id) ?? { ...point, scale: 1, rotation: 0 };
  const target = { ...current, x: point.x, z: point.z };
  const local = parentWorld ? decomposeEntryIntroLayoutPlacement(parentWorld, target) : target;

  return setIntroLayoutLocal(document, view, id, { x: local.x, z: local.z });
}

export function moveIntroLayoutNode(
  document: EntryIntroLayoutDocument,
  id: string,
  parentId: string | null,
  beforeId: string | null = null
): EntryIntroLayoutDocument {
  if (!canIntroLayoutMove(document, id, parentId)) return document;

  const worlds = VIEWS.map((view) => getIntroLayoutWorld(document, view));
  const existing = findNode(document, id) ?? { id };
  const entry: EntryIntroLayoutNode = withParent(existing, parentId);
  const remaining = document.nodes.filter((node) => node.id !== id);
  const beforeIndex = beforeId ? remaining.findIndex((node) => node.id === beforeId) : -1;
  const nodes =
    beforeIndex >= 0
      ? [...remaining.slice(0, beforeIndex), entry, ...remaining.slice(beforeIndex)]
      : [...remaining, entry];
  const moved = { ...document, nodes };

  return VIEWS.reduce((current, view, index) => {
    const world = worlds[index].get(id);

    if (!world) return current;

    const parentWorld = parentId ? worlds[index].get(parentId) : undefined;
    const local = parentWorld ? decomposeEntryIntroLayoutPlacement(parentWorld, world) : world;

    return { ...current, [view]: setTransform(current[view], id, toTransform(local)) };
  }, moved);
}

export function groupIntroLayoutNodes(
  document: EntryIntroLayoutDocument,
  ids: readonly string[],
  groupId: string,
  name: string
): EntryIntroLayoutDocument {
  const members = ids.filter((id) => canIntroLayoutMove(document, id, null));

  if (!members.length || findNode(document, groupId)) return document;

  const parents = new Set(members.map((id) => getIntroLayoutParent(document, id)));
  const parentId = parents.size === 1 ? [...parents][0] : null;
  const firstIndex = document.nodes.findIndex((node) => members.includes(node.id));
  const group: EntryIntroLayoutNode = withParent({ id: groupId, kind: "group", name }, parentId);
  const nodes =
    firstIndex >= 0
      ? [...document.nodes.slice(0, firstIndex), group, ...document.nodes.slice(firstIndex)]
      : [...document.nodes, group];
  const withGroup = VIEWS.reduce<EntryIntroLayoutDocument>(
    (current, view) => {
      const world = getIntroLayoutWorld(document, view);
      const points = members.flatMap((id) => world.get(id) ?? []);
      const center = {
        x: average(points.map(({ x }) => x)),
        z: average(points.map(({ z }) => z)),
        scale: 1,
        rotation: 0,
      };
      const parentWorld = parentId ? world.get(parentId) : undefined;
      const local = parentWorld ? decomposeEntryIntroLayoutPlacement(parentWorld, center) : center;

      return { ...current, [view]: setTransform(current[view], groupId, toTransform(local)) };
    },
    { ...document, nodes }
  );

  return members.reduce((current, id) => moveIntroLayoutNode(current, id, groupId), withGroup);
}

export function ungroupIntroLayoutNode(
  document: EntryIntroLayoutDocument,
  groupId: string
): EntryIntroLayoutDocument {
  if (findNode(document, groupId)?.kind !== "group") return document;

  return removeIntroLayoutNode(document, groupId);
}

export function removeIntroLayoutNode(
  document: EntryIntroLayoutDocument,
  id: string
): EntryIntroLayoutDocument {
  const node = findNode(document, id);

  if (!node?.kind) return document;

  const parentId = node.parent ?? null;
  const lifted = getChildIds(document, id).reduce(
    (current, childId) => moveIntroLayoutNode(current, childId, parentId, id),
    document
  );

  return {
    ...lifted,
    nodes: lifted.nodes.filter((entry) => entry.id !== id),
    pc: removeTransform(lifted.pc, id),
    mobile: removeTransform(lifted.mobile, id),
  };
}

export function addIntroLayoutSticker(
  document: EntryIntroLayoutDocument,
  { id, asset, parentId }: { id: string; asset: string; parentId: string | null }
): EntryIntroLayoutDocument {
  return addIntroLayoutAssetNode(document, { id, kind: "sticker", asset, parentId });
}

export function addIntroLayoutDraftModel(
  document: EntryIntroLayoutDocument,
  { id, asset }: { id: string; asset: string }
): EntryIntroLayoutDocument {
  return addIntroLayoutAssetNode(document, { id, kind: "draftModel", asset, parentId: null });
}

function addIntroLayoutAssetNode(
  document: EntryIntroLayoutDocument,
  {
    id,
    kind,
    asset,
    parentId,
  }: { id: string; kind: "sticker" | "draftModel"; asset: string; parentId: string | null }
): EntryIntroLayoutDocument {
  if (findNode(document, id) || (parentId && !canIntroLayoutHaveChildren(document, parentId))) {
    return document;
  }

  const { targetPosition } = ENTRY_EXPLORATION_SCENE_CONFIG.intro;
  const local = parentId
    ? { ...NEW_CHILD_OFFSET }
    : { x: targetPosition.x + NEW_ROOT_OFFSET.x, z: targetPosition.z + NEW_ROOT_OFFSET.z };
  const node: EntryIntroLayoutNode = withParent(
    { id, kind, asset, name: getAssetName(asset) },
    parentId
  );
  const withNode = { ...document, nodes: [...document.nodes, node] };

  return VIEWS.reduce(
    (current, view) => ({ ...current, [view]: setTransform(current[view], id, local) }),
    withNode
  );
}

export function createIntroLayoutNodeId(
  document: EntryIntroLayoutDocument,
  prefix: string
): string {
  const ids = new Set(getIntroLayoutItemIds(document));
  let index = 1;

  while (ids.has(`${prefix}-${index}`)) index += 1;

  return `${prefix}-${index}`;
}

export function getAssetName(asset: string): string {
  return asset.replace(/\.[^.]+$/, "");
}

export function canIntroLayoutHaveChildren(
  document: EntryIntroLayoutDocument,
  id: string
): boolean {
  return getIntroLayoutItemKind(document, id) !== null && !isIntroLayoutPositionOnly(id);
}

function getSiblingInsertId(
  document: EntryIntroLayoutDocument,
  targetId: string,
  position: "before" | "after",
  movingIds: readonly string[]
): string | null {
  const index = document.nodes.findIndex((node) => node.id === targetId);

  if (index < 0) return null;

  if (position === "before") return targetId;

  return document.nodes.slice(index + 1).find((node) => !movingIds.includes(node.id))?.id ?? null;
}

function getChildIds(document: EntryIntroLayoutDocument, parentId: string): string[] {
  return document.nodes.flatMap((node) => (node.parent === parentId ? [node.id] : []));
}

function findNode(
  document: EntryIntroLayoutDocument,
  id: string
): EntryIntroLayoutNode | undefined {
  return document.nodes.find((node) => node.id === id);
}

function withParent(node: EntryIntroLayoutNode, parentId: string | null): EntryIntroLayoutNode {
  const next: EntryIntroLayoutNode = { ...node };

  delete next.parent;

  return parentId ? { ...next, parent: parentId } : next;
}

function getTransform(view: EntryIntroLayoutViewData, id: string): EntryIntroLayoutTransform {
  return view.objects[id] ?? { x: 0, z: 0 };
}

function setTransform(
  view: EntryIntroLayoutViewData,
  id: string,
  transform: EntryIntroLayoutTransform
): EntryIntroLayoutViewData {
  return { ...view, objects: { ...view.objects, [id]: transform } };
}

function removeTransform(view: EntryIntroLayoutViewData, id: string): EntryIntroLayoutViewData {
  return {
    ...view,
    objects: Object.fromEntries(Object.entries(view.objects).filter(([key]) => key !== id)),
  };
}

function toTransform(placement: EntryIntroLayoutPlacement): EntryIntroLayoutTransform {
  const scale = round(placement.scale, SCALE_PRECISION);
  const rotation = round(placement.rotation, ROTATION_PRECISION);

  return {
    x: round(placement.x, POSITION_PRECISION),
    z: round(placement.z, POSITION_PRECISION),
    ...(scale === 1 ? {} : { scale }),
    ...(rotation === 0 ? {} : { rotation }),
  };
}

function round(value: number, precision: number): number {
  return Math.round(value * precision) / precision + 0;
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}
